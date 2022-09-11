import React from 'react';

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

  return (
    <>
      <input type="checkbox" checked={!!options.ignoreAllSpace} id="ignore-all-space" onChange={toggleIgnoreAllSpace} />
      {' '}<label htmlFor='ignore-all-space'>Ignore All Space (<code>git diff -w</code>)</label>
    </>
  );
}
