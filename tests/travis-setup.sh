#!/bin/bash
# Install all deps & build everything for the Python & JS tests.
set -o errexit

pip install -r requirements.txt
cd ts
yarn
