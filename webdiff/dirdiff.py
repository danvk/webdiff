'''Compute the diff between two directories on local disk.'''

from collections import defaultdict
import os
import subprocess

from webdiff.localfilediff import LocalFileDiff
from webdiff import util
from webdiff.unified_diff import parse_raw_diff


def gitdiff(a_dir, b_dir):
    diff_output = subprocess.run(
        'git diff --raw --no-index'.split(' ') + [a_dir, b_dir],
        capture_output=True
    )
    # git diff has an exit code of 1 on either a diff _or_ an error.
    # TODO: how to distinguish these cases?
    lines = parse_raw_diff(diff_output.stdout.decode('utf8'))
    diffs = [LocalFileDiff.from_diff_raw_line(line, a_dir, b_dir) for line in lines]
    for diff in diffs:
        print(diff)
    return diffs

# LocalFileDiff(a_root='testdata/dygraphsjs/left', a_path='', b_root='testdata/dygraphsjs/right', b_path='testdata/dygraphsjs/right/auto_tests/tests/fill_step_plot.js', is_move=False)
# LocalFileDiff(a_root='testdata/dygraphsjs/left', a_path='testdata/dygraphsjs/left/./dygraph-canvas.js', b_root='testdata/dygraphsjs/right', b_path='testdata/dygraphsjs/right/./dygraph-canvas.js', is_move=False)
# LocalFileDiff(a_root='testdata/dygraphsjs/left', a_path='testdata/dygraphsjs/left/auto_tests/misc/local.html', b_root='testdata/dygraphsjs/right', b_path='testdata/dygraphsjs/right/auto_tests/misc/local.html', is_move=False)


def diff(a_dir, b_dir):
    pairs = find_diff(a_dir, b_dir)
    moves, pairs = find_moves(pairs)

    diffs = [
        LocalFileDiff(a_dir, a, b_dir, b, False) for a, b in pairs
    ] + [
        LocalFileDiff(a_dir, a, b_dir, b, True) for a, b in moves
    ]

    # sort "change" before "delete" in a move, which is easier to understand.
    diffs.sort(key=lambda d: (d.a_path, 0 if d.b else 1))

    return diffs


def find_diff(a, b):
    """Walk directories a and b and pair off files.

    Returns a list of pairs of full paths to matched a/b files.
    """

    def list_files(top_dir):
        file_list = []
        for root, _, files in os.walk(top_dir):
            root = os.path.relpath(root, start=top_dir)
            for name in files:
                file_list.append(os.path.join(root, name))
        return file_list

    assert os.path.isdir(a)
    assert os.path.isdir(b)

    a_files = list_files(a)
    b_files = list_files(b)

    pairs = pair_files(a_files, b_files)

    def safejoin(d, p):
        if p == '':
            return ''
        return os.path.join(d, p)

    return [(safejoin(a, arel), safejoin(b, brel)) for arel, brel in pairs]


def pair_files(a_files, b_files):
    '''Paths must be relative to the diff root for each side.'''
    pairs = []
    for f in a_files[:]:
        if f in b_files:
            i = a_files.index(f)
            j = b_files.index(f)
            pairs.append((f, f))
            del a_files[i]
            del b_files[j]
        else:
            pairs.append((f, ''))  # delete

    for f in b_files:
        pairs.append(('', f))  # add

    return pairs


def find_moves(pairs):
    """Separate the file move pairs from other file pairs"""
    # If a file is just moved, then the added file and the deleted file
    # will both put their idx into the same key of the dictionary
    add_delete_pairs = defaultdict(lambda: [None, None])
    for idx, (a, b) in enumerate(pairs):
        if b and not a:  # add
            add_delete_pairs[util.contentHash(b)][1] = idx
        elif a and not b:  # delete
            add_delete_pairs[util.contentHash(a)][0] = idx

    indices_to_omit = []
    moves = []
    for _, (aIdx, bIdx) in add_delete_pairs.items():
        if (aIdx is not None) and (bIdx is not None):
            # replace the "add" and "delete" with a "change"
            indices_to_omit.extend([aIdx, bIdx])
            moves.append((pairs[aIdx][0], pairs[bIdx][1]))

    remaining_pairs = [pair for i, pair in enumerate(pairs) if i not in indices_to_omit]

    return moves, remaining_pairs
