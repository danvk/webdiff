"""
Utilities for interacting with a local git repository.
"""

import json
from pygit2 import Repository
from _pygit2 import Signature, Commit
from util import get_fields

_repo = None
try:
    _repo = Repository('.git')
except KeyError:
    pass


def repo():
    if _repo:
        return _repo
    raise Exception('Not in a git repository')


class CommitEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Commit):
            return get_fields(obj, ['hex', 'message', 'author'])
        if isinstance(obj, Signature):
            return get_fields(obj, ['name', 'email', 'time'])
        return super(CommitEncoder, self).default(obj)


