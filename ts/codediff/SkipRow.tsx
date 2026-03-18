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
      <span className="skip right" title={`show ${numRows} skipped lines`} onClick={showAll}>
        ↕
      </span>
    ) : (
      <>
        <span
          className="skip right expand-up"
          title={`show ${expandLines} more lines above`}
          onClick={() => {
            onShowMore(range, -expandLines);
          }}>
          ∨ EXPAND
        </span>
        <span
          className="skip right expand-down"
          title={`show ${expandLines} more lines below`}
          onClick={() => {
            onShowMore(range, expandLines);
          }}>
          ∧ EXPAND
        </span>
      </>
    );
  const showMore = (
    <a href="#" onClick={showAll} className="show-more">
      ↕ Show {numRows} more lines
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
        {arrows}
        {showMore} {headerHTML}
      </td>
    </tr>
  );
}
