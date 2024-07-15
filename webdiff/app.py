#!/usr/bin/env python
"""Web-based file differ.

For usage, see README.md.
"""

import asyncio
import dataclasses
import json
import logging
import importlib.metadata
import mimetypes
import os
import re
import platform
import socket
import sys
import threading
import time
import webbrowser

import aiohttp
from aiohttp import web
import aiohttp.web_request
from aiohttp.web_runner import GracefulExit

from binaryornot.check import is_binary
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

from webdiff import diff, util, argparser, options

VERSION = importlib.metadata.version('webdiff')


def determine_path():
    """Borrowed from wxglade.py"""
    try:
        root = __file__
        if os.path.islink(root):
            root = os.path.realpath(root)
        return os.path.dirname(os.path.abspath(root))
    except Exception as e:
        print(f"I'm sorry, but something is wrong. Error: {e}")
        print('There is no __file__ variable. Please contact the author.')
        sys.exit()


GIT_CONFIG = {}
DIFF = None
PORT = None
HOSTNAME = 'localhost'
DEBUG = os.environ.get('DEBUG')
SERVER = None
WEBDIFF_DIR = determine_path()
WS_PORT = None

if DEBUG:
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)

    for logname in ['']:
        log = logging.getLogger(logname)
        log.setLevel(logging.DEBUG)
        log.addHandler(handler)
    logging.getLogger('github').setLevel(logging.ERROR)

# GPT's alternative:
# logging.basicConfig(level=logging.DEBUG if 'DEBUG' in os.environ else logging.INFO)
# logger = logging.getLogger(__name__)


class CustomHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        note_request_time()
        path = urlparse(self.path).path.removesuffix('/') or '/'

        if path == '/favicon.ico':
            self.handle_favicon()
        elif path == '/theme.css':
            self.handle_theme()
        elif m := re.match(r'/thick/(?P<idx>\d+)', path):
            self.handle_thick(int(m['idx']))
        elif m := re.match(r'/(?P<side>a|b)/image/(?P<path>.*)', path):
            self.handle_image(m['side'], m['path'])
        elif m := re.match(r'/pdiff/(?P<idx>\d+)', path):
            self.handle_pdiff(int(m['idx']))
        elif m := re.match(r'/pdiffbbox/(?P<idx>\d+)', path):
            self.handle_pdiff_bbox(int(m['idx']))
        else:
            self.send_error(404, 'File not found')

    def do_POST(self):
        note_request_time()
        path = urlparse(self.path).path.removesuffix('/') or '/'

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        if m := re.match(r'/(?P<side>a|b)/get_contents', path):
            form_data = parse_qs(post_data.decode('utf-8'))
            self.handle_get_contents(m['side'], form_data)
        elif m := re.match(r'/diff/(?P<idx>\d+)', path):
            payload = json.loads(post_data.decode('utf-8'))
            self.handle_diff_ops(int(m['idx']), payload)
        else:
            self.send_error(404, 'File not found')



    def handle_thick(self, idx: int):
        self.send_response_with_json(200, diff.get_thick_dict(DIFF[idx]))

    def handle_favicon(self):
        self.serve_static_file('static/img/favicon.ico', 'image/vnd.microsoft.icon')

    def handle_theme(self):
        theme = GIT_CONFIG['webdiff']['theme']
        theme_dir = os.path.dirname(theme)
        theme_file = os.path.basename(theme)
        theme_path = os.path.join('static/css/themes', theme_dir, theme_file + '.css')
        self.serve_static_file(theme_path, 'text/css')

    def handle_static(self, path: str):
        mime_type, _ = mimetypes.guess_type(path)
        self.serve_static_file(path, mime_type)

    def handle_image(self, side, path):
        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type or not mime_type.startswith('image/'):
            return self.send_response_with_json(400, {'error': 'wrong type'})

        idx = diff.find_diff_index(DIFF, side, path)
        if idx is None:
            return self.send_response_with_json(400, {'error': 'not found'})

        d = DIFF[idx]
        abs_path = d.a_path if side == 'a' else d.b_path
        self.serve_file(abs_path, mime_type)

    def handle_pdiff(self, idx):
        d = DIFF[idx]
        try:
            _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
            dilated_image_path = util.generate_dilated_pdiff_image(pdiff_image)
            self.serve_static_file(dilated_image_path, 'image/png')
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

    def handle_get_contents(self, side: str, form_data: dict[str, list[str]]):
        path = form_data.get('path', [''])[0]
        if not path:
            return self.send_response_with_json(400, {'error': 'incomplete'})

        idx = diff.find_diff_index(DIFF, side, path)
        if idx is None:
            return self.send_response_with_json(400, {'error': 'not found'})

        d = DIFF[idx]
        abs_path = d.a_path if side == 'a' else d.b_path

        try:
            if is_binary(abs_path):
                size = os.path.getsize(abs_path)
                contents = f'Binary file ({size} bytes)'
            else:
                with open(abs_path, 'r') as file:
                    contents = file.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(contents.encode('utf-8'))
        except Exception as e:
            self.send_response_with_json(500, {'error': str(e)})

    def handle_diff_ops(self, idx: int, payload):
        options = payload.get('options') or []
        extra_args = GIT_CONFIG['webdiff']['extraFileDiffArgs']
        if extra_args:
            options += extra_args.split(' ')
        diff_ops = [
            dataclasses.asdict(op) for op in diff.get_diff_ops(DIFF[idx], options)
        ]
        self.send_response_with_json(200, diff_ops)

    def send_response_with_json(self, code, payload):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def serve_static_file(self, file_path, mime_type):
        self.serve_file(os.path.join(WEBDIFF_DIR, file_path), mime_type)

    def serve_file(self, file_path, mime_type):
        try:
            with open(file_path, 'rb') as file:
                contents = file.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.end_headers()
            self.wfile.write(contents)
        except Exception as e:
            self.send_response_with_json(500, {'error': str(e)})

    def log_request(self, *args):
        if DEBUG:
            super().log_request(*args)

async def handle_index(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx', '0'))
    pairs = diff.get_thin_list(DIFF)
    # self.send_response(200)
    # self.send_header('Content-Type', 'text/html; charset=utf-8')
    # self.end_headers()
    with open(os.path.join(WEBDIFF_DIR, 'templates/file_diff.html'), 'r') as file:
        html = file.read()
        html = html.replace(
            '{{data}}',
            json.dumps(
                {
                    'idx': idx,
                    'has_magick': util.is_imagemagick_available(),
                    'pairs': pairs,
                    'git_config': GIT_CONFIG,
                    'ws_port': WS_PORT,
                },
                indent=2,
            ),
        )
        return web.Response(body=html, content_type='text/html', charset='utf-8')
        # self.wfile.write(html.encode('utf-8'))


async def handle_thick(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx'))
    return web.json_response(diff.get_thick_dict(DIFF[idx]))


async def handle_get_contents(request: aiohttp.web_request.Request):
    side = request.match_info['side']
    form_data = await request.post()
    path = form_data.get('path', '')
    if not path:
        return web.json_response({'error': 'incomplete'}, status=400)

    idx = diff.find_diff_index(DIFF, side, path)
    if idx is None:
        return web.json_response({'error': 'not found'}, status=400)

    d = DIFF[idx]
    abs_path = d.a_path if side == 'a' else d.b_path

    try:
        if is_binary(abs_path):
            size = os.path.getsize(abs_path)
            contents = f'Binary file ({size} bytes)'
        else:
            with open(abs_path, 'r') as file:
                contents = file.read()
        return web.Response(text=contents, content_type='text/plain')
    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)


async def handle_diff_ops(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx'))
    payload = await request.post()
    options = payload.get('options') or []
    extra_args = GIT_CONFIG['webdiff']['extraFileDiffArgs']
    if extra_args:
        options += extra_args.split(' ')
    diff_ops = [
        dataclasses.asdict(op) for op in diff.get_diff_ops(DIFF[idx], options)
    ]
    return web.json_response(diff_ops, status=200)


async def handle_theme(request: aiohttp.web_request.Request):
    theme = GIT_CONFIG['webdiff']['theme']
    theme_dir = os.path.dirname(theme)
    theme_file = os.path.basename(theme)
    theme_path = os.path.join(WEBDIFF_DIR, 'static/css/themes', theme_dir, theme_file + '.css')
    with open(theme_path) as f:
        text = f.read()
        return web.Response(text=text, content_type='text/css')


async def websocket_handler(request: aiohttp.web_request.Request):
    print('websocket connect')
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                print('got close message')
                await ws.close()
            else:
                await ws.send_str(msg.data + '/answer')
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection closed with exception %s' %
                  ws.exception())

    print('websocket connection closed')
    maybe_shutdown()
    return ws

async def shutdown(request):
    print("will shutdown now")
    raise GracefulExit()

@web.middleware
async def request_time_middleware(request, handler):
    print("middleware called")
    note_request_time()
    response = await handler(request)
    return response


app = web.Application(middlewares=[request_time_middleware])
app.add_routes(
    [
        web.get('/', handle_index),
        web.get(r'/{idx:\d+}', handle_index),
        web.get('/theme.css', handle_theme),
        web.static('/static', os.path.join(WEBDIFF_DIR, 'static')),
        web.get(r'/thick/{idx:\d+}', handle_thick),
        web.post(r'/{side:a|b}/get_contents', handle_get_contents),
        web.post(r'/diff/{idx:\d+}', handle_diff_ops),
        web.get('/ws', websocket_handler),
        web.post('/shutdown', shutdown)
    ]
)


def note_request_time():
    global LAST_REQUEST_MS
    LAST_REQUEST_MS = time.time() * 1000


def open_browser():
    global PORT
    global HOSTNAME
    global GIT_CONFIG
    if not os.environ.get('WEBDIFF_NO_OPEN') and GIT_CONFIG['webdiff']['openBrowser']:
        webbrowser.open_new_tab('http://%s:%s' % (HOSTNAME, PORT))


def usage_and_die():
    sys.stderr.write(argparser.USAGE)
    sys.exit(1)


def random_port():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('localhost', 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def pick_ports(args, webdiff_config):
    """Pick an http and websocket port."""
    def get_port(key, env_key, gitconfig_key):
        if key in args:
            return args[key]

        env_port = os.environ.get(env_key)
        if env_port:
            return int(env_port)

        # gitconfig
        if webdiff_config[gitconfig_key] != -1:
            return webdiff_config[gitconfig_key]
        return None

    port = get_port('port', 'WEBDIFF_PORT', 'port') or random_port()
    ws_port = get_port('ws_port', 'WEBDIFF_WS_PORT', 'websocketPort')
    if ws_port is None:
        for i in range(100):
            ws_port = random_port()
            if ws_port != port:
                break

    return port, ws_port


def run_http():
    global SERVER
    sys.stderr.write(
        """Serving diffs on http://%s:%s
Close the browser tab or hit Ctrl-C when you're done.
"""
        % (HOSTNAME, PORT)
    )
    threading.Timer(0.1, open_browser).start()

    web.run_app(app, host=HOSTNAME, port=PORT)
    # server = HTTPServer((HOSTNAME, PORT), CustomHTTPRequestHandler)
    # SERVER = server
    # server.serve_forever()
    logging.debug('http server shut down')


async def issue_shutdown_request():
    async with aiohttp.ClientSession() as session:
        url = f'http://{HOSTNAME}:{PORT}/shutdown'
        print(f'hitting {url}')
        async with session.post(url) as _resp:
            pass



def maybe_shutdown():
    """Wait a second for new requests, then shut down the server."""
    last_ms = LAST_REQUEST_MS

    def stop_websocket():
        logging.debug('setting stop_ws')
        STOP_WS.set_result(None)

    def shutdown():
        if LAST_REQUEST_MS <= last_ms:  # subsequent requests abort shutdown
            # See https://stackoverflow.com/a/19040484/388951
            # and https://stackoverflow.com/q/4330111/388951
            sys.stderr.write('Shutting down...\n')
            asyncio.run(issue_shutdown_request())
            # app.loop.stop()
            # threading.Thread(target=stop_websocket, daemon=True).start()
            # threading.Thread(target=SERVER.shutdown, daemon=True).start()
        else:
            logging.debug('Received subsequent request; shutdown aborted.')

    logging.debug('Received request to shut down; waiting 500ms for subsequent requests...')
    threading.Timer(0.5, shutdown).start()


def run_websocket():
    asyncio.run(websocket_main())


async def echo(websocket):
    logging.debug('websocket connected')
    note_request_time()
    async for message in websocket:
        logging.debug(f'Received {message} on websocket')
        note_request_time()
        await websocket.send(message)
    logging.debug('websocket closed')
    note_request_time()
    maybe_shutdown()


async def websocket_main():
    global STOP_WS
    loop = asyncio.get_running_loop()
    STOP_WS = loop.create_future()

    # logging.debug('serving WS')
    # async with websockets.serve(echo, HOSTNAME, WS_PORT):
    #     logging.debug('awaiting STOP_WS')
    #     await STOP_WS
    #     logging.debug('STOP_WS is done')
    # logging.debug('done with websocket_main')


def run():
    global DIFF, PORT, WS_PORT, HOSTNAME, GIT_CONFIG, SERVER
    try:
        parsed_args = argparser.parse(sys.argv[1:], VERSION)
    except argparser.UsageError as e:
        sys.stderr.write('Error: %s\n\n' % e)
        usage_and_die()

    GIT_CONFIG = options.get_config()
    WEBDIFF_CONFIG = GIT_CONFIG['webdiff']
    DIFF = argparser.diff_for_args(parsed_args, WEBDIFF_CONFIG)

    if DEBUG:
        sys.stderr.write('Invoked as: %s\n' % sys.argv)
        sys.stderr.write('Args: %s\n' % parsed_args)
        sys.stderr.write('Diff: %s\n' % DIFF)
        sys.stderr.write('GitConfig: %s\n' % GIT_CONFIG)

    PORT, WS_PORT = pick_ports(parsed_args, WEBDIFF_CONFIG)
    logging.debug(f'chosen ports: {PORT} (http), {WS_PORT} (ws)')
    HOSTNAME = (
        parsed_args.get('host')
        or os.environ.get('WEBDIFF_HOST')
        or WEBDIFF_CONFIG['host']
    )
    if HOSTNAME == '<hostname>':
        _hostname = platform.node()
        # platform.node will return empty string if it can't find the hostname
        if not _hostname:
            sys.stderr.write('Warning: hostname could not be determined\n')
        else:
            HOSTNAME = _hostname

    run_http()
    # t_http = threading.Thread(target=run_http)
    # t_http.start()
    # run_websocket()
    # t_ws.start()
    # t_ws.join()
    # t_http.join()


if __name__ == '__main__':
    run()
