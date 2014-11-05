"""Produce a left and a right directory to be diffed, no matter the inputs.

This will create symlinks or clone git repos as needed.
"""

import atexit
import os
import tempfile


temp_dirs = []


def fetch_pull_request(owner, repo, num):
    """Pull down the pull request into two local directories.

    Returns before_dir, after_dir.
    """


@atexit.register
def _cleanup():
    """Delete any temporary directories which were created by two_folders()."""
    for d in temp_dirs:
        os.removedirs(d)
