import React, { ReactText } from 'react';

import {DiffOptions} from './CodeDiff';

export interface Props {
  options: Partial<DiffOptions>;
  setOptions: (newOptions: Partial<DiffOptions>) => void;
}

export function DiffOptionsControl(props: Props) {
  const {options, setOptions} = props;

  const toggleIgnoreAllSpace = () => {
    setOptions({...options, ignoreAllSpace: !options.ignoreAllSpace})
  };
  const setUnifiedContext: React.ChangeEventHandler<HTMLInputElement> = e => {
    setOptions({...options, unified: e.currentTarget.valueAsNumber});
  };
  const changeDiffAlgorithm: React.ChangeEventHandler<HTMLSelectElement> = e => {
    setOptions({...options, diffAlgorithm: e.currentTarget.value as DiffOptions['diffAlgorithm']});
  };

  return (
    <>
      <input type="checkbox" checked={!!options.ignoreAllSpace} id="ignore-all-space" onChange={toggleIgnoreAllSpace} />
      {' '}<label htmlFor='ignore-all-space'>Ignore All Space (<code>git diff -w</code>)</label>
      <br/>
      Context:{' '}
      <input type="number" min={1} max={100} value={options.unified ?? 8} onChange={setUnifiedContext} />
      <br/>
      Diff Algorithm:{' '}
      <select value={options.diffAlgorithm ?? 'myers'} onChange={changeDiffAlgorithm}>
        <option value="myers">Myers (Default)</option>
        <option value="patience">Patience</option>
        <option value="minimal">Minimal</option>
        <option value="histogram">Histogram</option>
      </select>
    </>
  );
}
