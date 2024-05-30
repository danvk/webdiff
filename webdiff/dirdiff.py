"""Compute the diff between two directories on local disk."""

import os
import logging
import shutil
import subprocess
import tempfile

from webdiff.localfilediff import LocalFileDiff
from webdiff.unified_diff import parse_raw_diff


def contains_symlinks(dir: str):
    """Check whether a directory contains any symlinks.

    If it does, then git diff --no-index will not handle it in the way that we'd
    like. It will diff the target file names rather than their contents. To work
    around this we need to follow the symlinks. Since this might be expensive,
    we'd like to avoid that if possible.
    """
    for root, _dirs, files in os.walk(dir):
        # (git difftool should not produce directory symlinks)
        for file_name in files:
            file_path = os.path.join(root, file_name)
            if os.path.islink(file_path):
                return True
    return False


def make_resolved_dir(dir: str) -> str:
    # TODO: clean up this directory
    temp_dir = tempfile.mkdtemp(prefix='webdiff')
    for root, dirs, files in os.walk(dir):
        for subdir in dirs:
            rel = os.path.relpath(os.path.join(root, subdir), dir)
            os.mkdir(os.path.join(temp_dir, rel))
        for file_name in files:
            src_file = os.path.join(root, file_name)
            rel = os.path.relpath(src_file, dir)
            dst_file = os.path.join(temp_dir, rel)
            shutil.copy(src_file, dst_file, follow_symlinks=True)
    return temp_dir


def gitdiff(a_dir, b_dir, webdiff_config):
    extra_args = webdiff_config['extraDirDiffArgs']
    cmd = 'git diff --raw --no-index'
    if extra_args:
        cmd += ' ' + extra_args
    a_dir_nosym = a_dir
    if contains_symlinks(a_dir):
        a_dir_nosym = make_resolved_dir(a_dir)
        logging.debug(f'Inlined symlinks in left directory {a_dir} -> {a_dir_nosym}')
    b_dir_nosym = b_dir
    if contains_symlinks(b_dir):
        b_dir_nosym = make_resolved_dir(b_dir)
        logging.debug(f'Inlined symlinks in right directory {b_dir} -> {b_dir_nosym}')
    args = cmd.split(' ') + [a_dir_nosym, b_dir_nosym]
    logging.debug('Running git command: %s', args)
    diff_output = subprocess.run(args, capture_output=True)
    # git diff has an exit code of 1 on either a diff _or_ an error.
    # TODO: how to distinguish these cases?
    diff_stdout = diff_output.stdout.decode('utf8')
    # Make it look like the diff was between directories containing symlinks.
    if a_dir != a_dir_nosym:
        diff_stdout = diff_stdout.replace(a_dir_nosym, a_dir)
    if b_dir != b_dir_nosym:
        diff_stdout = diff_stdout.replace(b_dir_nosym, b_dir)
    lines = parse_raw_diff(diff_stdout)
    return [LocalFileDiff.from_diff_raw_line(line, a_dir, b_dir) for line in lines]
