#!/bin/bash
export DEBUG=true
export WEBDIFF_PORT=6001
export WEBDIFF_NO_OPEN=true

sleep 1 && open 'http://localhost:6001' &

npx nodemon \
    -w webdiff \
    --ext py,html,js \
    -x python \
    webdiff/app.py $*
