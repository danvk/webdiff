from unidiff import PatchSet

from webdiff.unified_diff import add_replaces, diff_to_codes, read_codes


def test_mixed_diff():
    diff = open("testdata/unified/dygraphs-patch.txt").read()
    assert diff_to_codes(diff) == [
        ("equal", (0, 2), (0, 2)),
        ("delete", (2, 3), (2, 2)),
        ("equal", (3, 6), (2, 5)),
        ("skip", (6, 7), (5, 6)),
        ("equal", (7, 10), (6, 9)),
        ("replace", (10, 11), (9, 10)),
        ("equal", (11, 14), (10, 13)),
        ("replace", (14, 15), (13, 15)),
        ("equal", (15, 19), (15, 19)),
        ("insert", (19, 19), (19, 20)),
        ("equal", (19, 22), (20, 23)),
        # ("skip", (22, 25), (23, 26)),
    ]


delete_hunk = '''diff --git a/tmp/before.js b/tmp/after.js
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
'''


def test_read_codes_delete():
    codes = read_codes(PatchSet.from_string(delete_hunk))
    assert codes == [
        ('equal', (0, 2), (0, 2)),
        ('delete', (2, 3), (2, 2)),
        ('equal', (3, 6), (2, 5)),
    ]


skip_insert_hunk = '''diff --git a/tmp/requirements.txt b/requirements.txt
index 041d7f0..507435c 100644
--- a/tmp/requirements.txt
+++ b/requirements.txt
@@ -3,4 +3,5 @@ pytest==7.1.3
 PyGithub==1.55
 pillow
 requests
+binaryornot
 black'''


def test_read_codes_skip():
    codes = read_codes(PatchSet.from_string(skip_insert_hunk))
    assert codes == [
        ('skip', (0, 2), (0, 2)),
        ('equal', (2, 5), (2, 5)),
        ('insert', (5, 5), (5, 6)),
        ('equal', (5, 6), (6, 7)),
    ]


replace_hunk = '''diff --git a/tmp/requirements.txt b/requirements.txt
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
 binaryornot'''


def test_read_codes_replace():
    codes = read_codes(PatchSet.from_string(replace_hunk))
    assert codes == [
        ('equal', (0, 2), (0, 2)),
        ('delete', (2, 3), (2, 2)),
        ('insert', (3, 3), (2, 3)),
        ('equal', (3, 6), (3, 6)),
    ]


def test_add_replaces():
    codes = [
        ('equal', (0, 2), (0, 2)),
        ('delete', (2, 3), (2, 2)),
        ('insert', (3, 3), (2, 3)),
        ('equal', (3, 6), (3, 6)),
    ]
    assert add_replaces(codes) == [
        ('equal', (0, 2), (0, 2)),
        ('replace', (2, 3), (2, 3)),
        ('equal', (3, 6), (3, 6)),
    ]
