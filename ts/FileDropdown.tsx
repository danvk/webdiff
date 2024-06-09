import React from 'react';
import {FilePair} from './CodeDiffContainer';
import {filePairDisplayName} from './utils';

export interface Props {
  filePairs: FilePair[];
  selectedIndex: number;
  fileChangeHandler: (newIndex: number) => void;
}

/** A list of files in a dropdown menu. This is more compact with many files. */
export function FileDropdown(props: Props) {
  const {filePairs, selectedIndex, fileChangeHandler} = props;

  const linkOrNone = (idx: number) => {
    if (idx < 0 || idx >= filePairs.length) {
      return <i>none</i>;
    } else {
      return (
        <a
          href="#"
          onClick={() => {
            fileChangeHandler(idx);
          }}>
          {filePairDisplayName(filePairs[idx])}
        </a>
      );
    }
  };

  const prevLink = linkOrNone(props.selectedIndex - 1);
  const nextLink = linkOrNone(props.selectedIndex + 1);

  const options = filePairs.map((filePair, idx) => (
    <option key={idx} value={idx}>
      {filePairDisplayName(filePair)} ({filePair.type})
    </option>
  ));

  return (
    <div className="file-dropdown">
      Prev (k): {prevLink}
      <br />
      <select
        value={selectedIndex}
        onChange={e => {
          fileChangeHandler(Number(e.target.value));
        }}>
        {options}
      </select>
      <br />
      Next (j): {nextLink}
    </div>
  );
}
