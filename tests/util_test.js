QUnit.test('util.filePairDisplayName', function(assert) {
  assert.deepEqual(filePairDisplayName({
                      type: 'delete',
                      a: 'dir/file.json',
                      b: null
                   }),
                   'dir/file.json');

  var rename = function(a, b) {
    return filePairDisplayName({type: 'move', a: a, b: b});
  };
  assert.deepEqual(rename('file.json', 'renamed.json'),
                   '{file → renamed}.json');
  assert.deepEqual(rename('dir/file.json', 'dir/renamed.json'),
                   'dir/{file → renamed}.json');
  assert.deepEqual(rename('file.json', 'dir/file.json'),
                   '{ → dir/}file.json');
  assert.deepEqual(rename('/foo/bar/file.json', '/foo/baz/file.json'),
                   '/foo/{bar → baz}/file.json');
  assert.deepEqual(rename('/foo/bar/file.json', '/foo/file.json'),
                   '/foo{/bar → }/file.json');

  // this one is controversial, maybe better not to factor out anything?
  assert.deepEqual(rename('/foo/bar/file.json', '/fox/bar/file.js'),
                   '/{foo → fox}/bar/file.{json → js}');
});
