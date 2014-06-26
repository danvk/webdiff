#!/usr/bin/env python
'''Web-based file differ.

For usage, see README.md.
'''

import json
import logging
import os
import re
import sys
import urllib

from flask import (Flask, url_for, render_template, flash, send_from_directory,
                   request, jsonify, session, redirect, Response)

app = Flask(__name__)

A_DIR = None
B_DIR = None
DIFF = None


def find_diff(a, b):
    '''Walk directories a and b and pair off files.'''
    a_files = []
    b_files = []
    def accum(arg, dirname, fnames):
        for fname in fnames:
            arg.append(os.path.join(dirname, fname))

    os.path.walk(a, accum, a_files)
    os.path.walk(b, accum, b_files)

    a_files = [os.path.relpath(x, start=a) for x in a_files]
    b_files = [os.path.relpath(x, start=b) for x in b_files]

    pairs = pair_files(a_files, b_files)
    return annotate_pairs(pairs)


def pair_files(a_files, b_files):
    pairs = []
    for i, f in enumerate(a_files):
        if f in b_files:
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
    return file_diff(0)


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


if __name__ == '__main__':
    assert len(sys.argv) == 3
    A_DIR = sys.argv[1]
    B_DIR = sys.argv[2]
    sys.stderr.write('Diffing %s and %s\n' % (A_DIR, B_DIR))
    DIFF = find_diff(A_DIR, B_DIR)
    app.run(host='0.0.0.0', debug=True)
