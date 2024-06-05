from unidiff import PatchSet

from webdiff.unified_diff import (
    Code,
    RawDiffLine,
    add_replaces,
    diff_to_codes,
    parse_raw_diff,
    read_codes,
)


def test_mixed_diff():
    diff = open('testdata/unified/dygraphs-patch.txt').read()
    codes = diff_to_codes(diff)
    assert codes == [
        Code(type='equal', before=(0, 2), after=(0, 2)),
        Code(type='delete', before=(2, 3), after=(2, 2)),
        Code(type='equal', before=(3, 6), after=(2, 5)),
        Code(type='skip', before=(6, 7), after=(5, 6)),
        Code(type='equal', before=(7, 10), after=(6, 9)),
        Code(type='replace', before=(10, 11), after=(9, 10)),
        Code(type='equal', before=(11, 14), after=(10, 13)),
        Code(type='replace', before=(14, 15), after=(13, 15)),
        Code(type='equal', before=(15, 19), after=(15, 19)),
        Code(type='insert', before=(19, 19), after=(19, 20)),
        Code(type='equal', before=(19, 22), after=(20, 23)),
        # ("skip", (22, 25), (23, 26)),
    ]


def test_mixed_diff_with_num_lines():
    diff = open('testdata/unified/dygraphs-patch.txt').read()
    codes = diff_to_codes(diff, 26)
    assert codes == [
        Code(type='equal', before=(0, 2), after=(0, 2)),
        Code(type='delete', before=(2, 3), after=(2, 2)),
        Code(type='equal', before=(3, 6), after=(2, 5)),
        Code(type='skip', before=(6, 7), after=(5, 6)),
        Code(type='equal', before=(7, 10), after=(6, 9)),
        Code(type='replace', before=(10, 11), after=(9, 10)),
        Code(type='equal', before=(11, 14), after=(10, 13)),
        Code(type='replace', before=(14, 15), after=(13, 15)),
        Code(type='equal', before=(15, 19), after=(15, 19)),
        Code(type='insert', before=(19, 19), after=(19, 20)),
        Code(type='equal', before=(19, 22), after=(20, 23)),
        Code(type='skip', before=(22, 25), after=(23, 26)),
    ]


def test_diff_with_more_context():
    diff = open('testdata/unified/dygraphs-patch-u5.txt').read()
    codes = diff_to_codes(diff)
    assert codes == [
        Code(type='equal', before=(0, 2), after=(0, 2)),
        Code(type='delete', before=(2, 3), after=(2, 2)),
        Code(type='equal', before=(3, 10), after=(2, 9)),
        Code(type='replace', before=(10, 11), after=(9, 10)),
        Code(type='equal', before=(11, 14), after=(10, 13)),
        Code(type='replace', before=(14, 15), after=(13, 15)),
        Code(type='equal', before=(15, 19), after=(15, 19)),
        Code(type='insert', before=(19, 19), after=(19, 20)),
        Code(type='equal', before=(19, 24), after=(20, 25)),
    ]


delete_hunk = """diff --git a/tmp/before.js b/tmp/after.js
index 63a4828..cea3ddd 100644
--- a/tmp/before.js
+++ b/tmp/after.js
@@ -1,6 +1,5 @@
 /**
  * Convert a JS date to a string appropriate to display on an axis that
- * is displaying values at the stated granularity.
  * @param {Date} date The date to format
  * @param {number} granularity One of the Dygraph granularity constants
  * @return {string} The formatted date
"""


def test_read_codes_delete():
    codes = read_codes(PatchSet.from_string(delete_hunk))
    assert codes == [
        Code(type='equal', before=(0, 2), after=(0, 2)),
        Code(type='delete', before=(2, 3), after=(2, 2)),
        Code(type='equal', before=(3, 6), after=(2, 5)),
    ]


skip_insert_hunk = """diff --git a/tmp/requirements.txt b/requirements.txt
index 041d7f0..507435c 100644
--- a/tmp/requirements.txt
+++ b/requirements.txt
@@ -3,4 +3,5 @@ pytest==7.1.3
 PyGithub==1.55
 pillow
 requests
+binaryornot
 black"""


def test_read_codes_skip():
    codes = read_codes(PatchSet.from_string(skip_insert_hunk))
    assert codes == [
        Code(type='skip', before=(0, 2), after=(0, 2), header='pytest==7.1.3'),
        Code(type='equal', before=(2, 5), after=(2, 5)),
        Code(type='insert', before=(5, 5), after=(5, 6)),
        Code(type='equal', before=(5, 6), after=(6, 7)),
    ]


replace_hunk = """diff --git a/tmp/requirements.txt b/requirements.txt
index 4be90b9..507435c 100644
--- a/tmp/requirements.txt
+++ b/requirements.txt
@@ -1,6 +1,6 @@
 flask==2.2.2
 pytest==7.1.3
-PyGithub==2.55
+PyGithub==1.55
 pillow
 requests
 binaryornot"""


def test_read_codes_replace():
    codes = read_codes(PatchSet.from_string(replace_hunk))
    assert codes == [
        Code('equal', before=(0, 2), after=(0, 2)),
        Code('delete', before=(2, 3), after=(2, 2)),
        Code('insert', before=(3, 3), after=(2, 3)),
        Code('equal', before=(3, 6), after=(3, 6)),
    ]


def test_add_replaces():
    codes = [
        Code(type='equal', before=(0, 2), after=(0, 2)),
        Code(type='delete', before=(2, 3), after=(2, 2)),
        Code(type='insert', before=(3, 3), after=(2, 3)),
        Code(type='equal', before=(3, 6), after=(3, 6)),
    ]
    assert add_replaces(codes) == [
        Code(type='equal', before=(0, 2), after=(0, 2)),
        Code(type='replace', before=(2, 3), after=(2, 3)),
        Code(type='equal', before=(3, 6), after=(3, 6)),
    ]


def test_parse_raw_diff_many():
    # git diff --no-index --raw testdata/manyfiles/{left,right}
    diff = open('testdata/unified/manyfiles.txt').read()
    mod644 = ['100644', '100644', '0000000', '0000000']
    assert parse_raw_diff(diff) == [
        RawDiffLine(
            '100644',
            '100644',
            'f00c965',
            'f00c965',
            'R',
            'testdata/manyfiles/left/d.txt',
            score=100,
            dst_path='testdata/manyfiles/right/a.txt',
        ),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/b.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/c.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/e.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/f.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/g.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/h.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/i.txt'),
        RawDiffLine(*mod644, 'M', 'testdata/manyfiles/left/j.txt'),
    ]


def test_parse_raw_diff_rename():
    # git diff --no-index --raw testdata/rename+change/{left,right}
    diff = open('testdata/unified/rename+change.txt').read()
    assert parse_raw_diff(diff) == [
        RawDiffLine(
            '100644',
            '100644',
            '4dc9e64',
            'ccb4941',
            'R',
            'testdata/rename+change/left/huckfinn.txt',
            score=90,
            dst_path='testdata/rename+change/right/huckfinn.md',
        ),
    ]


binary_diff = """diff --git a/left/smiley.png.gz b/right/smiley.png.gz
index 0bcfe40..6fbd5fd 100644
Binary files a/left/smiley.png.gz and b/right/smiley.png.gz differ
"""


def test_parse_binary_diff():
    assert read_codes(PatchSet.from_string(binary_diff)) is None
