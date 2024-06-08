import * as difflib from './difflib';

type OpType = difflib.OpCode[0];

export type LineRange = [start: number, limit: number];

export interface DiffRange {
  type: OpType | 'skip';
  before: LineRange;
  after: LineRange;
  header?: string;
}

/**
 * Input is a list of opcodes, as output by difflib.
 * Output is a list of diff ranges which corresponds precisely to the view, including skips.
 */
export function addSkips(
  opcodes: difflib.OpCode[],
  contextSize: number,
  minJumpSize: number,
): DiffRange[] {
  const ranges: DiffRange[] = [];

  for (let i = 0; i < opcodes.length; i++) {
    const opcode = opcodes[i];
    const [change, beforeIdx, beforeEnd, afterIdx, afterEnd] = opcode;
    const range: DiffRange = {
      type: change,
      before: [beforeIdx, beforeEnd],
      after: [afterIdx, afterEnd],
    };
    if (change !== 'equal') {
      ranges.push(range);
      continue;
    }

    // Should this "equal" range have a jump inserted?
    // First remove `contextSize` lines from either end.
    // If this leaves more than minJumpSize rows, then splice in a jump.
    const rowCount = beforeEnd - beforeIdx; // would be same for after{End,Idx}
    const isStart = i == 0;
    const isEnd = i == opcodes.length - 1;
    const firstSkipOffset = isStart ? 0 : contextSize;
    const lastSkipOffset = rowCount - (isEnd ? 0 : contextSize);
    const skipLength = lastSkipOffset - firstSkipOffset;

    if (skipLength === 0 || skipLength < minJumpSize) {
      ranges.push(range);
      continue;
    }

    // Convert the 'equal' block to an equal-skip-equal sequence.
    if (firstSkipOffset > 0) {
      ranges.push({
        type: 'equal',
        before: [beforeIdx, beforeIdx + firstSkipOffset],
        after: [afterIdx, afterIdx + firstSkipOffset],
      });
    }
    ranges.push({
      type: 'skip',
      before: [beforeIdx + firstSkipOffset, beforeIdx + lastSkipOffset],
      after: [afterIdx + firstSkipOffset, afterIdx + lastSkipOffset],
    });
    if (lastSkipOffset < rowCount) {
      ranges.push({
        type: 'equal',
        before: [beforeIdx + lastSkipOffset, beforeEnd],
        after: [afterIdx + lastSkipOffset, afterEnd],
      });
    }
  }

  return ranges;
}
