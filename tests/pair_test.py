import unittest

from webdiff import util

class PairFilesTest(unittest.TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_pairing(self):
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

        self.assertEquals(
            [(None, 'testing.cfg'),
             ('TODO', 'TODO'),
             ('app.py', 'app.py'),
             ('static/js/file_diff.js', 'static/js/file_diff.js'),
             ('static/jsdifflib/diffview.css', 'static/jsdifflib/diffview.css'),
             ('static/jsdifflib/diffview.js', 'static/jsdifflib/diffview.js'),
             ('templates/heartbeat.html', 'templates/heartbeat.html'),
             ], pairs)

    def test_pairing_with_move(self):
        testdir = 'testdata/renamedfile'
        diff = util.find_diff('%s/left' % testdir, '%s/right' % testdir)
        self.assertEquals(
            [{'a': 'file.json', 'path': 'file.json', 'b': 'renamed.json', 'type': 'move', 'idx': 0},
             {'a': 'file.json', 'path': 'file.json', 'b': None, 'type': 'delete', 'idx': 1}], diff)


    def test_is_image_diff(self):
        self.assertTrue(util.is_image_diff({'a': 'foo.png', 'b': 'bar.png'}))
        self.assertFalse(util.is_image_diff({'a': 'foo.png.gz', 'b': 'bar.png.gz'}))
        self.assertFalse(util.is_image_diff({'a': 'foo.txt', 'b': 'bar.txt'}))
        self.assertTrue(util.is_image_diff({'a': 'foo.png', 'b': None}))
        self.assertFalse(util.is_image_diff({'a': 'foo.txt', 'b': None}))
        self.assertTrue(util.is_image_diff({'a': None, 'b': 'foo.png'}))
        self.assertFalse(util.is_image_diff({'a': None, 'b': 'foo.txt'}))


if __name__ == '__main__':
    unittest.main()
