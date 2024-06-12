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

  const maxDelta = React.useMemo(() => {
    return Math.max(1, ...filePairs.map(fp => (fp.num_add ?? 0) + (fp.num_delete ?? 0)));
  }, [filePairs]);

  const lis = filePairs.map((filePair, idx) => {
    const displayName = filePairDisplayName(filePair);
    const content =
      idx !== selectedIndex ? (
        <a
          onClick={() => {
            fileChangeHandler(idx);
          }}
          href="#">
          {displayName}
        </a>
      ) : (
        <b>{displayName}</b>
      );
    return (
      <li key={idx}>
        <SparkChart maxDelta={maxDelta} numAdd={filePair.num_add} numDelete={filePair.num_delete} />
        <span title={filePair.type} className={`diff ${filePair.type}`} />
        {content}
      </li>
    );
  });
  return <ul className="file-list">{lis}</ul>;
}

interface SparkChartProps {
  maxDelta: number;
  numAdd: number | null;
  numDelete: number | null;
}

function SparkChart(props: SparkChartProps) {
  const {numAdd, numDelete, maxDelta} = props;
  if (numAdd === null || numDelete === null) {
    return null;
  }
  return (
    <div className="spark">
      {numAdd > 0 && (
        <div className="add" style={{width: `${Math.round((100 * numAdd) / maxDelta)}%`}}></div>
      )}
      {numDelete > 0 && (
        <div
          className="delete"
          style={{width: `${Math.round((100 * numDelete) / maxDelta)}%`}}></div>
      )}
    </div>
  );
}
