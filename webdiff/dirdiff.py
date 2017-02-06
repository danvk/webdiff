'''Compute the diff between two directories on local disk.'''

from collections import defaultdict
import copy
import os

from webdiff.localfilediff import LocalFileDiff
from webdiff import util


def diff(a_dir, b_dir):
    pairs = find_diff(a_dir, b_dir)
    moves, pairs = find_moves(pairs)

    diffs = (
        [LocalFileDiff(a_dir, a, b_dir, b, False) for a, b in pairs] +
        [LocalFileDiff(a_dir, a, b_dir, b, True) for a, b in moves])

    # sort "change" before "delete" in a move, which is easier to understand.
    diffs.sort(key=lambda diff: (diff.a_path, 0 if diff.b else 1))

    return diffs


def find_diff(a, b):
    '''Walk directories a and b and pair off files.
    
    Returns a list of pairs of full paths to matched a/b files.
    '''

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
        if p is None: return None
        return os.path.join(d, p)

    return [(safejoin(a, arel),
             safejoin(b, brel)) for arel, brel in pairs]


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
            pairs.append((f, None))  # delete

    for f in b_files:
        pairs.append((None, f))  # add

    return pairs


def find_moves(pairs):
    add_delete_pairs = defaultdict(lambda: [None,None])
    for idx, (a, b) in enumerate(pairs):
        if b and not a:  # add
            add_delete_pairs[util.contentHash(b)][1] = idx
        elif a and not b:  # delete
            add_delete_pairs[util.contentHash(a)][0] = idx

    indices_to_delete = []
    moves = []
    for _, (aIdx, bIdx) in add_delete_pairs.items():
        if aIdx == None or bIdx == None:
            continue

        # replace the "add" with a "change"
        indices_to_delete.append(bIdx)
        moves.append((pairs[aIdx][0], pairs[bIdx][1]))

    remaining_pairs = copy.deepcopy(pairs)
    for idx in reversed(sorted(indices_to_delete)):
        del remaining_pairs[idx]

    return moves, remaining_pairs
