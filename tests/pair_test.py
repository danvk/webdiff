import unittest

from nose.tools import *
from webdiff import util
from webdiff import diff
from webdiff import dirdiff

def test_pairing():
    a_files = [
        'app.py',
        'TODO',
        'static/js/file_diff.js',
        'static/jsdifflib/diffview.css',
        'static/jsdifflib/diffview.js',
        'templates/heartbeat.html']

    b_files = [
        'app.py',
        'testing.cfg',
        'TODO',
        'static/js/file_diff.js',
        'static/jsdifflib/diffview.css',
        'static/jsdifflib/diffview.js',
        'templates/heartbeat.html']

    pairs = dirdiff.pair_files(a_files, b_files)
    pairs.sort()

    eq_(
        [(None, 'testing.cfg'),
         ('TODO', 'TODO'),
         ('app.py', 'app.py'),
         ('static/js/file_diff.js', 'static/js/file_diff.js'),
         ('static/jsdifflib/diffview.css', 'static/jsdifflib/diffview.css'),
         ('static/jsdifflib/diffview.js', 'static/jsdifflib/diffview.js'),
         ('templates/heartbeat.html', 'templates/heartbeat.html'),
         ], pairs)


def test_pairing_with_move():
    testdir = 'testdata/renamedfile'
    diffs = dirdiff.diff('%s/left/dir' % testdir, '%s/right/dir' % testdir)
    eq_([{
          'a': 'file.json',
          'b': 'renamed.json',
          'type': 'move',
         },
         {
          'a': 'file.json',
          'b': None,
          'type': 'delete',
         }], [diff.get_thin_dict(d) for d in diffs])


class TinyDiff(object):
    def __init__(self, a, b):
        self.a_path = a
        self.b_path = b


def test_is_image_diff():
    assert     diff.is_image_diff(TinyDiff('foo.png', 'bar.png'))
    assert not diff.is_image_diff(TinyDiff('foo.png.gz', 'bar.png.gz'))
    assert not diff.is_image_diff(TinyDiff('foo.txt', 'bar.txt'))
    assert     diff.is_image_diff(TinyDiff('foo.png', None))
    assert not diff.is_image_diff(TinyDiff('foo.txt', None))
    assert     diff.is_image_diff(TinyDiff(None, 'foo.png'))
    assert not diff.is_image_diff(TinyDiff(None, 'foo.txt'))
