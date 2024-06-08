/** @jest-environment jsdom */
import {
  CharacterDiff,
  addCharacterDiffs,
  codesToHtml,
  computeCharacterDiffs,
  simplifyCodes,
  splitIntoWords,
} from '../char-diffs';
import {htmlTextMapper} from '../html-text-mapper';

function textToHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function htmlToText(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

describe('add character diffs', () => {
  test('simplifyCodes', () => {
    const x = 'replace';
    const y = 'equal';
    expect(
      simplifyCodes([
        [null, 0, 2],
        [x, 2, 4],
      ]),
    ).toEqual([
      [null, 0, 2],
      [x, 2, 4],
    ]);
    expect(
      simplifyCodes([
        [x, 0, 2],
        [x, 2, 4],
      ]),
    ).toEqual([[x, 0, 4]]);
    expect(
      simplifyCodes([
        [x, 0, 2],
        [x, 2, 4],
        [y, 4, 6],
      ]),
    ).toEqual([
      [x, 0, 4],
      [y, 4, 6],
    ]);
  });

  test('codesToHtml', () => {
    const str = 'hello';
    const map = {
      getHtmlSubstring: function (a: number, b: number) {
        return str.substring(a, b);
      },
    } as htmlTextMapper;
    const codes: CharacterDiff[] = [
      [null, 0, 1],
      ['replace', 1, 3],
      ['equal', 3, 5],
    ];
    expect(codesToHtml(map, codes)).toEqual(
      'h<span class="char-replace">el</span><span class="char-equal">lo</span>',
    );
  });

  test('char diffs -- simple', () => {
    const beforeText = "    return '' + date.getFullYear();";
    const afterText = "    return 'xx' + date.getFullYear();";
    const beforeHtml = textToHtml(beforeText);
    const afterHtml = textToHtml(afterText);

    const [before, after] = addCharacterDiffs(beforeText, beforeHtml, afterText, afterHtml);
    expect(before).toEqual("    return '' + date.getFullYear();");
    expect(after).toEqual(
      '    return \'<span class="char-insert">xx</span>\' + date.getFullYear();',
    );
  });

  test('char diffs with trailing markup', () => {
    const beforeHtml = "<q>''</q>";
    const afterHtml = "<q>'xx'</q>";

    const beforeText = htmlToText(beforeHtml);
    const afterText = htmlToText(afterHtml);

    const [before, after] = addCharacterDiffs(beforeText, beforeHtml, afterText, afterHtml);
    expect(before).toEqual("<q>''</q>");
    expect(after).toEqual('<q>\'</q><span class="char-insert"><q>xx</q></span><q>\'</q>');
  });

  test('char diffs with markup', () => {
    const beforeHtml = "    <kw>return</kw> <q>''</q> + date.getFullYear();";
    const afterHtml = "    <kw>return</kw> <q>'xx'</q> + date.getFullYear();";

    const beforeText = htmlToText(beforeHtml);
    const afterText = htmlToText(afterHtml);

    const [before, after] = addCharacterDiffs(beforeText, beforeHtml, afterText, afterHtml);
    expect(before).toEqual("    <kw>return</kw> <q>''</q> + date.getFullYear();");
    expect(after).toEqual(
      '    <kw>return</kw> <q>\'</q><span class="char-insert"><q>xx</q></span><q>\'</q> + date.getFullYear();',
    );
  });

  test('mixed inserts and markup', () => {
    const beforeHtml = '<span class="hljs-string">"q"</span>, s';
    const afterHtml = '<span class="hljs-string">"q"</span><span class="hljs-comment">/*, s*/</span>';

    const beforeText = htmlToText(beforeHtml);
    const afterText = htmlToText(afterHtml);

    const [before, after] = addCharacterDiffs(beforeText, beforeHtml, afterText, afterHtml);
    expect(before).toMatchInlineSnapshot(`"<span class="hljs-string">"q"</span>, s"`);
    expect(after).toMatchInlineSnapshot(
      `"<span class="hljs-string">"q"</span><span class="char-insert"><span class="hljs-comment">/*</span></span><span class="hljs-comment">, s</span><span class="char-insert"><span class="hljs-comment">*/</span></span>"`,
    );
  });

  function assertCharDiff(
    beforeText: string,
    beforeExpectation: string,
    afterText: string,
    afterExpectation: string,
  ) {
    const codes = computeCharacterDiffs(beforeText, afterText)!;
    expect(codes).not.toBeNull();
    // 'Declined to generate a diff when one was expected.');

    const beforeCodes = codes[0],
      afterCodes = codes[1];

    const process = function (codes: CharacterDiff[], txt: string) {
      return codes
        .map(function (code) {
          let part = txt.substring(code[1], code[2]);
          if (code[0] != null) part = '[' + part + ']';
          return part;
        })
        .join('');
    };

    const beforeActual = process(beforeCodes, beforeText),
      afterActual = process(afterCodes, afterText);

    expect(beforeActual).toEqual(beforeExpectation);
    expect(afterActual).toEqual(afterExpectation);
  }

  // See https://github.com/danvk/github-syntax/issues/17
  test('pure add with assertCharDiff', () => {
    assertCharDiff(
      'output.writeBytes(obj.sequence)',
      'output.writeBytes(obj.sequence)',
      'output.writeBytes(obj.sequence.toArray)',
      'output.writeBytes(obj.sequence[.toArray])',
    );
  });

  test('splitIntoWords', () => {
    expect(splitIntoWords('<ImageDiffModeSelector filePair={filePair}')).toEqual([
      '<',
      'Image',
      'Diff',
      'Mode',
      'Selector',
      ' ',
      'file',
      'Pair',
      '=',
      '{',
      'file',
      'Pair',
      '}',
    ]);
    expect(splitIntoWords('<DiffView filePair={filePair}')).toEqual([
      '<',
      'Diff',
      'View',
      ' ',
      'file',
      'Pair',
      '=',
      '{',
      'file',
      'Pair',
      '}',
    ]);
    expect(splitIntoWords('Test1TEST23testAbc{}')).toEqual([
      'Test',
      '1',
      'TEST',
      '23',
      'test',
      'Abc',
      '{',
      '}',
    ]);
    expect(splitIntoWords('   FooBar')).toEqual([' ', ' ', ' ', 'Foo', 'Bar']);
  });

  test('char diffs on word boundaries', () => {
    assertCharDiff(
      '<ImageDiffModeSelector filePair={filePair}',
      '<[Image]Diff[ModeSelector] filePair={filePair}',
      '<DiffView filePair={filePair}',
      '<Diff[View] filePair={filePair}',
    );

    assertCharDiff(
      'mode={this.state.imageDiffMode}',
      '[mode]={this.state.imageDiffMode}',
      'imageDiffMode={this.state.imageDiffMode}',
      '[imageDiffMode]={this.state.imageDiffMode}',
    );

    assertCharDiff(
      'changeHandler={this.changeImageDiffModeHandler}/>',
      'changeHandler={this.changeImageDiffModeHandler}/>',
      'changeImageDiffModeHandler={this.changeImageDiffModeHandler} />',
      'change[ImageDiffMode]Handler={this.changeImageDiffModeHandler}[ ]/>',
    );

    // XXX this could be more specific.
    assertCharDiff(
      'var lis = this.props.filePairs.map((file_pair, idx) => {',
      'var lis = this.props.filePairs.map((file[_pair], idx) => {',
      'var lis = this.props.filePairs.map((filePair, idx) => {',
      'var lis = this.props.filePairs.map((file[Pair], idx) => {',
    );

    assertCharDiff(
      '      return <li key={idx}>{content}</li>',
      '      return <li key={idx}>{content}</li>',
      '      return <li key={idx}>{content}</li>;',
      '      return <li key={idx}>{content}</li>[;]',
    );

    assertCharDiff(
      'import net.sf.samtools._',
      'import [net.sf].samtools._',
      'import htsjdk.samtools._',
      'import [htsjdk].samtools._',
    );
  });

  test('add a comma', () => {
    assertCharDiff('  foo: "bar"', '  foo: "bar"', '  foo: "bar",', '  foo: "bar"[,]');
  });

  test('whitespace diff', () => {
    assertCharDiff('  ', '[  ]', '', '');

    assertCharDiff('', '', '  ', '[  ]');

    assertCharDiff(
      '       <div className="examine-page">',
      '       <div className="examine-page">',
      '        <div className="examine-page">',
      '[ ]       <div className="examine-page">',
    );

    assertCharDiff('foobar', 'foobar', '  foobar', '[  ]foobar');

    assertCharDiff('    foobar', '[    ]foobar', 'foobar', 'foobar');
  });

  test('char diff thresholds', () => {
    // Not a useful diff -- only one character in common!
    expect(computeCharacterDiffs('foo.bar', 'blah.baz')).toBeNull();
    expect(computeCharacterDiffs('foo.', 'blah.')).toBeNull();

    // with the "bar"s equal, it's become useful.
    assertCharDiff('foo.bar', '[foo].bar', 'blah.bar', '[blah].bar');

    // pure adds/deletes shouldn't be flagged as char diffs.
    expect(
      computeCharacterDiffs('', '      date.getSeconds() + date.getMilliseconds();'),
    ).toBeNull();
  });
});
