import {FilePair} from './CodeDiff';
import { PatchOptions, buildViewFromOps } from './codediff/codediff';
import { guessLanguageUsingContents, guessLanguageUsingFileName } from './codediff/language';
import { GitConfig } from './options';

declare const GIT_CONFIG: GitConfig;

/** Display the diff for a single file. */
export function renderDiffWithOps(
  pathBefore: string,
  pathAfter: string,
  contentsBefore: string | null,
  contentsAfter: string | null,
  ops: any[],
): HTMLElement {
  const diffDiv = document.createElement('div');
  diffDiv.className = 'diff';

  // build the diff view and add it to the current DOM
  const opts: Partial<PatchOptions> = {
    // set the display titles for each resource
    beforeName: pathBefore || '(none)',
    afterName: pathAfter || '(none)',
    // TODO: thread through minJumpSize
  };

  // First guess a language based on the file name.
  // Fall back to guessing based on the contents of the longer version.
  var path = pathBefore || pathAfter;
  var language = guessLanguageUsingFileName(path);

  var lengthOrZero = function (data: any[] | string | null | undefined) {
    return data ? data.length : 0;
  };
  const lastOp = ops[ops.length - 1];
  const numLines = Math.max(lastOp.before[1], lastOp.after[1]);

  if (!language && HIGHLIGHT_BLACKLIST.indexOf(extractFilename(path)) === -1 && numLines < GIT_CONFIG.webdiff.maxLinesForSyntax) {
    var byLength = [contentsBefore, contentsAfter];
    if (contentsAfter && lengthOrZero(contentsAfter) > lengthOrZero(contentsBefore)) {
      byLength = [byLength![1], byLength![0]];
    }
    language = guessLanguageUsingContents(byLength[0]!);
  }
  if (language) {
    opts.language = language;
  }

  diffDiv.appendChild(
    buildViewFromOps(contentsBefore!, contentsAfter!, ops, opts)
  );

  return diffDiv;
}

// XXX figure out what the difference between these is
type ThickDiff = FilePair;

/** Get thick file diff information from the server. */
export async function getThickDiff(index: number): Promise<ThickDiff> {
  const {cache} = getThickDiff;
  if (cache[index]) {
    return cache[index];
  }

  const response = await fetch(`/thick/${index}`);
  const data = await response.json();
  cache[index] = data;
  return data;
}
getThickDiff.cache = [] as ThickDiff[];

function extractFilename(path: string) {
  var parts = path.split('/');
  return parts[parts.length - 1];
}
const HIGHLIGHT_BLACKLIST = ['TODO', 'README', 'NOTES'];

// Useful for avoiding capturing keyboard shortcuts and text entry.
export function isLegitKeypress(e: KeyboardEvent) {
  const target = e.target as Element;
  if (
    e.ctrlKey ||
    e.altKey ||
    e.metaKey ||
    target.tagName.toLowerCase() == 'input' ||
    target.tagName.toLowerCase() == 'textarea'
  ) {
    return false;
  }
  return true;
}
