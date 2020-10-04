import * as difflib from 'difflib';

import {FilePair} from './CodeDiff';

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
  var split_re = /([.\/])/; // split to folders and extension
  var split = (path: string) => path.split(split_re).filter(x => x);
  var partsA = split(filePair.a);
  var partsB = split(filePair.b);

  var opcodes = new difflib.SequenceMatcher(null, partsA, partsB).getOpcodes();
  var out = '';

  opcodes.forEach(opcode => {
    var [type, aIndex, aLimit, bIndex, bLimit] = opcode;
    var a = partsA.slice(aIndex, aLimit).join('');
    var b = partsB.slice(bIndex, bLimit).join('');
    if (type == 'equal') {
      out += a;
    } else if (type == 'insert') {
      out += '{ → ' + b + '}';
    } else if (type == 'delete') {
      out += '{' + a + ' → }';
    } else if (type == 'replace') {
      out += '{' + a + ' → ' + b + '}';
    } else {
      throw 'Unknown opcode ' + type;
    }
  });

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
  var imA = filePair.image_a,
    imB = filePair.image_b;
  return imA.width == imB.width && imA.height == imB.height;
}

export function makeImage(dataURI: string) {
  var img = new Image();
  img.src = dataURI;
  return img;
}
