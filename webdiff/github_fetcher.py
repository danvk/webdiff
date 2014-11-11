"""Produce a left and a right directory to be diffed, no matter the inputs.

This will create symlinks or clone git repos as needed.
"""

import atexit
from collections import OrderedDict
import errno
import os
import re
import subprocess
import sys
import tempfile

from github import Github, UnknownObjectException


temp_dirs = []

_github_memo = None
def _github():
    global _github_memo
    if _github_memo: return _github_memo

    def simple_fallback(message=None):
        global _github_memo
        if message: sys.stderr.write(message + '\n')
        _github_memo = Github()
        return _github_memo

    github_rc = os.path.join(os.path.expanduser('~'), '.githubrc')
    if os.path.exists(github_rc):
        try:
            pairs = open(github_rc).read()
        except IOError:
            return simple_fallback('Unable to read .githubrc file. Using anonymous API access.')
        else:
            kvs = {}
            for line in pairs.split('\n'):
                if ':' not in line: continue
                k, v = line.split(': ', 1)
                kvs[k] = v

            if not kvs.get('user.login'):
                return simple_fallback('.githubrc missing user.login. Using anonymous API access.')
            if not kvs.get('user.password'):
                return simple_fallback('.githubrc missing user.password. Using anonymous API access.')
            _github_memo = Github(kvs['user.login'], kvs['user.password'])
    else:
        _github_memo = Github()
    return _github_memo


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
    g = _github()
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


class NoRemoteError(Exception):
    pass

class UnknownPullRequestError(Exception):
    pass


def get_pr_repo(num):
    """Returns (owner, repo, num) for the PR number for this git repo.

    If there are multiple remotes, this will pick the first one which has a PR
    with the given number (which will hopefully be unique!).
    """
    remotes = _get_github_remotes()
    if len(remotes) == 0:
        raise NoRemoteError('Unable to find a github remote for the current '
                            'directory. Are you in a git repo? Try running '
                            '`git remote -v` to debug.')

    g = _github()
    for remote in remotes:
        owner = remote['owner']
        repo = remote['repo']
        try:
            pr = g.get_user(owner).get_repo(repo).get_pull(num)
            return (owner, repo, num)
        except UnknownObjectException:
            pass

    raise UnknownPullRequestError(
            'Unable to find a github repo with a pull request number %d' % num)


# Tools for getting the github remotes for this repo
# Based on ryan-williams/git-helpers

def _uniqueify(iterable):
    return list(OrderedDict.fromkeys(iterable))


def _get_github_remotes():
    '''Returns a list of github remotes for the current repo.'''
    remotes = _uniqueify([remote for remote in _get_remotes().values()
                                 if remote.group('host') == 'github.com'])
    def parse(remote):
        m = re.match(r'^([^/]+)/([^/]+)\.git$', remote)
        assert m, 'Unable to parse github remote %s' % remote
        return {'owner': m.group(1), 'repo': m.group(2)}

    return [parse(remote.group('path')) for remote in remotes]


# e.g. 'origin	git@github.com:danvk/expandable-image-grid.git (push)'
ssh_push_re = re.compile(
    '(?P<name>[^\s]+)\s+((?P<user>[^@]+)@)?(?P<host>[^:]+)(?::(?P<path>[^\s]+))?\s\(push\)')

# e.g. 'origin	https://github.com/danvk/git-helpers.git (push)'
https_push_re = re.compile(
    r'(?P<name>[^\s]+)\s+https?://(?P<host>[^/]+)/(?P<path>[^\s]+)\s\(push\)')


def _parse_remote(remote):
    return re.match(https_push_re, remote) or re.match(ssh_push_re, remote)


def _parse_remotes(remote_lines):
    return {remote.group('name'): remote
            for remote in map(_parse_remote, remote_lines)
            if remote}


def _get_remotes():
    remote_lines = subprocess.Popen(
        ['git', 'remote', '-v'], stdout=subprocess.PIPE).communicate()[0].split('\n')
    return _parse_remotes(remote_lines)



@atexit.register
def _cleanup():
    """Delete any temporary directories which were created by two_folders()."""
    #for d in temp_dirs:
    #    os.removedirs(d)
