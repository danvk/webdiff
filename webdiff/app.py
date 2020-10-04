#!/usr/bin/env python
'''Web-based file differ.

For usage, see README.md.
'''

from __future__ import print_function
from binaryornot.check import is_binary
import logging
import mimetypes
import os
import platform
import requests
import socket
import sys
from threading import Timer
import time
import webbrowser

from flask import (Flask, render_template, send_from_directory, send_file,
                   request, jsonify, Response)

from webdiff import diff
from webdiff import util
from webdiff import argparser

VERSION = '0.15.0'


def determine_path():
    """Borrowed from wxglade.py"""
    try:
        root = __file__
        if os.path.islink (root):
            root = os.path.realpath (root)
        return os.path.dirname (os.path.abspath (root))
    except:
        print("I'm sorry, but something is wrong.")
        print("There is no __file__ variable. Please contact the author.")
        sys.exit()

def is_hot_reload():
    """In debug mode, Werkzeug reloads the app on any changes."""
    return os.environ.get('WERKZEUG_RUN_MAIN')


class Config:
    TESTING=False  # not exactly sure what this does...
    JSONIFY_PRETTYPRINT_REGULAR=False

app = Flask(__name__)
app.config.from_object(Config)
app.config.from_envvar('WEBDIFF_CONFIG', silent=True)

DIFF = None
PORT = None
HOSTNAME = 'localhost'

if app.config['TESTING'] or app.config['DEBUG']:
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    app.logger.addHandler(handler)
    for logname in ['']:
        log = logging.getLogger(logname)
        log.setLevel(logging.DEBUG)
        log.addHandler(handler)
    logging.getLogger('github').setLevel(logging.ERROR)
else:
    # quiet down werkzeug -- no need to log every request.
    logging.getLogger('werkzeug').setLevel(logging.ERROR)


LAST_REQUEST_MS = 0
@app.before_request
def update_last_request_ms():
    global LAST_REQUEST_MS
    LAST_REQUEST_MS = time.time() * 1000


def error(code, message):
    e = {"code": code, "message": message}
    response = jsonify(e)
    response.status_code = 400
    return response


@app.route("/<side>/get_contents", methods=['POST'])
def get_contents(side):
    if side not in ('a', 'b'):
        return error('invalid side', 'Side must be "a" or "b", got %s' % side)

    # TODO: switch to index? might be simpler
    path = request.form.get('path', '')
    if not path:
        return error('incomplete', 'Incomplete request (need path)')

    idx = diff.find_diff_index(DIFF, side, path)
    if idx is None:
        return error('not found', 'Invalid path on side %s: %s' % (side, path))

    d = DIFF[idx]
    abs_path = d.a_path if side == 'a' else d.b_path

    try:
        if is_binary(abs_path):
            size = os.path.getsize(abs_path)
            contents = "Binary file (%d bytes)" % size
        else:
            contents = open(abs_path).read()
        return Response(contents, mimetype='text/plain')
    except Exception:
        return error('read-error', 'Unable to read %s' % abs_path)


@app.route("/<side>/image/<path:path>")
def get_image(side, path):
    if side not in ('a', 'b'):
        return error('invalid side', 'Side must be "a" or "b", got %s' % side)

    # TODO: switch to index? might be simpler
    if not path:
        return error('incomplete', 'Incomplete request (need path)')

    mime_type, enc = mimetypes.guess_type(path)
    if not mime_type or not mime_type.startswith('image/') or enc is not None:
        return error('wrongtype', 'Requested file of type (%s, %s) as image' % (
                 mime_type, enc))

    idx = diff.find_diff_index(DIFF, side, path)
    if idx is None:
        return error('not found', 'Invalid path on side %s: %s' % (side, path))

    d = DIFF[idx]
    abs_path = d.a_path if side == 'a' else d.b_path

    try:
        contents = open(abs_path, mode='rb').read()
        return Response(contents, mimetype=mime_type)
    except Exception:
        return error('read-error', 'Unable to read %s' % abs_path)


@app.route("/pdiff/<int:idx>")
def get_pdiff(idx):
    idx = int(idx)
    d = DIFF[idx]
    try:
        _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
        dilated_image = util.generate_dilated_pdiff_image(pdiff_image)
    except util.ImageMagickNotAvailableError:
        return 'ImageMagick is not available', 501
    except util.ImageMagickError as e:
        return 'ImageMagick error %s' % e, 501
    return send_file(dilated_image)


@app.route("/pdiffbbox/<int:idx>")
def get_pdiff_bbox(idx):
    idx = int(idx)
    d = DIFF[idx]
    try:
        _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
        bbox = util.get_pdiff_bbox(pdiff_image)
    except util.ImageMagickNotAvailableError:
        return 'ImageMagick is not available', 501
    except util.ImageMagickError as e:
        return 'ImageMagick error %s' % e, 501
    return jsonify(bbox)


# Show the first diff by default
@app.route("/")
def index():
    return file_diff('0')


@app.route("/<int:idx>")
def file_diff(idx):
    idx = int(idx)
    pairs = diff.get_thin_list(DIFF)
    return render_template('file_diff.html',
                           idx=idx,
                           has_magick=util.is_imagemagick_available(),
                           pairs=pairs)


@app.route('/thick/<int:idx>')
def thick_diff(idx):
    idx = int(idx)
    return jsonify(diff.get_thick_dict(DIFF[idx]))


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/img'),
                               'favicon.ico',
                               mimetype='image/vnd.microsoft.icon')


@app.route('/seriouslykill', methods=['POST'])
def seriouslykill():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()
    return "Shutting down..."


@app.route('/kill', methods=['POST'])
def kill():
    global PORT
    if 'STAY_RUNNING' in app.config:
        return 'Will stay running.'

    last_ms = LAST_REQUEST_MS
    def shutdown():
        if LAST_REQUEST_MS <= last_ms:  # subsequent requests abort shutdown
            requests.post('http://%s:%d/seriouslykill' % (HOSTNAME, PORT))
        else:
            pass

    Timer(0.5, shutdown).start()

    return 'Shutting down...'


def open_browser():
    global PORT
    global HOSTNAME
    if not 'NO_OPEN_BROWSER' in app.config:
        if is_hot_reload():
            log.debug('Skipping browser open on reload')
        else:
            webbrowser.open_new_tab('http://%s:%s' % (HOSTNAME, PORT))


def usage_and_die():
    sys.stderr.write(argparser.USAGE)
    sys.exit(1)


def pick_a_port(args):
    if 'port' in args != -1:
        return args['port']

    if os.environ.get('WEBDIFF_PORT'):
        return int(os.environ.get('WEBDIFF_PORT'))

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def abs_path_from_rel(path):
    '''Changes relative paths to be abs w/r/t/ the original cwd.'''
    if os.path.isabs(path):
        return path
    else:
        return os.path.join(os.getcwd(), path)


def is_webdiff_from_head():
    '''Was webdiff invoked as `git webdiff` with no other non-flag args?'''
    return os.environ.get('WEBDIFF_FROM_HEAD') is not None


def run():
    global DIFF, PORT, HOSTNAME
    try:
        parsed_args = argparser.parse(sys.argv[1:], VERSION)
    except argparser.UsageError as e:
        sys.stderr.write('Error: %s\n\n' % e)
        usage_and_die()

    DIFF = argparser.diff_for_args(parsed_args)

    if app.config['TESTING'] or app.config['DEBUG']:
        sys.stderr.write('Diff:\n%s' % DIFF)

    PORT = pick_a_port(parsed_args)

    if app.config.get('USE_HOSTNAME'):
        _hostname = platform.node()
        # platform.node will return empty string if it can't find the hostname
        if not _hostname:
            sys.stderr.write('Warning: hostname could not be determined')
        else:
            HOSTNAME = _hostname

    sys.stderr.write('''Serving diffs on http://%s:%s
Close the browser tab or hit Ctrl-C when you're done.
''' % (HOSTNAME, PORT))
    Timer(0.1, open_browser).start()
    app.run(host=HOSTNAME, port=PORT)


if __name__ == '__main__':
    run()
