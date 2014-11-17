#!/usr/bin/env python
'''Web-based file differ.

For usage, see README.md.
'''

import logging
import mimetypes
import os
import requests
import socket
import sys
from threading import Timer
import time
import webbrowser

from flask import (Flask, render_template, send_from_directory,
                   request, jsonify, Response)

import util
import argparser


def determine_path():
    """Borrowed from wxglade.py"""
    try:
        root = __file__
        if os.path.islink (root):
            root = os.path.realpath (root)
        return os.path.dirname (os.path.abspath (root))
    except:
        print "I'm sorry, but something is wrong."
        print "There is no __file__ variable. Please contact the author."
        sys.exit()

def is_hot_reload():
    """In debug mode, Werkzeug reloads the app on any changes."""
    return os.environ.get('WERKZEUG_RUN_MAIN')


class Config:
    pass
    #TESTING=True  # not exactly sure what this does...

app = Flask(__name__)
app.config.from_object(Config)
app.config.from_envvar('WEBDIFF_CONFIG', silent=True)

A_DIR = None
B_DIR = None
DIFF = None
PORT = None

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


@app.route("/<side>/get_contents", methods=['POST'])
def get_contents(side):
    assert side in ('a', 'b')
    path = request.form.get('path', '')
    if not path:
        e = {"code": "incomplete",
             "message": "Incomplete request (need path)"}
        response = jsonify(e)
        response.status_code = 400
        return response

    try:
        abs_path = os.path.join(A_DIR if side == 'a' else B_DIR,
                                os.path.normpath(path))  # / --> \ on windows
        is_binary = util.is_binary_file(abs_path)
        if is_binary:
            size = os.path.getsize(abs_path)
            contents = "Binary file (%d bytes)" % size
        else:
            contents = open(abs_path).read()
        return Response(contents, mimetype='text/plain')
    except Exception:
        e = {"code": "read-error",
             "message": "Unable to read %s" % abs_path}
        response = jsonify(e)
        response.status_code = 400
        return response


@app.route("/<side>/image/<path:path>")
def get_image(side, path):
    assert side in ('a', 'b')
    if not path:
        e = {"code": "incomplete",
             "message": "Incomplete request (need path)"}
        response = jsonify(e)
        response.status_code = 400
        return response

    mime_type, enc = mimetypes.guess_type(path)
    if not mime_type.startswith('image/') or enc is not None:
        e = {"code": "wrongtype",
             "message": "Requested file of type (%s, %s) as image" % (
                 mime_type, enc)}
        response = jsonify(e)
        response.status_code = 400
        return response

    try:
        abs_path = os.path.join(A_DIR if side == 'a' else B_DIR,
                                os.path.normpath(path))  # / --> \ on windows
        contents = open(abs_path).read()
        return Response(contents, mimetype=mime_type)
    except Exception:
        e = {"code": "read-error",
             "message": "Unable to read %s" % abs_path}
        response = jsonify(e)
        response.status_code = 400
        return response


# Show the first diff by default
@app.route("/")
def index():
    return file_diff('0')


@app.route("/<int:idx>")
def file_diff(idx):
    idx = int(idx)
    return render_template('file_diff.html',
                           idx=idx,
                           pairs=DIFF)


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
    if 'STAY_RUNNING' in app.config:
        return 'Will stay running.'

    last_ms = LAST_REQUEST_MS
    def shutdown():
        if LAST_REQUEST_MS <= last_ms:  # subsequent requests abort shutdown
            requests.post('http://localhost:%d/seriouslykill' % PORT)
        else:
            pass

    Timer(0.5, shutdown).start()
    
    return 'Shutting down...'


def open_browser():
    global PORT
    if not 'NO_OPEN_BROWSER' in app.config:
        if is_hot_reload():
            log.debug('Skipping browser open on reload')
        else:
            webbrowser.open_new_tab('http://localhost:%s' % PORT)


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


def abs_path(path):
    '''Changes relative paths to be abs w/r/t/ the original cwd.'''
    if os.path.isabs(path):
        return path
    else:
        return os.path.join(os.getcwd(), path)


def run():
    global A_DIR, B_DIR, DIFF, PORT
    try:
        parsed_args = argparser.parse(sys.argv[1:])
    except argparser.UsageError as e:
        sys.stderr.write('Error: %s\n\n' % e.message)
        usage_and_die()

    A_DIR, B_DIR, DIFF = util.diff_for_args(parsed_args)

    if app.config['TESTING'] or app.config['DEBUG']:
        sys.stderr.write('Diffing:\nA: %s\nB: %s\n\n' % (A_DIR, B_DIR))

    PORT = pick_a_port(parsed_args)

    sys.stderr.write('''Serving diffs on http://localhost:%s
Close the browser tab or hit Ctrl-C when you're done.
''' % PORT)
    logging.info('Diff: %r', DIFF)
    Timer(0.1, open_browser).start()
    app.run(host='0.0.0.0', port=PORT)


if __name__ == '__main__':
    run()
