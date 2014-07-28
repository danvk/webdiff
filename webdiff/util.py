'''Utility code for webdiff'''
import os
import hashlib
from collections import defaultdict
import copy
import mimetypes

textchars = ''.join(map(chr, [7,8,9,10,12,13,27] + range(0x20, 0x100)))
is_binary_string = lambda bytes: bool(bytes.translate(None, textchars))

def is_binary_file(filename):
  return is_binary_string(open(filename, 'rb').read(1024))


def find_diff(a, b):
    '''Walk directories a and b and pair off files.'''
    a_files = []
    b_files = []
    def accum(arg, dirname, fnames):
        for fname in fnames:
            path = os.path.join(dirname, fname)
            if not os.path.isdir(path):
                arg.append(path)

    assert os.path.isdir(a)
    assert os.path.isdir(b)

    os.path.walk(a, accum, a_files)
    os.path.walk(b, accum, b_files)

    a_files = [os.path.relpath(x, start=a) for x in a_files]
    b_files = [os.path.relpath(x, start=b) for x in b_files]

    pairs = pair_files(a_files, b_files)
    diff = find_moves(annotate_pairs(pairs), a, b)

    # this sorts "changes" before "delete" in a move, which is much easier to understand.
    diff.sort(key=lambda x: (x['path'], 0 if x['b'] else 1))
    for i, d in enumerate(diff):
        d['idx'] = i
    return diff


def pair_files(a_files, b_files):
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


def annotate_pairs(pairs):
    diffs = []
    for i, (a, b) in enumerate(pairs):
        d = { 'a': a, 'b': b, 'path': b or a, 'type': 'change' }
        if a is None:
            d['type'] = 'add'
        elif b is None:
            d['type'] = 'delete'
        diffs.append(d)
    return diffs


def find_moves(diff, a_dir, b_dir):
    def hash(d, path):
        return hashlib.sha512(open(os.path.join(d, path)).read()).digest()

    out = copy.deepcopy(diff)
    add_delete_pairs = defaultdict(lambda: [None,None])

    for idx, pair in enumerate(diff):
        if pair['type'] == 'add':
            add_delete_pairs[hash(b_dir, pair['b'])][1] = idx
        elif pair['type'] == 'delete':
            add_delete_pairs[hash(a_dir, pair['a'])][0] = idx

    for _, (aIdx, bIdx) in add_delete_pairs.iteritems():
        if aIdx == None or bIdx == None:
            continue

        a = diff[aIdx]
        b = diff[bIdx]

        # replace the "add" with a "change"
        out[bIdx] = {
            'a': a['a'],
            'b': b['b'],
            'path': a['a'],  # ???
            'type': 'move'
        }

    return out


def is_image_diff(diff):
    def is_image(path):
        if path is None: return False
        mime_type, enc = mimetypes.guess_type(path)
        return (mime_type and mime_type.startswith('image/') and enc is None)

    left_img = is_image(diff['a'])
    right_img = is_image(diff['b'])

    if left_img and right_img:
        return True
    elif left_img and diff['b'] is None:
        return True
    elif right_img and diff['a'] is None:
        return True
    return False
