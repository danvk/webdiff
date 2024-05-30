"""Utility code for working with Diff objects.

Diff objects must have these properties:
    - a      Name of the file on the left side of a diff
    - a_path Path to a copy of the left side file on local disk.
    - b      (like a)
    - b_path (like a_path)
    - type   One of {'change', 'move', 'add', 'delete'}

For concrete implementations, see githubdiff and localfilediff.
"""

import logging
import mimetypes
import os
import subprocess
from typing import List

from webdiff import util
from webdiff.localfilediff import LocalFileDiff
from webdiff.unified_diff import Code, diff_to_codes


def get_thin_dict(diff):
    """Returns a dict containing minimal data on the diff.

    This includes:
      - before/after file name
      - change type (add, delete, move, change)
      - (in the future) diffstats
    """
    return {'a': diff.a, 'b': diff.b, 'type': diff.type}


def fast_num_lines(path: str) -> int:
    # See https://stackoverflow.com/q/9629179/388951 for the idea to use a Unix command.
    # Unfortunately `wc -l` ignores the last line if there is no trailing newline. So
    # instead, see https://stackoverflow.com/a/38870057/388951
    return int(subprocess.check_output(['grep', '-c', '', path]))


def get_diff_ops(diff: LocalFileDiff, git_diff_args=None) -> List[Code]:
    """Run git diff on the file pair and convert the results to a sequence of codes.

    git_diff_args is passed directly to git diff. It can be something like ['-w'] or
    ['-w', '--diff-algorithm=patience'].
    """
    # git diff --no-index doesn't follow symlinks. So we help it a bit.
    a_path = os.path.realpath(diff.a_path) if diff.a_path else ''
    b_path = os.path.realpath(diff.b_path) if diff.b_path else ''
    if a_path and b_path:
        num_lines = fast_num_lines(b_path)
        args = (
            'git diff --no-index'.split(' ') + (git_diff_args or []) + [a_path, b_path]
        )
        logging.debug('Running git command: %s', args)
        diff_output = subprocess.run(args, capture_output=True)
        codes = diff_to_codes(diff_output.stdout.decode('utf8'), num_lines)
        if not codes:
            # binary diff; these are rendered as "binary file (123 bytes)"
            # so a 1-line replace is best here.
            codes = [Code(type='replace', before=(0, 1), after=(0, 1))]
        return codes
    elif a_path:
        num_lines = fast_num_lines(a_path)
        return [Code('delete', before=(0, num_lines), after=(0, 0))]
    elif b_path:
        num_lines = fast_num_lines(b_path)
        return [Code('insert', before=(0, 0), after=(0, num_lines + 1))]


def get_thick_dict(diff):
    """Similar to thin_dict, but includes potentially expensive fields."""
    d = get_thin_dict(diff)
    d.update({'is_image_diff': is_image_diff(diff), 'no_changes': no_changes(diff)})
    if d['is_image_diff']:
        if d['a']:
            d['image_a'] = util.image_metadata(diff.a_path)
        if d['b']:
            d['image_b'] = util.image_metadata(diff.b_path)
        if d['a'] and d['b']:
            try:
                d['are_same_pixels'], _ = util.generate_pdiff_image(
                    diff.a_path, diff.b_path
                )
            except util.ImageMagickError:
                d['are_same_pixels'] = False
            except util.ImageMagickNotAvailableError:
                pass
    return d


def get_thin_list(diffs, thick_idx=None):
    """Convert a list of diffs to dicts. This adds an 'idx' field."""
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
    """Determine whether this diff is appropriate for image diff UI.

    This uses the a_path and b_path properties of the diff object.
    """

    def is_image(path):
        if path == '':
            return False
        mime_type, enc = mimetypes.guess_type(path)
        return mime_type and mime_type.startswith('image/') and enc is None

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
    """Given a side & path, find the index in the diff for it.

    Returns None if there's no diff for the (side, path) pair.
    """
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
