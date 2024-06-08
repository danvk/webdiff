import {stringAsLines} from './string-utils';

/**
 * @param text Possibly multiline text containing spans that cross
 *     line breaks.
 * @return An array of individual lines, each of which has
 *     entirely balanced <span> tags.
 */
export function distributeSpans(text: string): string[] {
  const lines = stringAsLines(text);
  const spanRe = /(<span[^>]*>)|(<\/span>)/;

  const outLines = [];
  const liveSpans = [];
  for (const line of lines) {
    const groups = line.split(spanRe);
    let i = 0;
    let outLine = liveSpans.join('');
    while (i < groups.length) {
      const g = groups[i];
      if (g === undefined) {
        // close span
        outLine += groups[i + 1];
        liveSpans.pop();
        i += 2;
      } else if (g.slice(0, 5) == '<span') {
        // open span
        i += 2;
        outLine += g;
        liveSpans.push(g);
      } else {
        // plain text
        outLine += g;
        i++;
      }
    }
    liveSpans.forEach(function () {
      outLine += '</span>';
    });
    outLines.push(outLine);
  }
  if (liveSpans.length) throw 'Unbalanced <span>s in ' + text;
  return outLines;
}

/** Equivalent of jQuery's $.closest */
export function closest(el: Element, selector: string): Element | null {
  let e: Element | null = el;
  while (e) {
    if (e.matches(selector)) {
      return e;
    }
    e = e.parentElement;
  }
  return null;
}

export function copyOnlyMatching(e: ClipboardEvent, selector: string) {
  const sel = window.getSelection()!;
  const range = sel.getRangeAt(0);
  const doc = range.cloneContents();
  const nodes = doc.querySelectorAll(selector);
  let text = '';

  if (nodes.length === 0) {
    text = doc.textContent!;
  } else {
    [].forEach.call(nodes, function (td: Element, i) {
      text += (i ? '\n' : '') + td.textContent;
    });
  }

  e.clipboardData?.setData('text', text);
  e.preventDefault();
}
