import unittest

import app

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
        
        self.assertEquals(
            [('TODO', 'TODO'),
             ('app.py', 'app.py'),
             ('static/js/file_diff.js', 'static/js/file_diff.js'),
             ('static/jsdifflib/diffview.css', 'static/jsdifflib/diffview.css'),
             ('static/jsdifflib/diffview.js', 'static/jsdifflib/diffview.js'),
             ('templates/heartbeat.html', 'templates/heartbeat.html'),
             (None, 'testing.cfg')], app.pair_files(a_files, b_files))


if __name__ == '__main__':
    unittest.main()
