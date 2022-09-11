'''This class represents the diff between two files on local disk.'''

import os
from dataclasses import dataclass

@dataclass
class LocalFileDiff:
    """A before/after file pair on local disk"""
    a_root: str
    """Path to the root dir of the left side of the diff"""
    a_path: str
    """Full path to the left file on disk (may be empty)."""
    b_root: str
    """Path to the root dir of the right side of the diff"""
    b_path: str
    """Full path to the right file on disk (may be empty if a_path != '')."""
    is_move: str
    """Is this a move between the two files?"""

    @property
    def a(self):
        if self.a_path == '':
            return ''
        return os.path.relpath(self.a_path, self.a_root)

    @property
    def b(self):
        if self.b_path == '':
            return ''
        return os.path.relpath(self.b_path, self.b_root)

    @property
    def type(self):
        if self.a_path == '':
            return 'add'
        elif self.b_path == '':
            return 'delete'
        elif self.is_move:
            return 'move'
        return 'change'

    def __repr__(self):
        return '%s/%s (%s)' % (self.a, self.b, self.type)
