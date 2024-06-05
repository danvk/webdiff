QUnit.test( 'hello test', function(assert) {
  assert.ok(1 == '1', 'Passed!');
});

QUnit.test('span spreads across lines', function(assert) {
  var html = '<span class=jsdoc>foo\nbar</span>';
  var lines = codediff.distributeSpans_(html);
  assert.deepEqual(['<span class=jsdoc>foo</span>',
                    '<span class=jsdoc>bar</span>'],
                    lines);
});

QUnit.test('nested spans', function(assert) {
  var html = '<span class=jsdoc>foo\n<span>bar</span> blah</span>';
  var lines = codediff.distributeSpans_(html);
  assert.deepEqual(['<span class=jsdoc>foo</span>',
                    '<span class=jsdoc><span>bar</span> blah</span>'],
                    lines);
});

QUnit.test('multiple multi-line spans', function(assert) {
  var html = '<span class=jsdoc>foo<span>blah\nbar</span>\nbaz</span>';
  var lines = codediff.distributeSpans_(html);
  assert.deepEqual(['<span class=jsdoc>foo<span>blah</span></span>',
                    '<span class=jsdoc><span>bar</span></span>',
                    '<span class=jsdoc>baz</span>'],
                    lines);
});
