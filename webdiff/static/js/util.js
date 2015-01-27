/**
 * Utility functions for the webdiff UI. This is a JSX file.
 */
'use strict'

/**
 * Returns either "foo.txt" or "{foo -> bar}.txt"
 * filePair is like {type, path, a, b}
 */
function filePairDisplayName(filePair) {
  if (filePair.type != 'move') {
    return filePair.path;
  }

  // Factor out shared components (folder names, basename, extension) in the
  // old and new names. This might be overkill, but we have a differ, so why
  // not?
  var split_re = /([.\/])/;  // split to folders and extension
  var split = (path) => path.split(split_re).filter((x) => x);
  var partsA = split(filePair.a);
  var partsB = split(filePair.b);

  var opcodes = new difflib.SequenceMatcher(partsA, partsB).get_opcodes();
  var out = '';

  opcodes.forEach((opcode) => {
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
      throw 'Unknown opcode '  + type;
    }
  });

  return out;
}


/**
 * Checks whether the diff is one-sided, i.e. an add or delete.
 */
function isOneSided(filePair) {
  return (filePair.type == 'add' || filePair.type == 'delete');
}


/**
 * Determines whether the before & after images are the same size.
 */
function isSameSizeImagePair(filePair) {
  if (!filePair.is_image_diff) return false;
  if (isOneSided(filePair)) return false;
  if (!filePair.a || !filePair.b) return false;
  var imA = filePair.image_a,
      imB = filePair.image_b;
  return (imA.width == imB.width && imA.height == imB.height);
}


// From http://facebook.github.io/react/docs/reusable-components.html
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};


// Global Resemble.js config.
resemble.outputSettings({
  errorColor: {
    red: 255,
    green: 0,
    blue: 0
  },
  errorType: 'movement',
  transparency: 0.0,  // don't include any of the original image.
  ignoreAntialiasing: true
});

// Compute a perceptual diff using Resemble.js.
// This memoizes the diff to facilitate working with React.
// Returns deferred Resemble diff data.
function computePerceptualDiff(fileA, fileB) {
  if (!resemble.cache) resemble.cache = {};

  return new Promise(function(resolve, reject) {
    var key = [fileA, fileB].join(':');
    var v = resemble.cache[key];
    if (v) {
      resolve(v);
    } else {
      resemble(fileB).compareTo(fileA).onComplete(function(data) {
        resemble.cache[key] = data;
        resolve(data);
      });
    }
  });
}

function makeImage(dataURI) {
  var img = new Image();
  img.src = dataURI;
  return img;
}
