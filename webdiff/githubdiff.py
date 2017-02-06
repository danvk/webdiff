'''Diff class for GitHub pull requests.

The main feature of note is that this fetches files from GitHub lazily when
a_path and b_path are accessed. This allows large PRs to be loaded quickly
--more quickly than GitHub's UI does it!
'''

import os
import tempfile
import sys

from webdiff.util import memoize
from webdiff.github_fetcher import github


class GitHubDiff(object):
    '''pr and github_file are objects from the Python GitHub API.'''
    def __init__(self, pr, github_file):
        self._pr = pr
        self._file = github_file
        self.type = {
                'modified': 'change',
                'changed': 'change',  # How does this differ from 'modified'?
                'renamed': 'move',
                'added': 'add',
                'removed': 'delete'
                }[github_file.status]
        self._a_path = ''
        self._b_path = ''

    @property
    def a(self):
        if self.type == 'move':
            return self._file.raw_data['previous_filename']
        elif self.type == 'add':
            return ''
        else:
            return self._file.filename

    @property
    def b(self):
        if self.type == 'delete':
            return ''
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


def fetch_pull_request(owner, repo, num):
    '''Return a list of Diff objects for a pull request.'''
    sys.stderr.write('Loading pull request %s/%s#%s from github...\n' % (
            owner, repo, num))
    g = github()
    pr = g.get_user(owner).get_repo(repo).get_pull(num)
    files = pr.get_files()

    return [GitHubDiff(pr, f) for f in files]


@memoize
def fetch(repo, filename, sha):
    if filename == '':
        return ''
    data = repo.get_file_contents(filename, sha).decoded_content
    _, ext = os.path.splitext(filename)
    fd, path = tempfile.mkstemp(suffix=ext)
    open(path, 'wb').write(data)
    return path
