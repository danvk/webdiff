import React from 'react';
import {scrollIntoViewIfNeeded} from './dom-utils';

export interface SkipRange {
  beforeStartLine: number;
  afterStartLine: number;
  numRows: number;
}

export interface SkipRowProps extends SkipRange {
  header: string | null;
  expandLines: number;
  /** positive num = expand down, negative num = expand up */
  onShowMore: (existing: SkipRange, num: number) => void;
  isSelected: boolean;
}

export function SkipRow(props: SkipRowProps) {
  const {expandLines, header, onShowMore, isSelected, ...range} = props;
  const {numRows} = range;
  const showAll = (e: React.MouseEvent) => {
    e.preventDefault();
    onShowMore(range, numRows);
  };
  const arrows =
    numRows <= expandLines ? (
      <span className="skip" title={`show ${numRows} skipped lines`} onClick={showAll}>
        ↕
      </span>
    ) : (
      <>
        <span
          className="skip expand-up"
          title={`show ${expandLines} more lines above`}
          onClick={() => {
            onShowMore(range, -expandLines);
          }}>
          ↥
        </span>
        <span
          className="skip expand-down"
          title={`show ${expandLines} more lines below`}
          onClick={() => {
            onShowMore(range, expandLines);
          }}>
          ↧
        </span>
      </>
    );
  const showMore = (
    <a href="#" onClick={showAll}>
      Show {numRows} more lines
    </a>
  );
  const headerHTML = header ? <span className="hunk-header">{header}</span> : '';

  const rowRef = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (isSelected && rowRef.current) {
      scrollIntoViewIfNeeded(rowRef.current);
    }
  }, [isSelected]);
  return (
    <tr ref={rowRef} className={'skip-row' + (isSelected ? ` selected` : '')}>
      <td colSpan={4} className="skip code">
        <span className="arrows-left">{arrows}</span>
        {showMore} {headerHTML}
        <span className="arrows-right">{arrows}</span>
      </td>
    </tr>
  );
}
