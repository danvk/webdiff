git webdiff
===========

Two-column web-based git difftool.

Installation
------------

    git clone https://github.com/danvk/webdiff.git
    cd webdiff
    source env/bin/activate
    pip install -r requirements.txt
    pyinstaller --onefile app.spec
    cp dist/app /usr/local/bin/webdiff

Usage
-----

    git difftool -d -x webdiff [args]

You can pass all the same arguments that you would to "git diff", e.g.
"1234..5678" or "HEAD".

Testing
-------

(from an activated virtualenv)

    python *_test.py

Development
-----------

(from an activated virtualenv)

    ./app.py testdata/dygraphsjs/{left,right}

(or any other directory in testdata)
