git webdiff
===========

Two-column web-based git difftool.

Installation
------------

    pip install webdiff

Usage
-----

Instead of running "git diff", run:

    git webdiff

You can also start webdiff via:

    git webdiff [args]
    git difftool -d -x webdiff [args]

You can pass all the same arguments that you would to "git diff", e.g.
"1234..5678" or "HEAD".

webdiff can also be invoked directly to diff two directories:

    webdiff [left_dir] [right_dir]

Testing
-------

(from an activated virtualenv)

    python test/*.py

Development
-----------

(from an activated virtualenv)

    pip install -r requirements.txt
    bower install
    cd webdiff
    ./app.py ../testdata/dygraphsjs/{left,right}

or to launch in debug mode:

    cd webdiff
    export WEBDIFF_CONFIG=$(pwd)/../testing.cfg
    ./app.py $(pwd)/../testdata/webdiffdiff/{left,right}

(or any other directory in testdata)
