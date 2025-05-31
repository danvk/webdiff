import {flagsToGitDiffOptions, gitDiffOptionsToFlags} from '../diff-options';

describe('encodeDiffOptions', () => {
  it('should encode no flags', () => {
    expect(gitDiffOptionsToFlags({})).toEqual([]);
  });

  it('should encode basic flags', () => {
    expect(gitDiffOptionsToFlags({diffAlgorithm: 'patience'})).toEqual(['--diff-algorithm=patience']);
    expect(gitDiffOptionsToFlags({ignoreAllSpace: true})).toEqual(['-w']);
    expect(gitDiffOptionsToFlags({ignoreSpaceChange: true})).toEqual(['-b']);
    expect(gitDiffOptionsToFlags({unified: 16})).toEqual(['-U16']);
    expect(gitDiffOptionsToFlags({functionContext: true})).toEqual(['-W']);
  });

  it('should decode flags', () => {
    expect(flagsToGitDiffOptions(['-w'])).toEqual({ignoreAllSpace: true});
    expect(flagsToGitDiffOptions(['-W'])).toEqual({functionContext: true});
  });
});
