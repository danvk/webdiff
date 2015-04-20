"""Produce a left and a right directory to be diffed, no matter the inputs.

This will create symlinks or clone git repos as needed.
"""

# Use this PR for testing to see all four types of change at once:
# https://github.com/danvk/test-repo/pull/2/

import atexit
from collections import OrderedDict
import errno
import os
import re
import subprocess
import sys
import tempfile

from github import Github, UnknownObjectException

from util import memoize


class GitHubDiff(object):
    def __init__(self, pr, github_file):
        self._pr = pr
        self._file = github_file
        self.type = {
                'modified': 'change',
                'renamed': 'move',
                'added': 'add',
                'removed': 'delete'
                }[github_file.status]
        self._a_path = None
        self._b_path = None

    @property
    def a(self):
        if self.type == 'move':
            return self._file.raw_data['previous_filename']
        elif self.type == 'add':
            return None
        else:
            return self._file.filename

    @property
    def b(self):
        if self.type == 'delete':
            return None
        else:
            return self._file.filename

    # NB: these are @memoize'd via fetch()
    @property
    def a_path(self):
        return fetch(self._pr.base.repo, self.a, self._pr.base.sha)

    @property
    def b_path(self):
        return fetch(self._pr.head.repo, self.b, self._pr.head.sha)

    def __repr__(self):
        return '%s (%s)' % (self.a or self.b, self.type)

    # TOOD: diffstats are accessible via file.{changes,additions,deletions}


@memoize
def fetch(repo, filename, sha):
    if filename is None: return None
    data = repo.get_file_contents(filename, sha).decoded_content
    _, ext = os.path.splitext(filename)
    fd, path = tempfile.mkstemp(suffix=ext)
    open(path, 'wb').write(data)
    return path


@memoize
def _github():
    def simple_fallback(message=None):
        if message: sys.stderr.write(message + '\n')
        return Github()

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
            return Github(kvs['user.login'], kvs['user.password'])
    else:
        return Github()


def fetch_pull_request(owner, repo, num):
    '''Return a list of Diff objects for a pull request.'''
    sys.stderr.write('Loading pull request %s/%s#%s from github...\n' % (
            owner, repo, num))
    g = _github()
    pr = g.get_user(owner).get_repo(repo).get_pull(num)
    files = pr.get_files()

    return [GitHubDiff(pr, f) for f in files]


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
