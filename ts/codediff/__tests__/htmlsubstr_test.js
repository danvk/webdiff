QUnit.test('basic functionality', function(assert) {
  var html = 'foo<span>bar</span>baz';
  var text = $('<div>').html(html).text();
  var map = new codediff.htmlTextMapper(text, html);

  assert.equal(map.getHtmlSubstring(0, 0), '');
  assert.equal(map.getHtmlSubstring(0, 1), 'f');
  assert.equal(map.getHtmlSubstring(0, 2), 'fo');
  assert.equal(map.getHtmlSubstring(0, 3), 'foo');
  assert.equal(map.getHtmlSubstring(0, 4), 'foo<span>b</span>');
  assert.equal(map.getHtmlSubstring(0, 5), 'foo<span>ba</span>');
  assert.equal(map.getHtmlSubstring(0, 6), 'foo<span>bar</span>');
  assert.equal(map.getHtmlSubstring(0, 7), 'foo<span>bar</span>b');
  assert.equal(map.getHtmlSubstring(0, 8), 'foo<span>bar</span>ba');
  assert.equal(map.getHtmlSubstring(0, 9), 'foo<span>bar</span>baz');
});

QUnit.test('leading/trailing html', function(assert) {
  var html = '<p>foo<span>bar</span>baz</p>';
  var text = $('<div>').html(html).text();
  var map = new codediff.htmlTextMapper(text, html);

  assert.equal(map.getHtmlSubstring(0, 0), '');
  assert.equal(map.getHtmlSubstring(0, 1), '<p>f</p>');
  assert.equal(map.getHtmlSubstring(0, 2), '<p>fo</p>');
  assert.equal(map.getHtmlSubstring(0, 3), '<p>foo</p>');
  assert.equal(map.getHtmlSubstring(0, 4), '<p>foo<span>b</span></p>');
  assert.equal(map.getHtmlSubstring(0, 5), '<p>foo<span>ba</span></p>');
  assert.equal(map.getHtmlSubstring(0, 6), '<p>foo<span>bar</span></p>');
  assert.equal(map.getHtmlSubstring(0, 7), '<p>foo<span>bar</span>b</p>');
  assert.equal(map.getHtmlSubstring(0, 8), '<p>foo<span>bar</span>ba</p>');
  assert.equal(map.getHtmlSubstring(0, 9), '<p>foo<span>bar</span>baz</p>');
});

QUnit.test('leading/trailing html, fixed right', function(assert) {
  var html = '<p>foo<span>bar</span>baz</p>';
  var text = $('<div>').html(html).text();
  var map = new codediff.htmlTextMapper(text, html);

  assert.equal(map.getHtmlSubstring(0, 9), '<p>foo<span>bar</span>baz</p>');
  assert.equal(map.getHtmlSubstring(1, 9),  '<p>oo<span>bar</span>baz</p>');
  assert.equal(map.getHtmlSubstring(2, 9),   '<p>o<span>bar</span>baz</p>');
  assert.equal(map.getHtmlSubstring(3, 9),    '<p><span>bar</span>baz</p>');
  assert.equal(map.getHtmlSubstring(4, 9),     '<p><span>ar</span>baz</p>');
  assert.equal(map.getHtmlSubstring(5, 9),      '<p><span>r</span>baz</p>');
  assert.equal(map.getHtmlSubstring(6, 9),                    '<p>baz</p>');
  assert.equal(map.getHtmlSubstring(7, 9),                     '<p>az</p>');
  assert.equal(map.getHtmlSubstring(8, 9),                      '<p>z</p>');
  assert.equal(map.getHtmlSubstring(9, 9),                              '');
});

QUnit.test('small html, all ranges', function(assert) {
  var html = '<q>xx</q>';
  var text = $('<div>').html(html).text();
  var map = new codediff.htmlTextMapper(text, html);

  assert.equal(map.getHtmlSubstring(0, 0), '');
  assert.equal(map.getHtmlSubstring(0, 1), '<q>x</q>');
  assert.equal(map.getHtmlSubstring(0, 2), '<q>xx</q>');
  assert.equal(map.getHtmlSubstring(1, 2), '<q>x</q>');
  assert.equal(map.getHtmlSubstring(2, 2), '');
});

QUnit.test('html with entities', function(assert) {
  var html = 'x&lt;y';
  var text = $('<div>').html(html).text();
  var map = new codediff.htmlTextMapper(text, html);

  assert.equal(map.getHtmlSubstring(0, 0), '');
  assert.equal(map.getHtmlSubstring(0, 1), 'x');
  assert.equal(map.getHtmlSubstring(0, 2), 'x&lt;');
  assert.equal(map.getHtmlSubstring(0, 3), 'x&lt;y');
  assert.equal(map.getHtmlSubstring(1, 1), '');
  assert.equal(map.getHtmlSubstring(1, 2), '&lt;');
  assert.equal(map.getHtmlSubstring(1, 3), '&lt;y');
  assert.equal(map.getHtmlSubstring(2, 2), '');
  assert.equal(map.getHtmlSubstring(2, 3), 'y');
});

QUnit.test('consecutive tags', function(assert) {
  var html = '<a><b>xx</b></a>';
  var text = $('<div>').html(html).text();
  assert.equal(text.length, 2);
  var map = new codediff.htmlTextMapper(text, html);

  assert.equal(map.getHtmlSubstring(0, 0), '');
  assert.equal(map.getHtmlSubstring(0, 1), '<a><b>x</b></a>');
  assert.equal(map.getHtmlSubstring(0, 2), '<a><b>xx</b></a>');
  assert.equal(map.getHtmlSubstring(1, 1), '');
  assert.equal(map.getHtmlSubstring(1, 2), '<a><b>x</b></a>');
  assert.equal(map.getHtmlSubstring(2, 2), '');
});
