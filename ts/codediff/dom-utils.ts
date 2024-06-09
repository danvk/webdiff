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
      } else if (g.startsWith('<span')) {
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
  if (liveSpans.length) throw new Error(`Unbalanced <span>s in ${text}`);
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
  const sel = window.getSelection();
  if (!sel) {
    throw new Error('called copyOnlyMatching without selection');
  }
  const range = sel.getRangeAt(0);
  const doc = range.cloneContents();
  const nodes = doc.querySelectorAll(selector);
  let text;

  if (nodes.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    text = doc.textContent!;
  } else {
    text = [...nodes].map(n => n.textContent ?? '').join('\n');
  }

  e.clipboardData?.setData('text', text);
  e.preventDefault();
}
