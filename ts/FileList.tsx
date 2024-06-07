import React from 'react';
import {FilePair} from './CodeDiffContainer';
import {filePairDisplayName} from './utils';

export interface Props {
  filePairs: FilePair[];
  selectedIndex: number;
  fileChangeHandler: (newIndex: number) => void;
}

/**
 * A list of all the files. Clicking a non-selected file selects it.
 * This view is simpler and generally preferable for short lists of files.
 */
export function FileList(props: Props) {
  const {filePairs, selectedIndex, fileChangeHandler} = props;

  const lis = filePairs.map((filePair, idx) => {
    const displayName = filePairDisplayName(filePair);
    const content =
      idx !== selectedIndex ? (
        <a onClick={() => fileChangeHandler(idx)} href="#">
          {displayName}
        </a>
      ) : (
        <b>{displayName}</b>
      );
    return (
      <li key={idx}>
        <span title={filePair.type} className={`diff ${filePair.type}`} />
        {content}
      </li>
    );
  });
  return <ul className="file-list">{lis}</ul>;
}
