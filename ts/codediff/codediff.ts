import {DiffRange, addSkips} from './codes';
import {distributeSpans} from './dom-utils';
import {buildRowTr, buildSkipTr} from './table-utils';
import * as difflib from './difflib';

export interface PatchOptions {
  minJumpSize: number;
  expandLines: number;
  language: string | null;
  beforeName: string;
  afterName: string;
  wordWrap: boolean;
}

export interface DiffOptions {
  /** Number of equal lines of context to show around changed lines */
  contextSize: number;
  /** Minimum number of skipped lines to elide into a "jump" row */
  minJumpSize: number;
  /** Number of additional lines to show when you click an expand arrow. */
  expandLines: number;
}

const DEFAULT_OPTIONS: DiffOptions = {
  contextSize: 3,
  minJumpSize: 10,
  expandLines: 10,
};

const DEFAULT_PARAMS: PatchOptions = {
  minJumpSize: 10,
  language: null,
  beforeName: 'Before',
  afterName: 'After',
  wordWrap: false,
  expandLines: 10,
};

export class differ {
  params: PatchOptions;
  beforeLines: string[];
  afterLines: string[];
  diffRanges: DiffRange[];
  beforeLinesHighlighted: string[] | null | undefined;
  afterLinesHighlighted: string[] | null | undefined;

  constructor(
    beforeText: string | null,
    beforeLines: string[],
    afterText: string | null,
    afterLines: string[],
    ops: DiffRange[],
    params: Partial<PatchOptions>,
  ) {
    this.params = {...DEFAULT_PARAMS, ...params};

    this.beforeLines = beforeLines;
    this.afterLines = afterLines;
    this.diffRanges = ops;

    const {language} = this.params;
    if (language) {
      this.beforeLinesHighlighted = highlightText(beforeText ?? '', language);
      this.afterLinesHighlighted = highlightText(afterText ?? '', language);
    }
    // TODO: from this point on language shouldn't need to be used.
  }

  maxLineNumber() {
    return Math.max(this.beforeLines.length, this.afterLines.length);
  }

  /**
   * Attach event listeners, notably for the "show more" links.
   */
  attachHandlers_(el: JQuery) {
    // TODO: gross duplication with buildView_
    const language = this.params.language;
    const beforeLines = language ? this.beforeLinesHighlighted! : this.beforeLines;
    const afterLines = language ? this.afterLinesHighlighted! : this.afterLines;
    const expandLines = this.params.expandLines;
    $(el).on('click', '.skip a, span.skip', function (e) {
      e.preventDefault();
      const $skip = $(this).closest('.skip');
      const skipData = $skip.data();
      let type = $skip.hasClass('expand-down')
        ? 'down'
        : $skip.hasClass('expand-up')
        ? 'up'
        : 'all';
      const beforeIdx = skipData.beforeStartIndex;
      const afterIdx = skipData.afterStartIndex;
      const jump = skipData.jumpLength;
      if (jump < expandLines) {
        type = 'all';
      }
      const newTrs = [];
      const a = type === 'up' || type === 'all' ? 0 : jump - expandLines;
      const b = type === 'up' ? expandLines : jump;

      if (type === 'down') {
        newTrs.push(
          buildSkipTr(beforeIdx, afterIdx, jump - expandLines, skipData.header, expandLines),
        );
      }

      for (let i = a; i < b; i++) {
        newTrs.push(
          buildRowTr(
            'equal',
            beforeIdx + i + 1,
            beforeLines[beforeIdx + i],
            afterIdx + i + 1,
            afterLines[afterIdx + i],
            language,
          ),
        );
      }

      if (type === 'up') {
        newTrs.push(
          buildSkipTr(
            beforeIdx + expandLines,
            afterIdx + expandLines,
            jump - expandLines,
            skipData.header,
            expandLines,
          ),
        );
      }
      // Replace the old "skip" row with the new code and (maybe) new skip row.
      var $skipTr = $(this).closest('tr');
      $skipTr.replaceWith(newTrs as HTMLElement[]);
    });

    // Hooks for single-column text selection.
    // See http://stackoverflow.com/a/27530627/388951 for details.
    $(el)
      .on('mousedown', function (e) {
        var $td = $(e.target).closest('td'),
          isLeft = $td.is('.before'),
          isRight = $td.is('.after');
        if (!isLeft && !isRight) return;

        el.removeClass('selecting-left selecting-right').addClass(
          'selecting-' + (isLeft ? 'left' : 'right'),
        );
      })
      .on('copy', function (e) {
        var isLeft = el.is('.selecting-left');

        var sel = window.getSelection()!,
          range = sel.getRangeAt(0),
          doc = range.cloneContents(),
          nodes = doc.querySelectorAll('td.' + (isLeft ? 'before' : 'after')),
          text = '';

        if (nodes.length === 0) {
          text = doc.textContent!;
        } else {
          [].forEach.call(nodes, function (td: Element, i) {
            text += (i ? '\n' : '') + td.textContent;
          });
        }

        var clipboardData = (e.originalEvent as ClipboardEvent).clipboardData;
        clipboardData?.setData('text', text);
        e.preventDefault();
      });
  }

  buildView_() {
    // TODO: is this distinction necessary?
    const language = this.params.language;
    const beforeLines = language ? this.beforeLinesHighlighted! : this.beforeLines;
    const afterLines = language ? this.afterLinesHighlighted! : this.afterLines;
    const expandLines = this.params.expandLines;

    const $table = $('<table class="diff">');
    $table.append(
      $('<tr>').append(
        $('<th class="diff-header" colspan=2>').text(this.params.beforeName),
        $('<th class="diff-header" colspan=2>').text(this.params.afterName),
      ),
    );

    for (const range of this.diffRanges) {
      const type = range.type;
      const numBeforeRows = range.before[1] - range.before[0];
      const numAfterRows = range.after[1] - range.after[0];
      const numRows = Math.max(numBeforeRows, numAfterRows);

      if (type == 'skip') {
        $table.append(
          buildSkipTr(range.before[0], range.after[0], numRows, range.header ?? null, expandLines),
        );
      } else {
        for (let j = 0; j < numRows; j++) {
          const beforeIdx = j < numBeforeRows ? range.before[0] + j : null;
          const afterIdx = j < numAfterRows ? range.after[0] + j : null;
          $table.append(
            buildRowTr(
              type,
              beforeIdx != null ? 1 + beforeIdx : null,
              beforeIdx != null ? beforeLines[beforeIdx] : undefined,
              afterIdx != null ? 1 + afterIdx : null,
              afterIdx != null ? afterLines[afterIdx] : undefined,
              language,
            ),
          );
        }
      }
    }

    if (this.params.wordWrap) {
      $table.addClass('word-wrap');
    }

    const $container = $('<div class="diff">');
    $container.append($table);
    // Attach event handlers & apply char diffs.
    this.attachHandlers_($container);
    return $container.get(0)!;
  }
}

/**
 * @return Lines marked up with syntax <span>s. The <span>
 *     tags will be balanced within each line.
 */
function highlightText(text: string, language: string): string[] | null {
  if (text === null) return [];

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

export function buildView(
  beforeText: string | null,
  afterText: string | null,
  userParams: Partial<DiffOptions & PatchOptions>,
) {
  const params: DiffOptions & PatchOptions = {...DEFAULT_OPTIONS, ...DEFAULT_PARAMS, ...userParams};
  const beforeLines = beforeText ? difflib.stringAsLines(beforeText) : [];
  const afterLines = afterText ? difflib.stringAsLines(afterText) : [];
  const sm = new difflib.SequenceMatcher(beforeLines, afterLines);
  const opcodes = sm.get_opcodes();
  const diffRanges = addSkips(opcodes, params.contextSize, params.minJumpSize);
  var d = new differ(beforeText, beforeLines, afterText, afterLines, diffRanges, params);
  return d.buildView_();
}

export function buildViewFromOps(
  beforeText: string,
  afterText: string,
  ops: DiffRange[],
  params: Partial<PatchOptions>,
) {
  const beforeLines = beforeText ? difflib.stringAsLines(beforeText) : [];
  const afterLines = afterText ? difflib.stringAsLines(afterText) : [];
  const fullParams = {...DEFAULT_PARAMS, ...params};
  const diffRanges = enforceMinJumpSize(ops, fullParams.minJumpSize);
  var d = new differ(beforeText, beforeLines, afterText, afterLines, diffRanges, params);
  return d.buildView_();
}
