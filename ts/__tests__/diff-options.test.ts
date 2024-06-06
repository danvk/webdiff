import {decodeDiffOptions, encodeDiffOptions} from '../diff-options';

describe('encodeDiffOptions', () => {
  it('should encode no flags', () => {
    expect(encodeDiffOptions({})).toEqual([]);
  });

  it('should encode basic flags', () => {
    expect(encodeDiffOptions({diffAlgorithm: 'patience'})).toEqual(['--diff-algorithm=patience']);
    expect(encodeDiffOptions({ignoreAllSpace: true})).toEqual(['-w']);
    expect(encodeDiffOptions({ignoreSpaceChange: true})).toEqual(['-b']);
    expect(encodeDiffOptions({unified: 16})).toEqual(['-U16']);
    expect(encodeDiffOptions({functionContext: true})).toEqual(['-W']);
  });

  it('should decode flags', () => {
    expect(decodeDiffOptions('-w')).toEqual({ignoreAllSpace: true});
  });
});
