#!/bin/bash
# Run both the Python & JS tests.
set -o errexit

pytest

cd ts
yarn webpack
