'''Utility code for working with Diff objects.

Diff objects must have these properties:
    - a      Name of the file on the left side of a diff      
    - a_path Path to a copy of the left side file on local disk.
    - b      (like a)
    - b_path (like a_path)
    - type   One of {'change', 'move', 'add', 'delete'}

For concrete implementations, see githubdiff and localfilediff.
'''

import mimetypes
import os

from webdiff import util

def get_thin_dict(diff):
    '''Returns a dict containing minimal data on the diff.

    This includes:
      - before/after file name
      - change type (add, delete, move, change)
      - diffstats
    '''
    return {
        'a': diff.a,
        'b': diff.b,
        'type': diff.type
    }


def get_thick_dict(diff):
    '''Similar to thin_dict, but includes potentially expensive fields.'''
    d = get_thin_dict(diff)
    d.update({
        'is_image_diff': is_image_diff(diff),
        'no_changes': no_changes(diff)
    })
    if d['is_image_diff']:
        if d['a']: d['image_a'] = util.image_metadata(diff.a_path)
        if d['b']: d['image_b'] = util.image_metadata(diff.b_path)
        if d['a'] and d['b']:
            try:
                d['are_same_pixels'], _ = util.generate_pdiff_image(
                        diff.a_path, diff.b_path)
            except util.ImageMagickError:
                d['are_same_pixels'] = False
            except util.ImageMagickNotAvailableError:
                pass
    return d


def get_thin_list(diffs, thick_idx=None):
    '''Convert a list of diffs to dicts. This adds an 'idx' field.'''
    ds = [get_thin_dict(d) for d in diffs]
    if thick_idx is not None:
        ds[thick_idx] = get_thick_dict(ds[thick_idx])
    for i, d in enumerate(ds):
        d['idx'] = i
    return ds


def no_changes(diff):
    if diff.a_path and diff.b_path:
        return util.are_files_identical(diff.a_path, diff.b_path)
    return False


def is_image_diff(diff):
    '''Determine whether this diff is appropriate for image diff UI.

    This uses the a_path and b_path properties of the diff object.
    '''
    def is_image(path):
        if path == '':
            return False
        mime_type, enc = mimetypes.guess_type(path)
        return (mime_type and mime_type.startswith('image/') and enc is None)

    left_img = is_image(diff.a_path)
    right_img = is_image(diff.b_path)

    if left_img and right_img:
        return True
    elif left_img and diff.b_path == '':
        return True
    elif right_img and diff.a_path == '':
        return True
    return False


def find_diff_index(diffs, side, path):
    '''Given a side & path, find the index in the diff for it.
    
    Returns None if there's no diff for the (side, path) pair.
    '''
    assert side in ('a', 'b')
    def norm(p):
        if p == '':
            return ''
        return os.path.normpath(p)

    path = norm(path)
    for idx, diff in enumerate(diffs):
        if side == 'a' and norm(diff.a) == path:
            return idx
        if side == 'b' and norm(diff.b) == path:
            return idx
    return None
