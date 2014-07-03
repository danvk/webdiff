#!/usr/bin/env python
'''Web-based file differ.

For usage, see README.md.
'''

import json
import logging
import os
import re
import socket
import sys
from threading import Timer
import time
import urllib
import webbrowser

from flask import (Flask, render_template, send_from_directory,
                   request, jsonify, Response)
from werkzeug.serving import WSGIRequestHandler


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

# This is essential when run from distutils and does no harm otherwise.
path = determine_path()
os.chdir(path)

# This is essential when run via pyinstaller --one-file.
try:
    os.chdir(sys._MEIPASS)
except Exception:
    pass  # probably in dev mode.

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
    for logname in ['github', '']:
        log = logging.getLogger(logname)
        log.setLevel(logging.DEBUG)
        log.addHandler(handler)
else:
    # quiet down werkzeug -- no need to log every request.
    logging.getLogger('werkzeug').setLevel(logging.ERROR)


def find_diff(a, b):
    '''Walk directories a and b and pair off files.'''
    a_files = []
    b_files = []
    def accum(arg, dirname, fnames):
        for fname in fnames:
            path = os.path.join(dirname, fname)
            if not os.path.isdir(path):
                arg.append(path)

    os.path.walk(a, accum, a_files)
    os.path.walk(b, accum, b_files)

    a_files = [os.path.relpath(x, start=a) for x in a_files]
    b_files = [os.path.relpath(x, start=b) for x in b_files]

    pairs = pair_files(a_files, b_files)
    return annotate_pairs(pairs)


def pair_files(a_files, b_files):
    pairs = []
    for f in a_files[:]:
        if f in b_files:
            i = a_files.index(f)
            j = b_files.index(f)
            pairs.append((f, f))
            del a_files[i]
            del b_files[j]
        else:
            pairs.append((f, None))  # delete

    for f in b_files:
        pairs.append((None, f))  # add

    pairs.sort(key=lambda x: x[0] or x[1])
    return pairs


def annotate_pairs(pairs):
    diffs = []
    for i, (a, b) in enumerate(pairs):
        d = { 'idx': i, 'a': a, 'b': b, 'path': b or a, 'type': 'change' }
        if a is None:
            d['type'] = 'add'
        elif b is None:
            d['type'] = 'delete'
        diffs.append(d)
    return diffs


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
        abs_path = os.path.join(A_DIR if side == 'a' else B_DIR, path)
        contents = open(abs_path).read()
        return Response(contents, mimetype='text/plain')
    except Exception:
        e = {"code": "read-error",
             "message": "Unable to read %s" % abs_path}
        response = jsonify(e)
        response.status_code = 400
        return response


# Show the first diff by default
@app.route("/")
def index():
    if not 'NO_FRAME' in app.config:
        return render_template('heartbeat.html', src='/0')
    else:
        return file_diff('0')


@app.route("/<idx>")
def file_diff(idx):
    idx = int(idx)
    path = DIFF[idx]['a'] or DIFF[idx]['b']
    return render_template('file_diff.html',
                           idx=idx,
                           pairs=DIFF,
                           this_pair=DIFF[idx],
                           num_pairs=len(DIFF))


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static/img'),
                               'favicon.ico',
                               mimetype='image/vnd.microsoft.icon')


@app.route('/kill', methods=['POST'])
def kill():
    if 'STAY_RUNNING' in app.config: return
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()
    return "Shutting down..."


def open_browser():
    global PORT
    if not 'NO_OPEN_BROWSER' in app.config:
        webbrowser.open_new_tab('http://localhost:%s' % PORT)


def usage_and_die():
    sys.stderr.write(
'''Usage: webdiff <left_dir> <right_dir>

When using git difftool, make sure you run "git difftool -d".
''')
    sys.exit(1)


def pick_a_port():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def run():
    global A_DIR, B_DIR, DIFF, PORT
    assert len(sys.argv) == 3
    A_DIR = sys.argv[1]
    B_DIR = sys.argv[2]
    if not os.path.isdir(A_DIR) or not os.path.isdir(B_DIR):
        usage_and_die()

    PORT = pick_a_port()

    if app.config['TESTING'] or app.config['DEBUG']:
        sys.stderr.write('Diffing:\nA: %s\nB: %s\n\n' % (A_DIR, B_DIR))

    sys.stderr.write('''Serving diffs on http://localhost:%s
Close the browser tab or hit Ctrl-C when you're done.
''' % PORT)
    DIFF = find_diff(A_DIR, B_DIR)
    Timer(0.1, open_browser).start()
    app.run(host='0.0.0.0', port=PORT)


if __name__ == '__main__':
    run()
