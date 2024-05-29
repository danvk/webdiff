#!/bin/bash
export TESTING=true
export DEBUG=true
export WEBDIFF_CONFIG=$(pwd)/testing.cfg
export WEBDIFF_PORT=$(($RANDOM + 10000))
export PYTHONPATH=.
./webdiff/gitwebdiff.py $*
