[![Build Status](https://travis-ci.org/danvk/webdiff.svg?branch=master)](https://travis-ci.org/danvk/webdiff)
# git webdiff

Two-column web-based git difftool.

Features include:
* Side-by-side (two column) diff view
* Runs in the browser of your choice on any platform.
* Syntax highlighting via highlight.js
* Step back and forth through multiple files in a single diff
* Rich support for image diffs

<!-- This is `git webdiff 05157bba^..05157bba`, in this repo -->
![Screenshot of webdiff in action](http://www.danvk.org/webdiff.png)

![Screenshot of image diffs](http://www.danvk.org/webdiff-images.png)

## Installation

    pip install webdiff

## Usage

Instead of running "git diff", run:

    git webdiff

You can also start webdiff via:

    git webdiff [args]

You can pass all the same arguments that you would to `git diff`, e.g.
`1234..5678` or `HEAD`.

`webdiff` can also be invoked directly to diff two directories or files:

    webdiff <left_dir> <right_dir>
    webdiff <left_file> <right_file>

You can also use `webdiff` to view GitHub pull requests:

    webdiff https://github.com/owner/repo/pull/123
    webdiff #123  # if you're in a git repo with a github remote

This will download the files relevant to the Pull Request and run `webdiff`.

If you run into GitHub API quota limits or you'd like to use webdiff with
private repos, you can set your credentials in a `.githubrc` file:

```
user.login: yourusername
user.token: your-personal-access-tokens
```

Make sure you chmod this file to only be readable by yourself. You can generate
a personal access token for webdiff via github.com → profile → Settings →
Personal access tokens. Make sure to grant all the "repo" privileges.


## Development

(from an activated virtualenv)

    pip install -r requirements.txt
    cd ts
    yarn
    webpack

Then from the root directory:

    ./webdiff/app.py testdata/dygraphsjs/{left,right}

or to launch in debug mode:

    ./test.sh $(pwd)/../testdata/webdiffdiff/{left,right}

(or any other directory in testdata)

To run the Python tests:

    nosetests

To run the JavaScript tests:

    python -m SimpleHTTPServer
    open tests/runner.html

To iterate on the PyPI package, run:

    # from outside the webdiff virtualenv:
    pip uninstall webdiff

    # from inside the webdiff virtualenv, adjust for current version
    python setup.py sdist
    mkdir /tmp/webdiff-test
    cp dist/webdiff-X.Y.Z.tar.gz /tmp/webdiff-test

    deactivate
    cd /tmp/webdiff-test
    pip install webdiff-X.Y.Z.tar.gz

To publish to pypitest:

    pip install --upgraede wheel setuptools twine
    python setup.py sdist bdist_wheel
    twine upload -r testpypi dist/*

And to the real pypi:

    twine upload dist/*

See [pypirc][] docs for details on setting up `~/.pypirc`.

[oauth]: https://github.com/danvk/webdiff/issues/103
[pypirc]: https://packaging.python.org/specifications/pypirc/
