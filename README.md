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

or, if you prefer [Homebrew]:

    brew install danvk/webdiff/webdiff

(the latter will also install [ImageMagick] as a recommended dependency.)

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

    user.login: yourusername
    user.token: your-personal-access-tokens

Make sure you chmod this file to only be readable by yourself. You can generate
a personal access token for webdiff via github.com → profile → Settings →
Personal access tokens. Make sure to grant all the "repo" privileges.

## Configuration

webdiff can be configured via [`git config`][git config]. To change the syntax highlighting theme, for example:

    git config webdiff.theme rainbow

(You can find a list of supported themes in the [themes] directory.)

As with any git configuration setting, these can be set globally or per-repo.

Options are:

| Setting        | Default       | Notes  |
| -------------- | ------------- | ------ |
| webdiff.theme  | googlecode    | Syntax highlighting theme (see [themes] directory). |
| webdiff.port   | -1            | Port on which to serve webdiff. Default is random open port. This can be overridden with `--port`. |
| webdiff.maxDiffWidth | 100 | Maximum length of lines in the diff display. After this width, lines will wrap. |
| webdiff.unified | 8 | Lines of context to display by default (`git diff -U`) |
| webdiff.extraDirDiffArgs | "" | Any extra arguments to pass to `git diff` when diffing directories. |
| webdiff.extraFileDiffArgs | "" | Any extra arguments to pass to `git diff` when diffing files. |
| webdiff.openBrowser | true | Whether to automatically open the browser UI when you run webdiff. |
| webdiff.maxLinesForSyntax | 10000 | Maximum lines in file to do syntax highlighting. |
| webdiff.colors.delete | #fee | CSS background color for delete (left) lines |
| webdiff.colors.insert | #efe | CSS background color for insert (right) lines |
| webdiff.colors.charDelete | #fcc | CSS background color for deleted characters in a delete (left) line |
| webdiff.colors.charInsert | #cfc | CSS background color for inserted characters in an insert (right) line |

## Development

    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ts
    yarn
    # see https://github.com/webpack/webpack/issues/14532
    NODE_OPTIONS=--openssl-legacy-provider webpack

Then from the root directory:

    PYTHONPATH=. ./webdiff/app.py testdata/dygraphsjs/{left,right}

or to launch in debug mode:

    ./test.sh $(pwd)/testdata/manyfiles/{left,right}

(or any other directory in testdata)

To run the Python tests:

    pytest

To format the code, run:

    ./scripts/black.sh
    cd ts
    yarn prettier

To debug `git webdiff`, run:

    WEBDIFF_CONFIG=$(pwd)/testing.cfg ./webdiff/gitwebdiff.py

To iterate on the PyPI package, run:

    # from outside the webdiff virtualenv:
    pip3 uninstall webdiff

    # from inside the webdiff virtualenv, adjust for current version
    python setup.py sdist
    mkdir /tmp/webdiff-test
    cp dist/webdiff-?.?.?.tar.gz /tmp/webdiff-test

    deactivate
    cd /tmp/webdiff-test
    pip3 install webdiff-?.?.?.tar.gz

To publish to pypitest:

    pip install --upgrade wheel setuptools twine
    python setup.py sdist bdist_wheel
    twine upload -r testpypi dist/*

And to the real pypi:

    twine upload dist/*

See [pypirc][] docs for details on setting up `~/.pypirc`.

[pypirc]: https://packaging.python.org/specifications/pypirc/
[Homebrew]: https://brew.sh/
[ImageMagick]: https://imagemagick.org/index.php
[git config]: https://git-scm.com/docs/git-config
[themes]: http://example.com
