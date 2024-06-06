/***
This is part of jsdifflib v1.0. <http://snowtide.com/jsdifflib>

Copyright (c) 2007, Snowtide Informatics Systems, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
  * Neither the name of the Snowtide Informatics Systems nor the names of its
    contributors may be used to endorse or promote products derived from this
    software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
***/
/* Author: Chas Emerick <cemerick@snowtide.com> */
const __whitespace = {' ': true, '\t': true, '\n': true, '\f': true, '\r': true};

export type OpCode = [
  type: 'replace' | 'delete' | 'insert' | 'equal',
  beforeIdx: number,
  beforeEnd: number,
  afterIdx: number,
  afterEnd: number,
];

function defaultJunkFunction(c: string) {
  return __whitespace.hasOwnProperty(c);
}

function stripLinebreaks(str: string) {
  return str.replace(/^[\n\r]*|[\n\r]*$/g, '');
}

export function stringAsLines(str: string) {
  var lfpos = str.indexOf('\n');
  var crpos = str.indexOf('\r');
  var linebreak = (lfpos > -1 && crpos > -1) || crpos < 0 ? '\n' : '\r';

  var lines = str.split(linebreak);
  for (var i = 0; i < lines.length; i++) {
    lines[i] = stripLinebreaks(lines[i]);
  }

  return lines;
}

// iteration-based reduce implementation
function __reduce<T, U>(func: (acc: U, el: T) => U, list: T[], initial: U) {
  let value: U, idx;
  if (initial != null) {
    value = initial;
    idx = 0;
  } else if (list) {
    value = list[0] as unknown as U;
    idx = 1;
  } else {
    return null;
  }

  for (; idx < list.length; idx++) {
    value = func(value, list[idx]);
  }

  return value;
}

// comparison function for sorting lists of numeric tuples
function __ntuplecomp(a: readonly number[], b: readonly number[]) {
  var mlen = Math.max(a.length, b.length);
  for (var i = 0; i < mlen; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }

  return a.length == b.length ? 0 : a.length < b.length ? -1 : 1;
}

function __calculate_ratio(matches: number, length: number) {
  return length ? (2.0 * matches) / length : 1.0;
}

// returns a function that returns true if a key passed to the returned function
// is in the dict (js object) provided to this function; replaces being able to
// carry around dict.has_key in python...
function __isindict(dict: object) {
  return function (key: string) {
    return dict.hasOwnProperty(key);
  };
}

// replacement for python's dict.get function -- need easy default values
function __dictget<V>(dict: Record<PropertyKey, V>, key: PropertyKey, defaultValue: V): V {
  return dict.hasOwnProperty(key) ? (dict as any)[key] : defaultValue;
}

export class SequenceMatcher {
  a!: string[];
  b!: string[];
  isjunk: (txt: string) => boolean;
  matching_blocks: number[][] | null;
  opcodes: OpCode[] | null;
  fullbcount: Record<string, number> | null;
  b2j: Record<string, number[]>;
  isbjunk!: (key: string) => boolean;
  isbpopular!: (key: string) => boolean;

  constructor(a: string[], b: string[], isjunk?: (txt: string) => boolean) {
    this.b2j = {};
    this.matching_blocks = null;
    this.opcodes = null;
    this.fullbcount = {};

    this.isjunk = isjunk ? isjunk : defaultJunkFunction;
    this.set_seqs(a, b);
  }

  set_seqs(a: string[], b: string[]) {
    this.set_seq1(a);
    this.set_seq2(b);
  }

  set_seq1(a: string[]) {
    if (a == this.a) return;
    this.a = a;
    this.matching_blocks = this.opcodes = null;
  }

  set_seq2(b: string[]) {
    if (b == this.b) return;
    this.b = b;
    this.matching_blocks = this.opcodes = this.fullbcount = null;
    this.__chain_b();
  }

  __chain_b() {
    var b = this.b;
    var n = b.length;
    let b2j = this.b2j;
    var populardict: Record<string, number> = {};
    for (var i = 0; i < b.length; i++) {
      var elt = b[i];
      if (b2j.hasOwnProperty(elt)) {
        var indices = b2j[elt];
        if (n >= 200 && indices.length * 100 > n) {
          populardict[elt] = 1;
          delete b2j[elt];
        } else {
          indices.push(i);
        }
      } else {
        b2j[elt] = [i];
      }
    }

    for (var elt in populardict) {
      if (populardict.hasOwnProperty(elt)) {
        delete b2j[elt];
      }
    }

    var isjunk = this.isjunk;
    var junkdict: Record<string, number> = {};
    if (isjunk) {
      for (var elt in populardict) {
        if (populardict.hasOwnProperty(elt) && isjunk(elt)) {
          junkdict[elt] = 1;
          delete populardict[elt];
        }
      }
      for (var elt in b2j) {
        if (b2j.hasOwnProperty(elt) && isjunk(elt)) {
          junkdict[elt] = 1;
          delete b2j[elt];
        }
      }
    }

    this.isbjunk = __isindict(junkdict);
    this.isbpopular = __isindict(populardict);
  }

  find_longest_match(alo: number, ahi: number, blo: number, bhi: number) {
    var a = this.a;
    var b = this.b;
    var b2j = this.b2j;
    var isbjunk = this.isbjunk;
    var besti = alo;
    var bestj = blo;
    var bestsize = 0;
    var j = null;
    var k: number;

    var j2len: Record<number, number> = {};
    var nothing: never[] = [];
    for (var i = alo; i < ahi; i++) {
      var newj2len: Record<number, number> = {};
      var jdict = __dictget(b2j, a[i], nothing);
      for (var jkey in jdict) {
        if (jdict.hasOwnProperty(jkey)) {
          j = jdict[jkey];
          if (j < blo) continue;
          if (j >= bhi) break;
          newj2len[j] = k = __dictget(j2len, j - 1, 0) + 1;
          if (k > bestsize) {
            besti = i - k + 1;
            bestj = j - k + 1;
            bestsize = k;
          }
        }
      }
      j2len = newj2len;
    }

    while (besti > alo && bestj > blo && !isbjunk(b[bestj - 1]) && a[besti - 1] == b[bestj - 1]) {
      besti--;
      bestj--;
      bestsize++;
    }

    while (
      besti + bestsize < ahi &&
      bestj + bestsize < bhi &&
      !isbjunk(b[bestj + bestsize]) &&
      a[besti + bestsize] == b[bestj + bestsize]
    ) {
      bestsize++;
    }

    while (besti > alo && bestj > blo && isbjunk(b[bestj - 1]) && a[besti - 1] == b[bestj - 1]) {
      besti--;
      bestj--;
      bestsize++;
    }

    while (
      besti + bestsize < ahi &&
      bestj + bestsize < bhi &&
      isbjunk(b[bestj + bestsize]) &&
      a[besti + bestsize] == b[bestj + bestsize]
    ) {
      bestsize++;
    }

    return [besti, bestj, bestsize];
  }

  get_matching_blocks() {
    if (this.matching_blocks != null) return this.matching_blocks;
    var la = this.a.length;
    var lb = this.b.length;

    var queue = [[0, la, 0, lb]];
    var matching_blocks = [];
    var alo, ahi, blo, bhi, qi, i, j, k, x;
    while (queue.length) {
      qi = queue.pop()!;
      alo = qi[0];
      ahi = qi[1];
      blo = qi[2];
      bhi = qi[3];
      x = this.find_longest_match(alo, ahi, blo, bhi);
      i = x[0];
      j = x[1];
      k = x[2];

      if (k) {
        matching_blocks.push(x);
        if (alo < i && blo < j) queue.push([alo, i, blo, j]);
        if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
      }
    }

    matching_blocks.sort(__ntuplecomp);

    var i1 = 0,
      j1 = 0,
      k1 = 0;
    var i2, j2, k2;
    var non_adjacent = [];
    for (var idx in matching_blocks) {
      if (matching_blocks.hasOwnProperty(idx)) {
        let block = matching_blocks[idx];
        i2 = block[0];
        j2 = block[1];
        k2 = block[2];
        if (i1 + k1 == i2 && j1 + k1 == j2) {
          k1 += k2;
        } else {
          if (k1) non_adjacent.push([i1, j1, k1]);
          i1 = i2;
          j1 = j2;
          k1 = k2;
        }
      }
    }

    if (k1) non_adjacent.push([i1, j1, k1]);

    non_adjacent.push([la, lb, 0]);
    this.matching_blocks = non_adjacent;
    return this.matching_blocks;
  }

  get_opcodes() {
    if (this.opcodes != null) return this.opcodes;
    var i = 0;
    var j = 0;
    var answer: OpCode[] = [];
    this.opcodes = answer;
    var block, ai, bj, size;
    var blocks = this.get_matching_blocks();
    for (var idx in blocks) {
      if (blocks.hasOwnProperty(idx)) {
        block = blocks[idx];
        ai = block[0];
        bj = block[1];
        size = block[2];
        let tag: OpCode[0] | '' = '';
        if (i < ai && j < bj) {
          tag = 'replace';
        } else if (i < ai) {
          tag = 'delete';
        } else if (j < bj) {
          tag = 'insert';
        }
        if (tag) answer.push([tag, i, ai, j, bj]);
        i = ai + size;
        j = bj + size;

        if (size) answer.push(['equal', ai, i, bj, j]);
      }
    }

    return answer;
  }

  // this is a generator function in the python lib, which of course is not supported in javascript
  // the reimplementation builds up the grouped opcodes into a list in their entirety and returns that.
  get_grouped_opcodes(n = 3) {
    var codes = this.get_opcodes();
    if (!codes) codes = [['equal', 0, 1, 0, 1]];
    var code, tag, i1, i2, j1, j2;
    if (codes[0][0] == 'equal') {
      code = codes[0];
      tag = code[0];
      i1 = code[1];
      i2 = code[2];
      j1 = code[3];
      j2 = code[4];
      codes[0] = [tag, Math.max(i1, i2 - n), i2, Math.max(j1, j2 - n), j2];
    }
    if (codes[codes.length - 1][0] == 'equal') {
      code = codes[codes.length - 1];
      tag = code[0];
      i1 = code[1];
      i2 = code[2];
      j1 = code[3];
      j2 = code[4];
      codes[codes.length - 1] = [tag, i1, Math.min(i2, i1 + n), j1, Math.min(j2, j1 + n)];
    }

    var nn = n + n;
    var group = [];
    var groups = [];
    for (var idx in codes) {
      if (codes.hasOwnProperty(idx)) {
        code = codes[idx];
        tag = code[0];
        i1 = code[1];
        i2 = code[2];
        j1 = code[3];
        j2 = code[4];
        if (tag == 'equal' && i2 - i1 > nn) {
          group.push([tag, i1, Math.min(i2, i1 + n), j1, Math.min(j2, j1 + n)]);
          groups.push(group);
          group = [];
          i1 = Math.max(i1, i2 - n);
          j1 = Math.max(j1, j2 - n);
        }

        group.push([tag, i1, i2, j1, j2]);
      }
    }

    if (group && !(group.length == 1 && group[0][0] == 'equal')) groups.push(group);

    return groups;
  }

  ratio() {
    const matches = this.get_matching_blocks().reduce(
      (sum, triple) => sum + triple[triple.length - 1],
      0,
    );
    return __calculate_ratio(matches, this.a.length + this.b.length);
  }

  quick_ratio() {
    let fullbcount;
    if (this.fullbcount == null) {
      this.fullbcount = {};
      fullbcount = this.fullbcount;
      for (var i = 0; i < this.b.length; i++) {
        const elt = this.b[i];
        fullbcount[elt] = __dictget(fullbcount, elt, 0) + 1;
      }
    }
    fullbcount = this.fullbcount;

    var avail: Record<string, number> = {};
    var availhas = __isindict(avail);
    var matches = 0;
    var numb = 0;
    for (var i = 0; i < this.a.length; i++) {
      const elt = this.a[i];
      if (availhas(elt)) {
        numb = avail[elt];
      } else {
        numb = __dictget(fullbcount, elt, 0);
      }
      avail[elt] = numb - 1;
      if (numb > 0) matches++;
    }

    return __calculate_ratio(matches, this.a.length + this.b.length);
  }
}
