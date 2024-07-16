#!/bin/bash
export DEBUG=true
export WEBDIFF_PORT=6001

poetry run webdiff/gitwebdiff.py $*
