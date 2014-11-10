/** @jsx React.DOM */

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
