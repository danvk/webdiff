'''This class represents the diff between two files on local disk.'''

import os


class LocalFileDiff(object):
    def __init__(self, a_root, a_path, b_root, b_path, is_move):
        '''A before/after file pair on local disk
        
        Args:
            a_path, b_path: full paths to the files on disk. Either (but not
                both) may be empty.
            a_root, b_root: Paths to the root of diff.
            is_move: Is this a pure move between the two files?
        '''
        assert (a_path != '') or (b_path != '')
        self.a_path = a_path
        self.b_path = b_path
        self.a_root = a_root
        self.b_root = b_root
        self.is_move = is_move

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
