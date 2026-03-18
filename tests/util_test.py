import os

from webdiff.util import image_metadata

TESTDATA = os.path.join(os.path.dirname(__file__), '..', 'testdata')


def test_image_metadata_jpg():
    path = os.path.join(TESTDATA, 'images/right/1_normal.jpg')
    md = image_metadata(path)
    assert md['num_bytes'] == 20713
    assert md['width'] == 300
    assert md['height'] == 300


def test_image_metadata_svg():
    path = os.path.join(TESTDATA, 'images/right/colombia.svg')
    md = image_metadata(path)
    assert md['num_bytes'] == 1689203
    assert md['width'] == '2029.0425'
    assert md['height'] == '2296.0974'
