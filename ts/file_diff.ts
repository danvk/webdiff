import * as codediff from 'codediff.js';
import { FilePair } from "./CodeDiff";

/** Display the diff for a single file. */
export function renderDiff(pathBefore: string, pathAfter: string, contentsBefore: string, contentsAfter: string): HTMLElement {
  const diffDiv = document.createElement('div');
  diffDiv.className = 'diff';

  // build the diff view and add it to the current DOM
  const opts: codediff.Options = {
    // set the display titles for each resource
    beforeName: pathBefore || '(none)',
    afterName: pathAfter || '(none)',
    contextSize: 10
  };

  // First guess a language based on the file name.
  // Fall back to guessing based on the contents of the longer version.
  var path = pathBefore || pathAfter;
  var language = codediff.guessLanguageUsingFileName(path);

  var lengthOrZero = function (data: any[] | string | null | undefined) {
    return data ? data.length : 0;
  };

  if (!language && HIGHLIGHT_BLACKLIST.indexOf(extractFilename(path)) === -1) {
    var byLength = [contentsBefore, contentsAfter];
    if (contentsAfter && lengthOrZero(contentsAfter) > lengthOrZero(contentsBefore)) {
      byLength = [byLength[1], byLength[0]];
    }
    language = codediff.guessLanguageUsingContents(byLength[0]);
  }
  if (language) {
    opts.language = language;
  }

  diffDiv.appendChild(codediff.buildView(contentsBefore, contentsAfter, opts));

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
const HIGHLIGHT_BLACKLIST = [
  'TODO',
  'README',
  'NOTES'
];


// Useful for avoiding capturing keyboard shortcuts and text entry.
export function isLegitKeypress(e: KeyboardEvent) {
  const target = e.target as Element;
  if (e.ctrlKey || e.altKey || e.metaKey ||
      target.tagName.toLowerCase() == 'input' ||
      target.tagName.toLowerCase() == 'textarea') {
    return false;
  }
  return true;
}
