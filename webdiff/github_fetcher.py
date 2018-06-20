"""Produce a left and a right directory to be diffed, no matter the inputs.

This will create symlinks or clone git repos as needed.
"""

# Use this PR for testing to see all four types of change at once:
# https://github.com/danvk/test-repo/pull/2/

from collections import OrderedDict
import os
import re
import subprocess
import sys

from github import Github, UnknownObjectException

from webdiff.util import memoize


@memoize
def github():
    '''Returns a GitHub API object with auth, if it's available.'''
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

            login = kvs.get('user.login')
            if not login:
                return simple_fallback('.githubrc missing user.login. Using anonymous API access.')

            password = kvs.get('user.password')
            token = kvs.get('user.token')

            if password and token:
                raise OnlyPasswordOrToken('Only specify user.token or user.password '
                                          'in your .githubrc file (got both)')

            auth = token or password

            if not auth:
                return simple_fallback('.githubrc has neither user.password nor user.token.'
                                       'Using anonymous API access.')
            return Github(login, auth)
    else:
        return Github()


class NoRemoteError(Exception):
    pass

class UnknownPullRequestError(Exception):
    pass

class OnlyPasswordOrToken(Exception):
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

    g = github()
    for remote in remotes:
        owner = remote['owner']
        repo = remote['repo']
        try:
            g.get_user(owner).get_repo(repo).get_pull(num)
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
        ['git', 'remote', '-v'], stdout=subprocess.PIPE).communicate()[0].decode().split('\n')
    return _parse_remotes(remote_lines)

