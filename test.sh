#!/bin/bash
export WEBDIFF_CONFIG=$(pwd)/testing.cfg
./webdiff/app.py $*
