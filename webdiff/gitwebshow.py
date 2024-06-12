#!/usr/bin/env python
"""git webshow REF is shorthand for git webdiff REF^..REF."""

import os
import sys

from webdiff import gitwebdiff


def run():
    if os.environ.get('DEBUG'):
        sys.stderr.write(f'git webshow invoked as: {sys.argv}\n')

    obj = sys.argv.pop()

    gitwebdiff.run([*sys.argv, f'{obj}^..{obj}'])


if __name__ == '__main__':
    run()
