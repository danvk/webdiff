import { decodeDiffOptions, encodeDiffOptions } from "../diff-options";

describe('encodeDiffOptions', () => {
  it('should encode no flags', () => {
    expect(encodeDiffOptions({})).toEqual(['-U8']);
  });

  it('should encode basic flags', () => {
    expect(encodeDiffOptions({ diffAlgorithm: 'patience' })).toEqual(['--diff-algorithm=patience', '-U8']);
    expect(encodeDiffOptions({ ignoreAllSpace: true })).toEqual(['-w', '-U8']);
    expect(encodeDiffOptions({ ignoreSpaceChange: true })).toEqual(['-b', '-U8']);
    expect(encodeDiffOptions({ unified: 16 })).toEqual(['-U16']);
    expect(encodeDiffOptions({ functionContext: true })).toEqual(['-U8', '-W']);
  });

  it('should decode flags', () => {
    expect(decodeDiffOptions('-w')).toEqual({ ignoreAllSpace: true });
  });
});
