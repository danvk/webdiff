import React from 'react';
import {addCharacterDiffs} from './char-diffs';
import {DiffRange} from './codes';
import {scrollIntoViewIfNeeded} from './dom-utils';

// TODO: factor out a {text, html} type
interface DiffRowProps {
  type: DiffRange['type'];
  beforeLineNum: number | null;
  afterLineNum: number | null;
  beforeText: string | undefined;
  beforeHTML?: string;
  afterText: string | undefined;
  afterHTML?: string;
  isSelected: boolean;
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const makeCodeTd = (type: string, text: string | undefined, html: string | undefined) => {
  if (text === undefined) {
    return {text: '', html: '', className: 'empty code'};
  }
  if (html === undefined) {
    html = escapeHtml(text);
  }
  text = text.replaceAll('\t', '\u00a0\u00a0\u00a0\u00a0');
  html = html.replaceAll('\t', '\u00a0\u00a0\u00a0\u00a0');
  const className = 'code ' + type;
  return {className, html, text};
};

export function DiffRow(props: DiffRowProps) {
  const {beforeLineNum, afterLineNum, type, isSelected} = props;
  const cells = [
    makeCodeTd(type, props.beforeText, props.beforeHTML),
    makeCodeTd(type, props.afterText, props.afterHTML),
  ];
  let [beforeHtml, afterHtml] = [cells[0].html, cells[1].html];
  if (type === 'replace') {
    [beforeHtml, afterHtml] = addCharacterDiffs(
      cells[0].text,
      cells[0].html,
      cells[1].text,
      cells[1].html,
    );
  }
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (isSelected && rowRef.current) {
      scrollIntoViewIfNeeded(rowRef.current);
    }
  }, [isSelected]);
  return (
    <tr ref={rowRef} className={isSelected ? 'selected' : undefined}>
      <td className="line-no">{beforeLineNum ?? ''}</td>
      <td
        className={cells[0].className + ' before'}
        dangerouslySetInnerHTML={{__html: beforeHtml}}></td>
      <td
        className={cells[1].className + ' after'}
        dangerouslySetInnerHTML={{__html: afterHtml}}></td>
      <td className="line-no">{afterLineNum ?? ''}</td>
    </tr>
  );
}
