QUnit.test('simplifyCodes', function(assert) {
  assert.deepEqual(
    codediff.simplifyCodes_([[null, 0, 2], ['x', 2, 4]]),
                            [[null, 0, 2], ['x', 2, 4]]);
  assert.deepEqual(
    codediff.simplifyCodes_([['x', 0, 2], ['x', 2, 4]]),
                            [['x', 0, 4]]);
  assert.deepEqual(
    codediff.simplifyCodes_([['x', 0, 2], ['x', 2, 4], ['y', 4, 6]]),
                            [['x', 0, 4],              ['y', 4, 6]]);
});

QUnit.test('codesToHtml', function(assert) {
  var str = 'hello';
  var map = { getHtmlSubstring: function(a, b) { return str.substring(a, b) } };
  var codes = [[null, 0, 1], ['x', 1, 3], ['y', 3, 5]];
  assert.equal(codediff.codesToHtml_(map, codes),
    'h<span class="char-x">el</span><span class="char-y">lo</span>');
});

QUnit.test('char diffs -- simple', function(assert) {
  var before = $('<div>').text("    return '' + date.getFullYear();").get(0);
  var after =  $('<div>').text("    return 'xx' + date.getFullYear();").get(0);

  var beforeText = $(before).text(),
      afterText = $(after).text();

  codediff.addCharacterDiffs_(before, after);
  assert.equal($(before).text(), beforeText);
  assert.equal($(after).text(), afterText);
  assert.equal($(before).html(), "    return '' + date.getFullYear();");
  assert.equal($(after).html(), "    return '<span class=\"char-insert\">xx</span>' + date.getFullYear();");
});

QUnit.test('char diffs with trailing markup', function(assert) {
  var before = $('<div>').html("<q>''</q>").get(0);
  var after =  $('<div>').html("<q>'xx'</q>").get(0);

  var beforeText = $(before).text(),
      afterText = $(after).text();

  codediff.addCharacterDiffs_(before, after);
  assert.equal($(before).text(), beforeText);
  assert.equal($(after).text(), afterText);
  assert.equal($(before).html(), "<q>''</q>");
  assert.equal($(after).html(), "<q>'</q><span class=\"char-insert\"><q>xx</q></span><q>'</q>");
});

QUnit.test('char diffs with markup', function(assert) {
  var before = $('<div>').html("    <kw>return</kw> <q>''</q> + date.getFullYear();").get(0);
  var after =  $('<div>').html("    <kw>return</kw> <q>'xx'</q> + date.getFullYear();").get(0);

  var beforeText = $(before).text(),
      afterText = $(after).text();

  codediff.addCharacterDiffs_(before, after);
  assert.equal($(before).text(), beforeText);
  assert.equal($(after).text(), afterText);
  assert.equal($(before).html(), "    <kw>return</kw> <q>''</q> + date.getFullYear();");
  assert.equal($(after).html(), "    <kw>return</kw> <q>'</q><span class=\"char-insert\"><q>xx</q></span><q>'</q> + date.getFullYear();");
});

QUnit.test('mixed inserts and markup', function(assert) {
  var beforeCode = '<span class="hljs-string">"q"</span>, s';
  var afterCode =  '<span class="hljs-string">"q"</span><span class="hljs-comment">/*, s*/</span>';
  var beforeEl = $('<div>').html(beforeCode).get(0);
  var afterEl =  $('<div>').html(afterCode).get(0);

  // XXX this is strange -- is this just asserting that there are no exceptions?
  codediff.addCharacterDiffs_(beforeEl, afterEl);
  assert.equal(true, true);
});

function assertCharDiff(assert, beforeText, beforeExpectation,
                        afterText, afterExpectation) {
  var codes = codediff.computeCharacterDiffs_(beforeText, afterText);
  assert.notEqual(codes, null,
                  'Declined to generate a diff when one was expected.');

  var beforeCodes = codes[0],
      afterCodes = codes[1];

  var process = function(codes, txt) {
    return codes.map(function(code) {
      var part = txt.substring(code[1], code[2]);
      if (code[0] != null) part = '[' + part + ']';
      return part;
    }).join('');
  };

  var beforeActual = process(beforeCodes, beforeText),
      afterActual =  process(afterCodes, afterText);

  assert.equal(beforeActual, beforeExpectation);
  assert.equal(afterActual, afterExpectation);
}

// See https://github.com/danvk/github-syntax/issues/17
QUnit.test('pure add with assertCharDiff', function(assert) {
  assertCharDiff(assert,
      'output.writeBytes(obj.sequence)',
      'output.writeBytes(obj.sequence)',
      'output.writeBytes(obj.sequence.toArray)',
      'output.writeBytes(obj.sequence[.toArray])');
});


QUnit.test('splitIntoWords', function(assert) {
  assert.deepEqual(codediff.splitIntoWords_(
      '<ImageDiffModeSelector filePair={filePair}'),
      ['<', 'Image', 'Diff', 'Mode', 'Selector', ' ', 'file', 'Pair', '=', '{',
       'file', 'Pair', '}']);
  assert.deepEqual(codediff.splitIntoWords_(
      '<DiffView filePair={filePair}'),
      ['<', 'Diff', 'View', ' ', 'file', 'Pair', '=', '{', 'file', 'Pair', '}']);
  assert.deepEqual(codediff.splitIntoWords_(
      'Test1TEST23testAbc{}'),
      ['Test', '1', 'TEST', '23', 'test', 'Abc', '{', '}']);
  assert.deepEqual(codediff.splitIntoWords_(
      '   FooBar'),
      [' ', ' ', ' ', 'Foo', 'Bar']);
});

QUnit.test('char diffs on word boundaries', function(assert) {
  assertCharDiff(assert,
      '<ImageDiffModeSelector filePair={filePair}',
      '<[Image]Diff[ModeSelector] filePair={filePair}',
      '<DiffView filePair={filePair}',
      '<Diff[View] filePair={filePair}'
      );

  assertCharDiff(assert,
      'mode={this.state.imageDiffMode}',
      '[mode]={this.state.imageDiffMode}',
      'imageDiffMode={this.state.imageDiffMode}',
      '[imageDiffMode]={this.state.imageDiffMode}'
      );

  assertCharDiff(assert,
      'changeHandler={this.changeImageDiffModeHandler}/>',
      'changeHandler={this.changeImageDiffModeHandler}/>',
      'changeImageDiffModeHandler={this.changeImageDiffModeHandler} />',
      'change[ImageDiffMode]Handler={this.changeImageDiffModeHandler}[ ]/>'
      );

  // XXX this could be more specific.
  assertCharDiff(assert,
      'var lis = this.props.filePairs.map((file_pair, idx) => {',
      'var lis = this.props.filePairs.map((file[_pair], idx) => {',
      'var lis = this.props.filePairs.map((filePair, idx) => {',
      'var lis = this.props.filePairs.map((file[Pair], idx) => {'
      );

  assertCharDiff(assert,
      '      return <li key={idx}>{content}</li>',
      '      return <li key={idx}>{content}</li>',
      '      return <li key={idx}>{content}</li>;',
      '      return <li key={idx}>{content}</li>[;]'
      );

  assertCharDiff(assert,
      'import net.sf.samtools._',
      'import [net.sf].samtools._',
      'import htsjdk.samtools._',
      'import [htsjdk].samtools._'
      );
});

QUnit.test('add a comma', function(assert) {
  assertCharDiff(assert,
      '  foo: "bar"',
      '  foo: "bar"',
      '  foo: "bar",',
      '  foo: "bar"[,]');
});

QUnit.test('whitespace diff', function(assert) {
  assertCharDiff(assert,
      '  ',
      '[  ]',
      '',
      '');

  assertCharDiff(assert,
      '',
      '',
      '  ',
      '[  ]');

  assertCharDiff(assert,
      '       <div className="examine-page">',
      '       <div className="examine-page">',
      '        <div className="examine-page">',
      '[ ]       <div className="examine-page">');

  assertCharDiff(assert,
      'foobar',
      'foobar',
      '  foobar',
      '[  ]foobar');

  assertCharDiff(assert,
      '    foobar',
      '[    ]foobar',
      'foobar',
      'foobar');
});

QUnit.test('char diff thresholds', function(assert) {
  // Not a useful diff -- only one character in common!
  assert.equal(codediff.computeCharacterDiffs_('foo.bar', 'blah.baz'), null);
  assert.equal(codediff.computeCharacterDiffs_('foo.', 'blah.'), null);

  // with the "bar"s equal, it's become useful.
  assertCharDiff(assert,
                 'foo.bar',
                 '[foo].bar',
                 'blah.bar',
                 '[blah].bar');

  // pure adds/deletes shouldn't be flagged as char diffs.
  assert.equal(codediff.computeCharacterDiffs_(
      '',
      '      date.getSeconds() + date.getMilliseconds();'), null);
});
