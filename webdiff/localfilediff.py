"""This class represents the diff between two files on local disk."""

import os
from dataclasses import dataclass

from webdiff.unified_diff import RawDiffLine


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
    is_move: bool
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

    @staticmethod
    def from_diff_raw_line(line: RawDiffLine, a_dir: str, b_dir: str):
        status = line.status
        # A, C (copy), D, M, R, T (change in type), U (unmerged), X (bug)
        if status == 'A':
            return LocalFileDiff(a_dir, '', b_dir, line.path, is_move=False)
        if status == 'D':
            return LocalFileDiff(a_dir, line.path, b_dir, '', is_move=False)
        if line.dst_path:
            return LocalFileDiff(a_dir, line.path, b_dir, line.dst_path, is_move=True)
        dst_path = os.path.join(b_dir, os.path.relpath(line.path, a_dir))
        return LocalFileDiff(a_dir, line.path, b_dir, dst_path, is_move=False)
