import * as Diff from 'diff';
import {FilePair} from './CodeDiffContainer';

/**
 * Returns either "foo.txt" or "{foo -> bar}.txt"
 * filePair is like {type, path, a, b}
 */
export function filePairDisplayName(filePair: FilePair) {
  if (filePair.type !== 'move') {
    return filePair.a || filePair.b;
  }

  // Factor out shared components (folder names, basename, extension) in the
  // old and new names. This might be overkill, but we have a differ, so why
  // not?
  const split_re = /([./])/; // split to folders and extension
  const split = (path: string) => path.split(split_re).filter(x => x);
  const partsA = split(filePair.a);
  const partsB = split(filePair.b);

  const diffs = Diff.diffArrays(partsA, partsB);
  let out = '';

  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    const v = diff.value.join('');
    if (diff.removed) {
      if (i < diffs.length - 1 && diffs[i + 1].added) {
        // replace
        i += 1;
        const v2 = diffs[i].value.join('');
        out += '{' + v + ' → ' + v2 + '}';
      } else {
        // remove
        out += '{' + v + ' → }';
      }
    } else if (diff.added) {
      // add
      out += '{ → ' + v + '}';
    } else {
      // equal
      out += v;
    }
  }

  return out;
}

/** Checks whether the diff is one-sided, i.e. an add or delete. */
export function isOneSided(filePair: FilePair) {
  return filePair.type == 'add' || filePair.type == 'delete';
}

/** Determines whether the before & after images are the same size. */
export function isSameSizeImagePair(filePair: FilePair) {
  if (!filePair.is_image_diff) return false;
  if (isOneSided(filePair)) return false;
  if (!filePair.a || !filePair.b) return false;
  const imA = filePair.image_a,
    imB = filePair.image_b;
  return imA.width == imB.width && imA.height == imB.height;
}
