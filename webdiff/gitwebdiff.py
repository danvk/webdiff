#!/usr/bin/env python
"""This lets you run "git webdiff" instead of "git difftool"."""

import os
import subprocess
import sys


def any_nonflag_args(args):
    """Do any args not start with '-'? If so, this isn't a HEAD diff."""
    return len([x for x in args if not x.startswith('-')]) > 0


def run():
    if os.environ.get('DEBUG'):
        sys.stderr.write(f'git webdiff invoked as: {sys.argv}\n')

    try:
        cmd = (
            'webdiff'
            if not os.environ.get('DEBUG')
            else os.path.join(os.path.curdir, 'test.sh')
        )
        subprocess.call(f'git difftool -d -x {cmd}'.split(' ') + sys.argv[1:])
    except KeyboardInterrupt:
        # Don't raise an exception to the user when sigint is received
        pass


if __name__ == '__main__':
    run()
