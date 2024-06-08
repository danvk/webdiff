import {htmlTextMapper} from './html-text-mapper';
import {OpCode} from './difflib';
import * as Diff from 'diff';

type OpType = OpCode[0];
export type CharacterDiff = [OpType | 'skip' | null, number, number];

/**
 * Compute an intra-line diff.
 * @return [before codes, after codes]. Returns null if
 *     character differences are not appropriate for this line pairing.
 */
export function computeCharacterDiffs(
  beforeText: string,
  afterText: string,
): [CharacterDiff[], CharacterDiff[]] | null {
  const diffs = Diff.diffWords(beforeText, afterText);

  // Suppress char-by-char diffs if there's less than 50% character overlap.
  // The one exception is pure whitespace diffs, which should always be shown.
  const minEqualFrac = 0.5;
  let equalCount = 0,
    charCount = 0;
  let beforeDiff = '';
  let afterDiff = '';
  for (const diff of diffs) {
    const len = diff.value.length;
    if (diff.added) {
      afterDiff += diff.value;
      charCount += len;
    } else if (diff.removed) {
      beforeDiff += diff.value;
      charCount += len;
    } else {
      // equal
      equalCount += 2 * len;
      charCount += 2 * len;
      beforeDiff += diff.value;
      afterDiff += diff.value;
    }
  }
  if (
    equalCount < minEqualFrac * charCount &&
    !(beforeDiff.match(/^\s*$/) && afterDiff.match(/^\s*$/))
  ) {
    return null;
  }

  let beforeOut: CharacterDiff[] = [];
  let afterOut: CharacterDiff[] = []; // (span class, start, end) triples
  let beforeIdx = 0;
  let afterIdx = 0;
  for (const diff of diffs) {
    const len = diff.value.length;
    if (diff.added) {
      afterOut.push(['insert', afterIdx, afterIdx + len]);
      afterIdx += len;
    } else if (diff.removed) {
      beforeOut.push(['delete', beforeIdx, beforeIdx + len]);
      beforeIdx += len;
    } else {
      beforeOut.push([null, beforeIdx, beforeIdx + len]);
      afterOut.push([null, afterIdx, afterIdx + len]);
      beforeIdx += len;
      afterIdx += len;
    }
  }
  beforeOut = simplifyCodes(beforeOut);
  afterOut = simplifyCodes(afterOut);

  return [beforeOut, afterOut];
}

export function addCharacterDiffs(
  beforeText: string,
  beforeHtml: string,
  afterText: string,
  afterHtml: string,
): [string, string] {
  const codes = computeCharacterDiffs(beforeText, afterText);
  if (codes == null) {
    return [beforeHtml, afterHtml];
  }
  const beforeOut = codes[0];
  const afterOut = codes[1];

  // Splice in "insert", "delete" and "replace" tags.
  // This is made more difficult by the presence of syntax highlighting, which
  // has its own set of tags. The two can co-exists if we're careful to only
  // wrap complete (balanced) DOM trees.
  const beforeMapper = new htmlTextMapper(beforeText, beforeHtml);
  const afterMapper = new htmlTextMapper(afterText, afterHtml);

  return [codesToHtml(beforeMapper, beforeOut), codesToHtml(afterMapper, afterOut)];
}

/**
 * @param {string} line The line to be split
 * @return {Array.<string>} Component words in the line. An invariant is that
 *     splitIntoWords_(line).join('') == line.
 */
export function splitIntoWords(line: string): string[] {
  const LC = 0,
    UC = 2,
    NUM = 3,
    WS = 4,
    SYM = 5;
  const charType = function (c: string) {
    if (c.match(/[a-z]/)) return LC;
    if (c.match(/[A-Z]/)) return UC;
    if (c.match(/[0-9]/)) return NUM;
    if (c.match(/\s/)) return WS;
    return SYM;
  };

  // Single words can be [A-Z][a-z]+, [A-Z]+, [a-z]+, [0-9]+ or \s+.
  const words = [];
  let lastType = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line.charAt(i);
    const ct = charType(c);
    if (
      (ct == lastType && ct != SYM && ct != WS) ||
      (ct == LC && lastType == UC && words[words.length - 1].length == 1)
    ) {
      words[words.length - 1] += c;
    } else {
      words.push(c);
    }
    lastType = ct;
  }
  return words;
}

// codes are (span class, start, end) triples.
// This merges consecutive runs with the same class, which simplifies the HTML.
export function simplifyCodes(codes: CharacterDiff[]): CharacterDiff[] {
  const newCodes = [];
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (i == 0) {
      newCodes.push(code);
      continue;
    }

    const lastIndex = newCodes.length - 1;
    const lastCodeClass = newCodes[lastIndex][0];
    if (lastCodeClass == code[0]) {
      newCodes[lastIndex][2] = code[2]; // extend last run.
    } else {
      newCodes.push(code);
    }
  }

  return newCodes;
}

// codes are (span class, start, end) triples.
// This wraps html[start..end] in appropriate <span>..</span>s.
export function codesToHtml(mapper: htmlTextMapper, codes: CharacterDiff[]) {
  let html = '';
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i],
      type = code[0],
      start = code[1],
      limit = code[2];
    const thisHtml = mapper.getHtmlSubstring(start, limit);
    if (type == null) {
      html += thisHtml;
    } else {
      html += '<span class="char-' + type + '">' + thisHtml + '</span>';
    }
  }
  return html;
}
