#!/usr/bin/env python
'''This lets you run "git webdiff" instead of "git difftool".'''

import os
import subprocess
import sys


def run():
    os.environ['WEBDIFF_GIT_MODE'] = '1'
    sys.exit(subprocess.call(
        'git difftool -d -x webdiff'.split(' ') + sys.argv[1:]))


if __name__ == '__main__':
    run()
