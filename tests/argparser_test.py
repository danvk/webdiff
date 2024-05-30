from webdiff import argparser

import tempfile
import pytest

_, file1 = tempfile.mkstemp()
_, file2 = tempfile.mkstemp()
dir1 = tempfile.mkdtemp()
dir2 = tempfile.mkdtemp()


def test_file_dir_pairs():
    assert {'files': (file1, file2)} == argparser.parse([file1, file2])
    assert {'dirs': (dir1, dir2)} == argparser.parse([dir1, dir2])

    with pytest.raises(argparser.UsageError):
        argparser.parse([file1, dir1])
    with pytest.raises(argparser.UsageError):
        argparser.parse([dir2, file2])


def test_port():
    assert {'files': (file1, file2), 'port': 12345} == argparser.parse(
        ['--port', '12345', file1, file2]
    )


def test_github_pull_request():
    assert {
        "github": {"owner": "danvk", "repo": "dygraphs", "num": 292}
    } == argparser.parse(["https://github.com/danvk/dygraphs/pull/292"])
    assert {
        "github": {"owner": "danvk", "repo": "dygraphs", "num": 292}
    } == argparser.parse(["https://github.com/danvk/dygraphs/pull/292/"])
    assert {
        "github": {"owner": "danvk", "repo": "dygraphs", "num": 292}
    } == argparser.parse(["https://github.com/danvk/dygraphs/pull/292/files"])
    assert {
        "github": {"owner": "danvk", "repo": "dygraphs", "num": 292}
    } == argparser.parse(["https://github.com/danvk/dygraphs/pull/292/commits"])
