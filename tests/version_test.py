# Make sure the versions in pyproject.toml and package.json stay in sync.

import json
import tomllib


def test_versions_in_sync():
    with open('ts/package.json') as f:
        pkg = json.load(f)
    with open('pyproject.toml', 'rb') as f:
        pyproj = tomllib.load(f)

    pyver = pyproj['tool']['poetry']['version']
    jsver = pkg['version']

    assert jsver == pyver
