import unittest

from nose.tools import *
from webdiff import util

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

    pairs = util.pair_files(a_files, b_files)
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
    diff = util.find_diff('%s/left/dir' % testdir, '%s/right/dir' % testdir)
    eq_(
        [{'a': 'file.json', 'path': 'file.json', 'b': 'renamed.json', 'type': 'move', 'idx': 0},
         {'a': 'file.json', 'path': 'file.json', 'b': None, 'type': 'delete', 'idx': 1}], diff)

def test_is_image_diff():
    assert     util.is_image_diff({'a': 'foo.png', 'b': 'bar.png'})
    assert not util.is_image_diff({'a': 'foo.png.gz', 'b': 'bar.png.gz'})
    assert not util.is_image_diff({'a': 'foo.txt', 'b': 'bar.txt'})
    assert     util.is_image_diff({'a': 'foo.png', 'b': None})
    assert not util.is_image_diff({'a': 'foo.txt', 'b': None})
    assert     util.is_image_diff({'a': None, 'b': 'foo.png'})
    assert not util.is_image_diff({'a': None, 'b': 'foo.txt'})
