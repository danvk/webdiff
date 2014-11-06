from webdiff import argparser

import tempfile
import os
from nose.tools import *

_, file1 = tempfile.mkstemp()
_, file2 = tempfile.mkstemp()
dir1 = tempfile.mkdtemp()
dir2 = tempfile.mkdtemp()

def test_file_dir_pairs():
    eq_({'files': (file1, file2)}, argparser.parse([file1, file2]))
    eq_({'dirs': (dir1, dir2)}, argparser.parse([dir1, dir2]))

    with assert_raises(argparser.UsageError):
        argparser.parse([file1, dir1])
    with assert_raises(argparser.UsageError):
        argparser.parse([dir2, file2])


def test_port():
    eq_({'files': (file1, file2), 'port': 12345},
        argparser.parse(['--port', '12345', file1, file2]))


def test_github_pull_request():
    eq_({'github': {'owner': 'danvk', 'repo': 'dygraphs', 'num': 292}},
        argparser.parse(['https://github.com/danvk/dygraphs/pull/292']))
    eq_({'github': {'owner': 'danvk', 'repo': 'dygraphs', 'num': 292}},
        argparser.parse(['https://github.com/danvk/dygraphs/pull/292/']))
    eq_({'github': {'owner': 'danvk', 'repo': 'dygraphs', 'num': 292}},
        argparser.parse(['https://github.com/danvk/dygraphs/pull/292/files']))
    eq_({'github': {'owner': 'danvk', 'repo': 'dygraphs', 'num': 292}},
        argparser.parse(['https://github.com/danvk/dygraphs/pull/292/commits']))
