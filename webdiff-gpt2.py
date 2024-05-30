#!/usr/bin/env python
'''Web-based file differ.

For usage, see README.md.
'''

import cgi
import json
import logging
import mimetypes
import os
import platform
import requests
import socket
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

from binaryornot.check import is_binary
from webdiff import diff, util, argparser, options

VERSION = '1.0.0'
HOSTNAME = 'localhost'
PORT = 8080
GIT_CONFIG = {}
DIFF = None
LAST_REQUEST_MS = 0

logging.basicConfig(level=logging.DEBUG if 'DEBUG' in os.environ else logging.INFO)
logger = logging.getLogger(__name__)


def determine_path():
    """Borrowed from wxglade.py"""
    try:
        root = __file__
        if os.path.islink(root):
            root = os.path.realpath(root)
        return os.path.dirname(os.path.abspath(root))
    except Exception as e:
        print(f"I'm sorry, but something is wrong. Error: {e}")
        print("There is no __file__ variable. Please contact the author.")
        sys.exit()


class CustomHTTPRequestHandler(BaseHTTPRequestHandler):
    def send_response_with_json(self, code, payload):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def do_GET(self):
        global LAST_REQUEST_MS
        LAST_REQUEST_MS = time.time() * 1000
        parsed_path = urlparse(self.path)
        path_elements = parsed_path.path.strip('/').split('/')

        if path_elements[0] == "":
            self.handle_index()
        elif path_elements[0] == "favicon.ico":
            self.handle_favicon()
        elif path_elements[0] == "theme.css":
            self.handle_theme()
        elif len(path_elements) == 3 and path_elements[1] == "image":
            self.handle_image(path_elements[0], path_elements[2])
        elif len(path_elements) == 2 and path_elements[0] == "pdiff":
            self.handle_pdiff(int(path_elements[1]))
        elif len(path_elements) == 2 and path_elements[0] == "pdiffbbox":
            self.handle_pdiff_bbox(int(path_elements[1]))
        else:
            self.send_error(404, "File not found")

    def do_POST(self):
        global LAST_REQUEST_MS
        LAST_REQUEST_MS = time.time() * 1000
        parsed_path = urlparse(self.path)
        path_elements = parsed_path.path.strip('/').split('/')

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        form_data = cgi.parse_qs(post_data.decode('utf-8'))

        if len(path_elements) == 3 and path_elements[2] == "get_contents":
            self.handle_get_contents(path_elements[0], form_data)
        elif len(path_elements) == 2 and path_elements[0] == "diff":
            self.handle_diff_ops(int(path_elements[1]), form_data)
        elif path_elements[0] == "seriouslykill":
            self.handle_seriouslykill()
        elif path_elements[0] == "kill":
            self.handle_kill()
        else:
            self.send_error(404, "File not found")

    def handle_index(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        with open('templates/file_diff.html', 'r') as file:
            self.wfile.write(file.read().encode('utf-8'))

    def handle_favicon(self):
        self.serve_static_file('static/img/favicon.ico', 'image/vnd.microsoft.icon')

    def handle_theme(self):
        theme = GIT_CONFIG['webdiff']['theme']
        theme_dir = os.path.dirname(theme)
        theme_file = os.path.basename(theme)
        theme_path = os.path.join('static/css/themes', theme_dir, theme_file + '.css')
        self.serve_static_file(theme_path, 'text/css')

    def handle_image(self, side, path):
        if side not in ('a', 'b'):
            self.send_response_with_json(400, {'error': 'invalid side'})
            return

        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type or not mime_type.startswith('image/'):
            self.send_response_with_json(400, {'error': 'wrong type'})
            return

        idx = diff.find_diff_index(DIFF, side, path)
        if idx is None:
            self.send_response_with_json(400, {'error': 'not found'})
            return

        d = DIFF[idx]
        abs_path = d.a_path if side == 'a' else d.b_path

        try:
            with open(abs_path, 'rb') as file:
                contents = file.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.end_headers()
            self.wfile.write(contents)
        except Exception as e:
            self.send_response_with_json(500, {'error': str(e)})

    def handle_pdiff(self, idx):
        d = DIFF[idx]
        try:
            _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
            dilated_image = util.generate_dilated_pdiff_image(pdiff_image)
            self.send_response(200)
            self.send_header('Content-Type', 'image/png')
            self.end_headers()
            self.wfile.write(dilated_image)
        except util.ImageMagickNotAvailableError:
            self.send_error(501, 'ImageMagick is not available')
        except util.ImageMagickError as e:
            self.send_error(501, f'ImageMagick error {e}')

    def handle_pdiff_bbox(self, idx):
        d = DIFF[idx]
        try:
            _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
            bbox = util.get_pdiff_bbox(pdiff_image)
            self.send_response_with_json(200, bbox)
        except util.ImageMagickNotAvailableError:
            self.send_error(501, 'ImageMagick is not available')
        except util.ImageMagickError as e:
            self.send_error(501, f'ImageMagick error {e}')

    def handle_get_contents(self, side, form_data):
        if side not in ('a', 'b'):
            self.send_response_with_json(400, {'error': 'invalid side'})
            return

        path = form_data.get('path', [''])[0]
        if not path:
            self.send_response_with_json(400, {'error': 'incomplete'})
            return

        idx = diff.find_diff_index(DIFF, side, path)
        if idx is None:
            self.send_response_with_json(400, {'error': 'not found'})
            return

        d = DIFF[idx]
        abs_path = d.a_path if side == 'a' else d.b_path

        try:
            if is_binary(abs_path):
                size = os.path.getsize(abs_path)
                contents = f"Binary file ({size} bytes)"
            else:
                with open(abs_path, 'r') as file:
                    contents = file.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(contents.encode('utf-8'))
        except Exception as e:
            self.send_response_with_json(500, {'error': str(e)})

    def handle_diff_ops(self, idx, form_data):
        options = json.loads(form_data.get('options', ['{}'])[0])
        extra_args = GIT_CONFIG['webdiff']['extraFileDiffArgs']
        if extra_args:
            options += extra_args.split(' ')
        self.send_response_with_json(200, diff.get_diff_ops(DIFF[idx], options))

    def handle_seriouslykill(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Shutting down...")
        threading.Thread(target=self.server.shutdown).start()

    def handle_kill(self):
        global LAST_REQUEST_MS
        last_ms = LAST_REQUEST_MS

        def shutdown():
            if LAST_REQUEST_MS <= last_ms:  # subsequent requests abort shutdown
                requests.post('http://localhost:%d/seriouslykill' % PORT)

        threading.Timer(0.5, shutdown).start()
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Shutting down...')

    def serve_static_file(self, file_path, mime_type):
        try:
            with open(file_path, 'rb') as file:
                contents = file.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.end_headers()
            self.wfile.write(contents)
        except Exception as e:
            self.send_response_with_json(500, {'error': str(e)})


def open_browser():
    global HOSTNAME, PORT, GIT_CONFIG
    if GIT_CONFIG['webdiff']['openBrowser']:
        webbrowser.open_new_tab(f'http://{HOSTNAME}:{PORT}')


def pick_a_port(args, webdiff_config):
    if 'port' in args:
        return args['port']

    env_port = os.environ.get('WEBDIFF_PORT')
    if env_port:
        return int(env_port)

    if webdiff_config['port'] != -1:
        return webdiff_config['port']

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def run():
    global DIFF, PORT, HOSTNAME, GIT_CONFIG

    try:
        parsed_args = argparser.parse(sys.argv[1:], VERSION)
    except argparser.UsageError as e:
        sys.stderr.write(f'Error: {e}\n\n')
        sys.exit(1)

    GIT_CONFIG = options.get_config()
    WEBDIFF_CONFIG = GIT_CONFIG['webdiff']
    DIFF = argparser.diff_for_args(parsed_args, WEBDIFF_CONFIG)

    PORT = pick_a_port(parsed_args, WEBDIFF_CONFIG)
    HOSTNAME = parsed_args.get('host') or os.environ.get('WEBDIFF_HOST') or WEBDIFF_CONFIG['host']
    if HOSTNAME == '<hostname>':
        _hostname = platform.node()
        if not _hostname:
            sys.stderr.write('Warning: hostname could not be determined\n')
        else:
            HOSTNAME = _hostname

    sys.stderr.write(f'Serving diffs on http://{HOSTNAME}:{PORT}\nClose the browser tab or hit Ctrl-C when you\'re done.\n')
    threading.Timer(0.1, open_browser).start()

    server = HTTPServer((HOSTNAME, PORT), CustomHTTPRequestHandler)
    server.serve_forever()


if __name__ == '__main__':
    run()