'''Compute the diff between two directories on local disk.'''

import logging
import subprocess

from webdiff.localfilediff import LocalFileDiff
from webdiff.unified_diff import parse_raw_diff


def gitdiff(a_dir, b_dir, webdiff_config):
    extra_args = webdiff_config['extraDirDiffArgs']
    cmd = 'git diff --raw --no-index'
    if extra_args:
        cmd += ' ' + extra_args
    args = cmd.split(' ') + [a_dir, b_dir]
    logging.debug('Running git command: %s', args)
    diff_output = subprocess.run(args, capture_output=True)
    # git diff has an exit code of 1 on either a diff _or_ an error.
    # TODO: how to distinguish these cases?
    lines = parse_raw_diff(diff_output.stdout.decode('utf8'))
    return [LocalFileDiff.from_diff_raw_line(line, a_dir, b_dir) for line in lines]
