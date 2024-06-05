QUnit.test('generates same diff ranges as jsdifflib', function(assert) {
  // These are the opcodes for test.html
  var opcodes = [
    ["equal",   0, 9, 0, 9],
    ["replace", 9,11, 9,11],
    ["equal",  11,14,11,14],
    ["delete", 14,16,14,14],
    ["equal",  16,18,14,16],
    ["insert", 18,18,16,17],
    ["equal",  18,27,17,26],
    ["replace",27,28,26,27],
    ["equal",  28,31,27,30],
    ["delete", 31,32,30,30],
    ["equal",  32,43,30,41]
  ]

  var ranges = codediff.opcodesToDiffRanges(opcodes, 3, 0);
  assert.deepEqual(ranges, [
    {type: 'skip',    before: [ 0, 6],  after: [ 0,  6]},
    {type: 'equal',   before: [ 6, 9],  after: [ 6,  9]},
    {type: 'replace', before: [ 9, 11], after: [ 9, 11]},
    {type: 'equal',   before: [11, 14], after: [11, 14]},
    {type: 'delete',  before: [14, 16], after: [14, 14]},
    {type: 'equal',   before: [16, 18], after: [14, 16]},
    {type: 'insert',  before: [18, 18], after: [16, 17]},
    {type: 'equal',   before: [18, 21], after: [17, 20]},
    {type: 'skip',    before: [21, 24], after: [20, 23]},
    {type: 'equal',   before: [24, 27], after: [23, 26]},
    {type: 'replace', before: [27, 28], after: [26, 27]},
    {type: 'equal',   before: [28, 31], after: [27, 30]},
    {type: 'delete',  before: [31, 32], after: [30, 30]},
    {type: 'equal',   before: [32, 35], after: [30, 33]},
    {type: 'skip',    before: [35, 43], after: [33, 41]}
  ]);

  var ranges = codediff.opcodesToDiffRanges(opcodes, 3, 5);  // minJumpSize = 5
  assert.deepEqual(ranges, [
    {type: 'skip',    before: [ 0, 6],  after: [ 0,  6]},
    {type: 'equal',   before: [ 6, 9],  after: [ 6,  9]},
    {type: 'replace', before: [ 9, 11], after: [ 9, 11]},
    {type: 'equal',   before: [11, 14], after: [11, 14]},
    {type: 'delete',  before: [14, 16], after: [14, 14]},
    {type: 'equal',   before: [16, 18], after: [14, 16]},
    {type: 'insert',  before: [18, 18], after: [16, 17]},
    {type: 'equal',   before: [18, 27], after: [17, 26]},  // (eq-skip-eq above)
    {type: 'replace', before: [27, 28], after: [26, 27]},
    {type: 'equal',   before: [28, 31], after: [27, 30]},
    {type: 'delete',  before: [31, 32], after: [30, 30]},
    {type: 'equal',   before: [32, 35], after: [30, 33]},
    {type: 'skip',    before: [35, 43], after: [33, 41]}
  ]);

  var ranges = codediff.opcodesToDiffRanges(opcodes, 3, 10);  // minJumpSize = 10
  assert.deepEqual(ranges, [
    {type: 'equal',   before: [ 0, 9],  after: [ 0,  9]},  // was skip
    {type: 'replace', before: [ 9, 11], after: [ 9, 11]},
    {type: 'equal',   before: [11, 14], after: [11, 14]},
    {type: 'delete',  before: [14, 16], after: [14, 14]},
    {type: 'equal',   before: [16, 18], after: [14, 16]},
    {type: 'insert',  before: [18, 18], after: [16, 17]},
    {type: 'equal',   before: [18, 27], after: [17, 26]},  // was skip
    {type: 'replace', before: [27, 28], after: [26, 27]},
    {type: 'equal',   before: [28, 31], after: [27, 30]},
    {type: 'delete',  before: [31, 32], after: [30, 30]},
    {type: 'equal',   before: [32, 43], after: [30, 41]}   // was skip
  ]);
});
