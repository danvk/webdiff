import React from 'react';

import {DiffRange} from './codes';
import {closest, copyOnlyMatching, distributeSpans} from './dom-utils';
import {addCharacterDiffs} from './char-diffs';
import {stringAsLines} from './string-utils';
import {isLegitKeypress} from '../file_diff';

export interface PatchOptions {
  /** Minimum number of skipped lines to elide into a "jump" row */
  minJumpSize: number;
  /** Number of additional lines to show when you click an expand arrow. */
  expandLines: number;
  language: string | null;
  beforeName: string;
  afterName: string;
  wordWrap: boolean;
}

const DEFAULT_PARAMS: PatchOptions = {
  minJumpSize: 10,
  language: null,
  beforeName: 'Before',
  afterName: 'After',
  wordWrap: false,
  expandLines: 10,
};

/**
 * @return Lines marked up with syntax <span>s. The <span>
 *     tags will be balanced within each line.
 */
function highlightText(text: string, language: string): string[] | null {
  // TODO(danvk): look into suppressing highlighting if .relevance is low.
  const html = hljs.highlight(text, {language, ignoreIllegals: true}).value;

  // Some of the <span>s might cross lines, which won't work for our diff
  // structure. We convert them to single-line only <spans> here.
  return distributeSpans(html);
}

/** This removes small skips like "skip 1 line" that are disallowed by minJumpSize. */
function enforceMinJumpSize(diffs: DiffRange[], minJumpSize: number): DiffRange[] {
  return diffs.map(d =>
    d.type === 'skip' && d.before[1] - d.before[0] < minJumpSize
      ? {
          ...d,
          type: 'equal',
        }
      : d,
  );
}

export interface Props {
  beforeText: string | null;
  afterText: string | null;
  ops: DiffRange[];
  params: Partial<PatchOptions>;
}

export function CodeDiff(props: Props) {
  const {beforeText, afterText, ops, params} = props;
  const beforeLines = React.useMemo(
    () => (beforeText ? stringAsLines(beforeText) : []),
    [beforeText],
  );
  const afterLines = React.useMemo(() => (afterText ? stringAsLines(afterText) : []), [afterText]);
  const fullParams = React.useMemo(() => ({...DEFAULT_PARAMS, ...params}), [params]);
  const diffRanges = React.useMemo(
    () => enforceMinJumpSize(ops, fullParams.minJumpSize),
    [ops, fullParams],
  );
  const {language} = fullParams;

  const [beforeLinesHighlighted, afterLinesHighlighted] = React.useMemo(() => {
    if (!language) return [null, null];
    return [highlightText(beforeText ?? '', language), highlightText(afterText ?? '', language)];
  }, [language, beforeText, afterText]);

  return (
    <CodeDiffView
      beforeLines={beforeLines}
      beforeLinesHighlighted={beforeLinesHighlighted}
      afterLines={afterLines}
      afterLinesHighlighted={afterLinesHighlighted}
      params={fullParams}
      ops={diffRanges}
    />
  );
}

interface CodeDiffViewProps {
  beforeLines: readonly string[];
  afterLines: readonly string[];
  beforeLinesHighlighted: readonly string[] | null;
  afterLinesHighlighted: readonly string[] | null;
  params: PatchOptions;
  ops: readonly DiffRange[];
}

const CodeDiffView = React.memo((props: CodeDiffViewProps) => {
  const {
    params,
    ops: initOps,
    afterLines,
    afterLinesHighlighted,
    beforeLines,
    beforeLinesHighlighted,
  } = props;
  const {expandLines} = params;
  // Clicking a "show more lines" link can change the diffops
  const [ops, setOps] = React.useState(initOps);
  React.useEffect(() => {
    // e.g. if the user changes the git diff flags and we get new ops.
    // this will blow away all "show more lines" actions
    setOps(initOps);
  }, [initOps]);
  const [selectedLine, setSelectedLine] = React.useState<number | undefined>();
  const handleShowMore = (existing: SkipRange, num: number) => {
    setOps(oldOps =>
      oldOps.flatMap(op => {
        if (op.before[0] !== existing.beforeStartLine) {
          return [op];
        }
        if (num === existing.numRows) {
          // change the skip to an equal
          return [{...op, type: 'equal'}];
        }

        const {before, after} = op;
        if (num > 0) {
          return [
            {...op, before: [before[0], before[1] - num], after: [after[0], after[1] - num]},
            {
              type: 'equal',
              before: [before[1] - num, before[1]],
              after: [after[1] - num, after[1]],
            },
          ];
        } else {
          num = -num;
          return [
            {
              type: 'equal',
              before: [before[0], before[0] + num],
              after: [after[0], after[0] + num],
            },
            {...op, before: [before[0] + num, before[1]], after: [after[0] + num, after[1]]},
          ];
        }
      }),
    );
  };

  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isLegitKeypress(e)) return;
      if (e.code === 'KeyN') {
        if (selectedLine === undefined) {
          setSelectedLine(0);
        } else {
          for (const range of ops) {
            const {after} = range;
            const afterStart = after[0];
            if (selectedLine < afterStart) {
              setSelectedLine(afterStart);
              break;
            }
          }
        }
      } else if (e.code === 'KeyP') {
        if (selectedLine !== undefined) {
          for (let i = ops.length - 1; i >= 0; i--) {
            const range = ops[i];
            const {after} = range;
            const afterStart = after[0];
            if (selectedLine > afterStart) {
              setSelectedLine(afterStart);
              break;
            }
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [ops, selectedLine]);

  const diffRows = [];
  for (const range of ops) {
    const {type} = range;
    const {before, after} = range;
    const numBeforeRows = before[1] - before[0];
    const numAfterRows = after[1] - after[0];
    const numRows = Math.max(numBeforeRows, numAfterRows);
    const beforeStartLine = before[0];
    const afterStartLine = after[0];
    const isSelected = afterStartLine === selectedLine;
    if (type == 'skip') {
      diffRows.push(
        <SkipRow
          key={`${beforeStartLine}-${afterStartLine}`}
          beforeStartLine={beforeStartLine}
          afterStartLine={afterStartLine}
          numRows={numRows}
          header={range.header ?? null}
          expandLines={expandLines}
          onShowMore={handleShowMore}
          isSelected={isSelected}
        />,
      );
    } else {
      for (let j = 0; j < numRows; j++) {
        const beforeIdx = j < numBeforeRows ? beforeStartLine + j : null;
        const afterIdx = j < numAfterRows ? afterStartLine + j : null;
        const beforeText = beforeIdx !== null ? beforeLines[beforeIdx] : undefined;
        const beforeHTML =
          beforeIdx !== null && beforeLinesHighlighted
            ? beforeLinesHighlighted[beforeIdx]
            : undefined;
        const afterText = afterIdx !== null ? afterLines[afterIdx] : undefined;
        const afterHTML =
          afterIdx !== null && afterLinesHighlighted ? afterLinesHighlighted[afterIdx] : undefined;
        diffRows.push(
          <DiffRow
            key={`${beforeIdx}-${afterIdx}`}
            type={type}
            beforeLineNum={beforeIdx != null ? 1 + beforeIdx : null}
            afterLineNum={afterIdx != null ? 1 + afterIdx : null}
            beforeText={beforeText}
            beforeHTML={beforeHTML}
            afterText={afterText}
            afterHTML={afterHTML}
            isSelected={j === 0 && isSelected}
          />,
        );
      }
    }
  }

  const [selectingState, setSelectingState] = React.useState<'left' | 'right' | null>(null);
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const td = closest(e.target as Element, 'td');
    if (!td) {
      return;
    }
    if (td.classList.contains('before')) {
      setSelectingState('left');
    } else if (td.classList.contains('after')) {
      setSelectingState('right');
    }
  };
  const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!selectingState) return;
    const isLeft = selectingState === 'left';
    copyOnlyMatching(e.nativeEvent, 'td.' + (isLeft ? 'before' : 'after'));
  };

  const divClassName = 'diff' + (selectingState ? ` selecting-${selectingState}` : '');
  const tableClassName = 'diff' + (params.wordWrap ? ' word-wrap' : '');
  return (
    <div className={divClassName} onMouseDown={handleMouseDown} onCopy={handleCopy}>
      <table className={tableClassName}>
        <thead>
          <tr>
            <th className="diff-header" colSpan={2}>
              {params.beforeName}
            </th>
            <th className="diff-header" colSpan={2}>
              {params.afterName}
            </th>
          </tr>
        </thead>
        <tbody>{diffRows}</tbody>
      </table>
    </div>
  );
});

interface SkipRange {
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

function SkipRow(props: SkipRowProps) {
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
  const headerHTML = header ? <span className="hunk-header">${header}</span> : '';

  const rowRef = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (isSelected && rowRef.current) {
      (rowRef.current as any).scrollIntoViewIfNeeded();
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

// TODO: factor out a {text, html} type
interface DiffRowProps {
  type: DiffRange['type'];
  beforeLineNum: number | null;
  afterLineNum: number | null;
  beforeText: string | undefined;
  beforeHTML?: string;
  afterText: string | undefined;
  afterHTML?: string;
  isSelected: boolean;
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const makeCodeTd = (type: string, text: string | undefined, html: string | undefined) => {
  if (text === undefined) {
    return {text: '', html: '', className: 'empty code'};
  }
  if (html === undefined) {
    html = escapeHtml(text);
  }
  text = text.replaceAll('\t', '\u00a0\u00a0\u00a0\u00a0');
  html = html.replaceAll('\t', '\u00a0\u00a0\u00a0\u00a0');
  const className = 'code ' + type;
  return {className, html, text};
};

function DiffRow(props: DiffRowProps) {
  const {beforeLineNum, afterLineNum, type, isSelected} = props;
  const cells = [
    makeCodeTd(type, props.beforeText, props.beforeHTML),
    makeCodeTd(type, props.afterText, props.afterHTML),
  ];
  let [beforeHtml, afterHtml] = [cells[0].html, cells[1].html];
  if (type === 'replace') {
    [beforeHtml, afterHtml] = addCharacterDiffs(
      cells[0].text,
      cells[0].html,
      cells[1].text,
      cells[1].html,
    );
  }
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (isSelected && rowRef.current) {
      (rowRef.current as any).scrollIntoViewIfNeeded();
    }
  }, [isSelected]);
  return (
    <tr ref={rowRef} className={isSelected ? 'selected' : undefined}>
      <td className="line-no">{beforeLineNum ?? ''}</td>
      <td
        className={cells[0].className + ' before'}
        dangerouslySetInnerHTML={{__html: beforeHtml}}></td>
      <td
        className={cells[1].className + ' after'}
        dangerouslySetInnerHTML={{__html: afterHtml}}></td>
      <td className="line-no">{afterLineNum ?? ''}</td>
    </tr>
  );
}
