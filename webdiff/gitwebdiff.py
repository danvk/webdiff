#!/usr/bin/env python
'''This lets you run "git webdiff" instead of "git difftool".'''

import os
import subprocess
import sys


def any_nonflag_args(args):
    """Do any args not start with '-'? If so, this isn't a HEAD diff."""
    return len([x for x in args if not x.startswith('-')]) > 0


def run():
    if os.environ.get('DEBUG'):
        sys.stderr.write(f'git webdiff invoked as: {sys.argv}\n')

    if not any_nonflag_args(sys.argv[1:]):
        # This tells webdiff that it was invoked as a simple "git webdiff", not
        # "git webdiff <sha>". This allows special treatment (e.g. for
        # staging diffhunks).
        os.environ['WEBDIFF_FROM_HEAD'] = 'yes'

    try:
        # Using symlinks (the default behavior) is desirable because it lets you edit a file and
        # reload the diff page to see updated results. Unfortunately, `git diff --no-index` does
        # not process symlinks so this won't work.
        # See https://public-inbox.org/git/1489877673.24742.1.camel@kaarsemaker.net/t/
        subprocess.call('git difftool -d -x webdiff'.split(' ') + sys.argv[1:])
    except KeyboardInterrupt:
        # Don't raise an exception to the user when sigint is received
        pass


if __name__ == '__main__':
    run()
