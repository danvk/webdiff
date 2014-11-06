"""Produce a left and a right directory to be diffed, no matter the inputs.

This will create symlinks or clone git repos as needed.
"""

import atexit
import errno
import os
import tempfile
import sys
from github import Github


temp_dirs = []


def put_in_dir(dirname, filename, contents):
    """Puts contents into filename in dirname.
    
    This creates intermediate directories as needed, e.g. if filename is a/b/c.
    """
    d = os.path.join(dirname, os.path.dirname(filename))
    try:
        os.makedirs(d)
    except OSError, e:
        # be happy if someone already created the path
        if e.errno != errno.EEXIST:
            raise
    open(os.path.join(dirname, filename), 'w').write(contents)


def fetch_pull_request(owner, repo, num):
    """Pull down the pull request into two local directories.

    Returns before_dir, after_dir.
    """
    sys.stderr.write('Loading pull request %s/%s#%s from github...\n' % (owner, repo, num))
    g = Github('danvk', open('/tmp/gp').read().strip())
    pr = g.get_user(owner).get_repo(repo).get_pull(num)
    base_repo = pr.base.repo
    head_repo = pr.head.repo
    files = list(pr.get_files())

    a_dir, b_dir = tempfile.mkdtemp(), tempfile.mkdtemp()
    temp_dirs.extend([a_dir, b_dir])

    for f in files:
        sys.stderr.write('  %s...\n' % f.filename)
        if f.status == 'modified' or f.status == 'deleted':
            contents = base_repo.get_file_contents(f.filename, pr.base.sha).decoded_content
            put_in_dir(a_dir, f.filename, contents)
        if f.status == 'modified' or f.status == 'added':
            contents = head_repo.get_file_contents(f.filename, pr.head.sha).decoded_content
            put_in_dir(b_dir, f.filename, contents)
        # f.status == 'moved'?

    return a_dir, b_dir


@atexit.register
def _cleanup():
    """Delete any temporary directories which were created by two_folders()."""
    #for d in temp_dirs:
    #    os.removedirs(d)
