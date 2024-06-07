import {FilePair} from './CodeDiffContainer';
import {PatchOptions} from './codediff/codediff';
import {guessLanguageUsingContents, guessLanguageUsingFileName} from './codediff/language';
import {GitConfig} from './options';

declare const GIT_CONFIG: GitConfig;

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
