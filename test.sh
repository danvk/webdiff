#!/bin/bash
export WEBDIFF_CONFIG=$(pwd)/testing.cfg
export WEBDIFF_PORT=$(($RANDOM + 10000))
export PYTHONPATH=.
./webdiff/app.py $*
