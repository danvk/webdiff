'''Utility code for webdiff'''
import functools
import hashlib
import os
import re
import subprocess
import tempfile

from PIL import Image


class ImageMagickNotAvailableError(Exception):
    pass


class ImageMagickError(Exception):
    pass


# via https://wiki.python.org/moin/PythonDecoratorLibrary#Memoize
def memoize(obj):
    """Decorator to memoize a function."""
    cache = obj.cache = {}

    @functools.wraps(obj)
    def memoizer(*args, **kwargs):
        key = str(args) + str(kwargs)
        if key not in cache:
            cache[key] = obj(*args, **kwargs)
        return cache[key]
    return memoizer


@memoize
def contentHash(path):
    return hashlib.sha512(open(path, mode='rb').read()).digest()


def are_files_identical(path1, path2):
    # Check if anything has changed.
    # Compare lengths & then checksums.
    if os.path.getsize(path1) != os.path.getsize(path2):
        return False
    return contentHash(path1) == contentHash(path2)


def image_metadata(path):
    '''Returns a dict with metadata about the image located at path.'''
    md = { 'num_bytes': os.path.getsize(path) }
    try:
        im = Image.open(path)
        width, height = im.size
        md.update({'width': width, 'height': height})
    except:
        pass
    return md



@memoize
def is_imagemagick_available():
    try:
        # this swallows stdout/stderr
        subprocess.check_output(['identify', '--version'])
    except (subprocess.CalledProcessError, OSError):
        return False
    return True


@memoize
def generate_pdiff_image(before_path, after_path):
    '''Generate a perceptual diff between the before/after images.

    This runs the ImageMagick compare command.

    Returns: (are_images_identical, path_to_pdiff_png)
    '''
    if not is_imagemagick_available():
        raise ImageMagickNotAvailableError()

    _, diff_path = tempfile.mkstemp(suffix='.png')

    # The compare command returns:
    #   0 on success & similar images
    #   1 on success & dissimilar images
    #   2 on failure
    PIPE = subprocess.PIPE
    p = subprocess.Popen([
            'compare',
            '-metric', 'RMSE',
            '-highlight-color', 'Red',
            '-compose', 'Src',
            before_path, after_path, diff_path
        ], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = p.communicate()  # `compare` is noisy; this swallows its output
    result = p.returncode

    if result == 2:
        raise ImageMagickError('compare failed. Perhaps image dimensions differ.')
    if result == 0:
        return True, diff_path
    return False, diff_path


@memoize
def generate_dilated_pdiff_image(diff_path):
    '''Given a pdiff image, dilate it to highlight small differences.'''
    if not is_imagemagick_available():
        raise ImageMagickNotAvailableError()

    # Dilate the diff image (to highlight small differences) and make it red.
    _, diff_dilate_path = tempfile.mkstemp(suffix='.png')
    subprocess.check_call([
        'convert',
        diff_path,
        '-monochrome',
        '-negate',
        '-morphology', 'Dilate', 'Disk:5.5',
        '-negate',
        '-fill', 'Red', '-opaque', 'Black',
        diff_dilate_path
    ])
    return diff_dilate_path


@memoize
def get_pdiff_bbox(diff_path):
    '''Returns {top,left,width,height} for the content of a pdiff.'''
    if not is_imagemagick_available():
        raise ImageMagickNotAvailableError()

    out = subprocess.check_output(['identify', '-format', '%@', diff_path])
    # This looks like "26x94+0+830"
    m = re.match(r'^(\d+)x(\d+)\+(\d+)\+(\d+)', out.decode('utf8'))
    if not m:
        raise ImageMagickError('Unexpected identify output: %s' % out)
    width, height, left, top = [int(x) for x in m.groups()]
    return {
        'width': width,
        'height': height,
        'left': left,
        'top': top,
        'bottom': top + height,
        'right': left + width
    }
