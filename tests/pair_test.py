from webdiff import diff


class TinyDiff(object):
    def __init__(self, a, b):
        self.a_path = a
        self.b_path = b


def test_is_image_diff():
    assert diff.is_image_diff(TinyDiff('foo.png', 'bar.png'))
    assert not diff.is_image_diff(TinyDiff('foo.png.gz', 'bar.png.gz'))
    assert not diff.is_image_diff(TinyDiff('foo.txt', 'bar.txt'))
    assert diff.is_image_diff(TinyDiff('foo.png', ''))
    assert not diff.is_image_diff(TinyDiff('foo.txt', ''))
    assert diff.is_image_diff(TinyDiff('', 'foo.png'))
    assert not diff.is_image_diff(TinyDiff('', 'foo.txt'))
