import {filePairDisplayName} from '../utils';

test('util.filePairDisplayName', () => {
  const props = {idx: 0, is_image_diff: false} as const;
  expect(
    filePairDisplayName({
      ...props,
      type: 'delete',
      a: 'dir/file.json',
      b: '',
      num_add: 0,
      num_delete: 0,
    }),
  ).toEqual('dir/file.json');

  const rename = (a: string, b: string) => {
    return filePairDisplayName({...props, type: 'move', a, b, num_add: 0, num_delete: 0});
  };
  expect(rename('file.json', 'renamed.json')).toEqual('{file → renamed}.json');
  expect(rename('dir/file.json', 'dir/renamed.json')).toEqual('dir/{file → renamed}.json');
  expect(rename('file.json', 'dir/file.json')).toEqual('{ → dir/}file.json');
  expect(rename('/foo/bar/file.json', '/foo/baz/file.json')).toEqual('/foo/{bar → baz}/file.json');
  expect(rename('/foo/bar/file.json', '/foo/file.json')).toEqual('/foo/{bar/ → }file.json');

  // this one is controversial, maybe better not to factor out anything?
  expect(rename('/foo/bar/file.json', '/fox/bar/file.js')).toEqual(
    '/{foo → fox}/bar/file.{json → js}',
  );
});
