#!/usr/bin/env python
"""Web-based file differ.

For usage, see README.md.
"""

import dataclasses
import importlib.metadata
import json
import logging
import mimetypes
import os
import platform
import signal
import socket
import sys
import threading
import time
import webbrowser

import aiohttp
import aiohttp.web_request
from aiohttp import web
from binaryornot.check import is_binary

from webdiff import argparser, diff, options, util

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
WEBDIFF_DIR = determine_path()

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
    logging.getLogger('binaryornot').setLevel(logging.ERROR)


async def handle_index(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx', '0'))
    pairs = diff.get_thin_list(DIFF)
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
                },
                indent=2,
            ),
        )
        return web.Response(body=html, content_type='text/html', charset='utf-8')


async def handle_thick(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx'))
    return web.json_response(diff.get_thick_dict(DIFF[idx]))


async def handle_get_contents(request: aiohttp.web_request.Request):
    side = request.match_info['side']
    form_data = await request.post()
    path = form_data.get('path', '')
    if not path:
        return web.json_response({'error': 'incomplete'}, status=400)
    should_normalize = form_data.get('normalize_json')

    idx = diff.find_diff_index(DIFF, side, path)
    if idx is None:
        return web.json_response({'error': 'not found'}, status=400)

    d = DIFF[idx]
    abs_path = d.a_path if side == 'a' else d.b_path

    try:
        if is_binary(abs_path):
            size = os.path.getsize(abs_path)
            return web.Response(text=f'Binary file ({size} bytes)')
        else:
            if should_normalize:
                abs_path = util.normalize_json(abs_path)
            return web.FileResponse(abs_path, headers={'Content-Type': 'text/plain'})
    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)


async def handle_diff_ops(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx'))
    payload = await request.json()
    options = payload.get('options') or []
    should_normalize = payload.get('normalize_json')
    logging.debug([*payload.keys()])
    logging.debug({**payload})
    extra_args = GIT_CONFIG['webdiff']['extraFileDiffArgs']
    if extra_args:
        options += extra_args.split(' ')
    diff_ops = [
        dataclasses.asdict(op)
        for op in diff.get_diff_ops(DIFF[idx], options, normalize_json=should_normalize)
    ]
    return web.json_response(diff_ops, status=200)


async def handle_theme(request: aiohttp.web_request.Request):
    theme = GIT_CONFIG['webdiff']['theme']
    theme_dir = os.path.dirname(theme)
    theme_file = os.path.basename(theme)
    theme_path = os.path.join(
        WEBDIFF_DIR, 'static/css/themes', theme_dir, theme_file + '.css'
    )
    return web.FileResponse(theme_path)


async def handle_favicon(request):
    return web.FileResponse(os.path.join(WEBDIFF_DIR, 'static/img/favicon.ico'))


async def handle_get_image(request: aiohttp.web_request.Request):
    side = request.match_info.get('side')
    path = request.match_info.get('path')
    mime_type, _ = mimetypes.guess_type(path)
    if not mime_type or not mime_type.startswith('image/'):
        return web.json_response({'error': 'wrong type'}, status=400)

    idx = diff.find_diff_index(DIFF, side, path)
    if idx is None:
        return web.json_response({'error': 'not found'}, status=400)

    d = DIFF[idx]
    abs_path = d.a_path if side == 'a' else d.b_path
    return web.FileResponse(abs_path, headers={'Content-Type': mime_type})


async def handle_pdiff(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx'))
    d = DIFF[idx]
    try:
        _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
        dilated_image_path = util.generate_dilated_pdiff_image(pdiff_image)
        return web.FileResponse(dilated_image_path)
    except util.ImageMagickNotAvailableError:
        return web.Response(status=501, text='ImageMagick is not available')
    except util.ImageMagickError as e:
        return web.Response(status=501, text=f'ImageMagick error {e}')


async def handle_pdiff_bbox(request: aiohttp.web_request.Request):
    idx = int(request.match_info.get('idx'))
    d = DIFF[idx]
    try:
        _, pdiff_image = util.generate_pdiff_image(d.a_path, d.b_path)
        bbox = util.get_pdiff_bbox(pdiff_image)
        return web.json_response(bbox, status=200)
    except util.ImageMagickNotAvailableError:
        return web.json_response('ImageMagick is not available', status=501)
    except util.ImageMagickError as e:
        return web.json_response(f'ImageMagick error {e}', status=501)


async def websocket_handler(request: aiohttp.web_request.Request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            await ws.send_str(msg.data + '/answer')
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection closed with exception %s' % ws.exception())

    maybe_shutdown()
    return ws


@web.middleware
async def request_time_middleware(request, handler):
    note_request_time()
    response = await handler(request)
    return response


app = web.Application(middlewares=[request_time_middleware])
app.add_routes(
    [
        web.get('/', handle_index),
        web.get(r'/{idx:\d+}', handle_index),
        web.get('/favicon.ico', handle_favicon),
        web.get('/theme.css', handle_theme),
        web.static('/static', os.path.join(WEBDIFF_DIR, 'static')),
        web.get(r'/thick/{idx:\d+}', handle_thick),
        web.post(r'/{side:a|b}/get_contents', handle_get_contents),
        web.post(r'/diff/{idx:\d+}', handle_diff_ops),
        # Image diffs
        web.get(r'/{side:a|b}/image/{path:.*}', handle_get_image),
        web.get(r'/pdiff/{idx:\d+}', handle_pdiff),
        web.get(r'/pdiffbbox/{idx:\d+}', handle_pdiff_bbox),
        # Websocket for detecting when the tab is closed
        web.get('/ws', websocket_handler),
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


def pick_a_port(args, webdiff_config):
    if 'port' in args:
        return args['port']

    env_port = os.environ.get('WEBDIFF_PORT')
    if env_port:
        return int(env_port)

    # gitconfig
    if webdiff_config['port'] != -1:
        return webdiff_config['port']

    return random_port()


def run_http():
    sys.stderr.write(
        """Serving diffs on http://%s:%s
Close the browser tab or hit Ctrl-C when you're done.
"""
        % (HOSTNAME, PORT)
    )
    threading.Timer(0.1, open_browser).start()

    web.run_app(app, host=HOSTNAME, port=PORT)
    logging.debug('http server shut down')


def maybe_shutdown():
    """Wait a second for new requests, then shut down the server."""
    last_ms = LAST_REQUEST_MS

    def shutdown():
        if LAST_REQUEST_MS <= last_ms:  # subsequent requests abort shutdown
            sys.stderr.write('Shutting down...\n')
            signal.raise_signal(signal.SIGINT)
        else:
            logging.debug('Received subsequent request; shutdown aborted.')

    logging.debug(
        'Received request to shut down; waiting 500ms for subsequent requests...'
    )
    threading.Timer(0.5, shutdown).start()


def run():
    global DIFF, PORT, HOSTNAME, GIT_CONFIG
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

    PORT = pick_a_port(parsed_args, WEBDIFF_CONFIG)
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


if __name__ == '__main__':
    run()
