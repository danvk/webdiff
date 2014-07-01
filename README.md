git webdiff
===========

Two-column web-based git difftool.

Installation
------------

    pip install webdiff

Usage
-----

    git difftool -d -x webdiff [args]

You can pass all the same arguments that you would to "git diff", e.g.
"1234..5678" or "HEAD".

Testing
-------

(from an activated virtualenv)

    python test/*.py

Development
-----------

(from an activated virtualenv)

    cd webapp
    ./app.py ../testdata/dygraphsjs/{left,right}

(or any other directory in testdata)
