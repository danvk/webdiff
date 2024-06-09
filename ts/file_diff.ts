import {FilePair} from './CodeDiffContainer';

// XXX figure out what the difference between these is
type ThickDiff = FilePair;

/** Get thick file diff information from the server. */
export async function getThickDiff(index: number): Promise<ThickDiff> {
  const {cache} = getThickDiff;
  if (cache[index]) {
    return cache[index];
  }

  const response = await fetch(`/thick/${index}`);
  const data = (await response.json()) as ThickDiff;
  cache[index] = data;
  return data;
}
getThickDiff.cache = [] as ThickDiff[];

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
