#!/bin/bash
# Run both the Python & JS tests.
set -o errexit

nosetests tests
grunt test --verbose --force
