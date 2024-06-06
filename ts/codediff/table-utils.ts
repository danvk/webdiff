import {addCharacterDiffs} from './char-diffs';

/**
 * Create a single row in the table. Adds character diffs if required.
 */
export function buildRowTr(
  type: 'replace' | 'delete' | 'insert' | 'equal',
  beforeLineNum: number | null,
  beforeTextOrHtml: string | null | undefined,
  afterLineNum: number | null,
  afterTextOrHtml: string | null | undefined,
  language: string | null,
): HTMLElement {
  var $makeCodeTd = function (textOrHtml: string | null | undefined) {
    if (textOrHtml == null) {
      return $('<td class="empty code">');
    }
    textOrHtml = textOrHtml.replace(/\t/g, '\u00a0\u00a0\u00a0\u00a0');
    var $td = $('<td class="code">').addClass(type);
    if (language) {
      $td.html(textOrHtml);
    } else {
      $td.text(textOrHtml);
    }
    return $td;
  };

  var cells = [
    $('<td class=line-no>')
      .text(beforeLineNum || '')
      .get(0)!,
    $makeCodeTd(beforeTextOrHtml).addClass('before').get(0)!,
    $makeCodeTd(afterTextOrHtml).addClass('after').get(0)!,
    $('<td class=line-no>')
      .text(afterLineNum || '')
      .get(0)!,
  ];
  if (type == 'replace') {
    addCharacterDiffs(cells[1], cells[2]);
  }

  return $('<tr>').append(cells).get(0)!;
}

/**
 * Create a "skip" row with a link to expand.
 * beforeIdx and afterIdx are the indices of the first lines skipped.
 */
export function buildSkipTr(
  beforeIdx: number,
  afterIdx: number,
  numRowsSkipped: number,
  header: string | null,
  expandLines: number,
): HTMLElement {
  const arrows = numRowsSkipped <= expandLines ?
    `<span class="skip" title="show ${numRowsSkipped} skipped lines">↕</span>` : `<span class="skip expand-up" title="show ${expandLines} more lines above">↥</span><span class="skip expand-down"title="show ${expandLines} more lines below">↧</span>`;
  const showMore = `<a href="#">Show ${numRowsSkipped} more lines</a>`;
  const headerHTML = header ? `<span class="hunk-header">${header}</span>` : '';
  const $tr = $(
    `<tr class="skip-row">
      <td colspan="4" class="skip code"><span class="arrows-left">${arrows}</span>${showMore} ${headerHTML}<span class="arrows-right">${arrows}</span></td>
    </tr>`
  );
  $tr.find('.skip').data({
    beforeStartIndex: beforeIdx,
    afterStartIndex: afterIdx,
    jumpLength: numRowsSkipped,
    header,
  });
  return $tr.get(0)!;
}
