#!/bin/bash
export WEBDIFF_CONFIG=$(pwd)/testing.cfg
export WEBDIFF_PORT=$(($RANDOM + 10000))
./webdiff/app.py $*
