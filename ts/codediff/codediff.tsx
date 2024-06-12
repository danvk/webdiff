import React from 'react';

import {DiffRange} from './codes';
import {closest, copyOnlyMatching, distributeSpans} from './dom-utils';
import {stringAsLines} from './string-utils';
import {isLegitKeypress} from '../file_diff';
import {DiffRow} from './DiffRow';
import {SkipRange, SkipRow} from './SkipRow';
import {FilePair} from '../CodeDiffContainer';

export interface PatchOptions {
  /** Minimum number of skipped lines to elide into a "jump" row */
  minJumpSize: number;
  /** Number of additional lines to show when you click an expand arrow. */
  expandLines: number;
  language: string | null;
  wordWrap: boolean;
}

const DEFAULT_PARAMS: PatchOptions = {
  minJumpSize: 10,
  language: null,
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
  filePair: FilePair;
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
      filePair={props.filePair}
      params={fullParams}
      ops={diffRanges}
    />
  );
}

function moveUpDown(
  dir: 'up' | 'down',
  selectedLine: number | undefined,
  ops: readonly DiffRange[],
): number | undefined {
  if (dir === 'up') {
    if (selectedLine === undefined) {
      return 0;
    } else {
      for (const range of ops) {
        const {after} = range;
        const afterStart = after[0];
        if (selectedLine < afterStart) {
          return afterStart;
        }
      }
      // TODO: if the last hunk was already selected, advance to the next file.
    }
  } else {
    if (selectedLine !== undefined) {
      for (let i = ops.length - 1; i >= 0; i--) {
        const range = ops[i];
        const {after} = range;
        const afterStart = after[0];
        if (selectedLine > afterStart) {
          return afterStart;
        }
      }
    }
  }
}

interface CodeDiffViewProps {
  beforeLines: readonly string[];
  afterLines: readonly string[];
  beforeLinesHighlighted: readonly string[] | null;
  afterLinesHighlighted: readonly string[] | null;
  filePair: FilePair;
  params: PatchOptions;
  ops: readonly DiffRange[];
}

const CodeDiffView = React.memo((props: CodeDiffViewProps) => {
  const {
    filePair,
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
      if (e.code !== 'KeyN' && e.code !== 'KeyP') return;
      const newSelectedLine = moveUpDown(e.code === 'KeyN' ? 'up' : 'down', selectedLine, ops);
      if (newSelectedLine !== undefined) {
        setSelectedLine(newSelectedLine);
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
  const handleMouseDown = (e: React.MouseEvent) => {
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
  const handleCopy = (e: React.ClipboardEvent) => {
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
          <HeaderRow filePair={filePair} />
        </thead>
        <tbody>{diffRows}</tbody>
      </table>
    </div>
  );
});

function HeaderRow({filePair}: {filePair: FilePair}) {
  const {a, b, num_add, num_delete} = filePair;
  const addEl = num_add ? <span className="num-add">+{num_add}</span> : null;
  const deleteEl = num_delete ? <span className="num-delete">-{num_delete}</span> : null;
  const deltaEl = (
    <span className="delta">
      {deleteEl} {addEl}
    </span>
  );
  return (
    <tr>
      {a === b ? (
        <th className="diff-header combined" colSpan={4}>
          {a} {deltaEl}
        </th>
      ) : (
        <>
          <th className="diff-header left" colSpan={2}>
            {a}
          </th>
          <th className="diff-header right" colSpan={2}>
            {b} {deltaEl}
          </th>
        </>
      )}
    </tr>
  );
}
