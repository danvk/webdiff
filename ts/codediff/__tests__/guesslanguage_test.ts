import { guessLanguageUsingFileName } from "../language";

import highlightjs from 'highlight.js';

(globalThis as any).hljs = highlightjs;

describe('guess language', () => {

  const guess = guessLanguageUsingFileName;

test('guessLanguageUsingFileName', () => {
  expect(guess('/foo/bar/blah.html')).toEqual('html');
  expect(guess('bar.html')).toEqual('html');
  expect(guess('foo.css')).toEqual('css');
  expect(guess('foo.py')).toEqual('python');
  expect(guess('foo.sh')).toEqual('bash');
  expect(guess('foo.js')).toEqual('javascript');
  expect(guess('README.md')).toEqual('markdown');
  expect(guess('Makefile')).toEqual('makefile');
  expect(guess('foo.nonexistent')).toEqual(null);
  expect(guess('html')).toEqual(null);
});

test('guessLanguageUsingContentsShebang', () => {
  expect(guess(
    '#!/usr/bin/env python\n' +
    'print 1 + 1\n')).toEqual('python');

  expect(guess(
    '#!/usr/bin/env python\n' +
    'print 1 + 1\n')).toEqual('python');

  expect(guess(
    '#!/usr/local/bin/python\n' +
    'print 1 + 1\n')).toEqual('python');

  expect(guess(
    '#!/usr/bin/env node\n' +
    '1\n')).toEqual('javascript');

  expect(guess(
    '#!/bin/bash\n' +
    'open $(git remote -v | grep push | cut -f2 | sed "s/.git .*/\/issues/")\n')).toEqual(
    'bash');
});

test('guessLanguageUsingContentsTokens', () => {
  expect(guess(
    'function foo() {\n' +
    '  console.log("hello");\n' +
    '}\n')).toEqual( 'javascript');

  expect(guess(
    'class Foo(object):\n' +
    '    def __init__(self):\n' +
    '        pass\n')).toEqual( 'python');
});

});