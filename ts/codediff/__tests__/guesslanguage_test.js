QUnit.test('guessLanguageUsingFileName', function(assert) {
  var guess = codediff.guessLanguageUsingFileName;
  assert.equal(guess('/foo/bar/blah.html'), 'html');
  assert.equal(guess('bar.html'), 'html');
  assert.equal(guess('foo.css'), 'css');
  assert.equal(guess('foo.py'), 'python');
  assert.equal(guess('foo.sh'), 'bash');
  assert.equal(guess('foo.js'), 'javascript');
  assert.equal(guess('README.md'), 'markdown');
  assert.equal(guess('Makefile'), 'makefile');
  assert.equal(guess('foo.nonexistent'), null);
  assert.equal(guess('html'), null);
});

QUnit.test('guessLanguageUsingContentsShebang', function(assert) {
  var guess = codediff.guessLanguageUsingContents;
  assert.equal(guess(
    '#!/usr/bin/env python\n' +
    'print 1 + 1\n'), 'python');

  assert.equal(guess(
    '#!/usr/bin/env python\n' +
    'print 1 + 1\n'), 'python');

  assert.equal(guess(
    '#!/usr/local/bin/python\n' +
    'print 1 + 1\n'), 'python');

  assert.equal(guess(
    '#!/usr/bin/env node\n' +
    '1\n'), 'javascript');

  assert.equal(guess(
    '#!/bin/bash\n' +
    'open $(git remote -v | grep push | cut -f2 | sed "s/.git .*/\/issues/")\n'),
    'bash');
});

QUnit.test('guessLanguageUsingContentsTokens', function(assert) {
  var guess = codediff.guessLanguageUsingContents;
  assert.equal(guess(
    'function foo() {\n' +
    '  console.log("hello");\n' +
    '}\n'), 'javascript');

  assert.equal(guess(
    'class Foo(object):\n' +
    '    def __init__(self):\n' +
    '        pass\n'), 'python');
});
