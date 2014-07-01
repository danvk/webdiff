var diffview = (function() {

var differ = function(beforeText, afterText, userParams) {
  if (!'beforeText' in userParams) throw "need beforeText";
  if (!'afterText' in userParams) throw "need afterText";

  var defaultParams = {
    contextSize: 3,
    syntaxHighlighting: false,
    beforeName: "Before",
    afterName: "After"
  };

  this.params = $.extend({}, defaultParams, userParams);

  this.beforeLines = difflib.stringAsLines(beforeText);
  this.afterLines = difflib.stringAsLines(afterText);
  var sm = new difflib.SequenceMatcher(this.beforeLines, this.afterLines);
  this.opcodes = sm.get_opcodes();

  if (this.params.syntaxHighlighting) {
    var lang = this.params.language;
    this.beforeLinesHighlighted = differ.highlightText_(beforeText, lang);
    this.afterLinesHighlighted = differ.highlightText_(afterText, lang);
  }
};

/**
 * @param {string} text Possibly multiline text containing spans that cross
 *     line breaks.
 * @return {Array.<string>} An array of individual lines, each of which has
 *     entirely balanced <span> tags.
 */
differ.distributeSpans_ = function(text) {
  var lines = difflib.stringAsLines(text);
  var spanRe = /(<span[^>]*>)|(<\/span>)/;

  var outLines = [];
  var liveSpans = [];
  lines.forEach(function(line) {
    var groups = line.split(spanRe);
    var i = 0;
    var outLine = liveSpans.join('');
    while (i < groups.length) {
      var g = groups[i];
      if (g === undefined) {
        // close span
        outLine += groups[i + 1];
        liveSpans.pop();
        i += 2;
      } else if (g.substr(0, 5) == '<span') {
        // open span
        i += 2;
        outLine += g;
        liveSpans.push(g);
      } else {
        // plain text
        outLine += g;
        i++;
      }
    }
    liveSpans.forEach(function() { outLine += '</span>'; });
    outLines.push(outLine);
  });
  if (liveSpans.length) throw "Unbalanced <span>s in " + text;
  return outLines;
};

/**
 * @param {string} text The lines to highlight.
 * @param {?string} opt_language Language to pass to highlight.js. If not
 *     specified, then the language will be auto-detected.
 * @return {Array.<string>} Lines marked up with syntax <span>s. The <span>
 *     tags will be balanced within each line.
 */
differ.highlightText_ = function(text, opt_language) {
  // TODO(danvk): look into suppressing highlighting if .relevance is low.
  var html;
  if (opt_language) {
    html = hljs.highlight(opt_language, text, true).value;
  } else {
    html = hljs.highlightAuto(text).value;
  }

  // Some of the <span>s might cross lines, which won't work for our diff
  // structure. We convert them to single-line only <spans> here.
  return differ.distributeSpans_(html);
}

differ.prototype.buildView_ = function() {
  var $leftLineDiv = $('<div class="diff-line-no diff-left-line-no">');
  var $leftContent = $('<div class="diff-content diff-left-content">');
  var $rightLineDiv = $('<div class="diff-line-no diff-right-line-no">');
  var $rightContent = $('<div class="diff-content diff-right-content">');

  var beforeLines = this.params.syntaxHighlighting ? this.beforeLinesHighlighted : this.beforeLines;
  var afterLines = this.params.syntaxHighlighting ? this.afterLinesHighlighted : this.afterLines;

  var contextSize = this.params.contextSize;
  var rows = [];

  for (var opcodeIdx = 0; opcodeIdx < this.opcodes.length; opcodeIdx++) {
    var opcode = this.opcodes[opcodeIdx];
    var change = opcode[0];  // "equal", "replace", "delete", "insert"
    var beforeIdx = opcode[1];
    var beforeEnd = opcode[2];
    var afterIdx = opcode[3];
    var afterEnd = opcode[4];
    var rowCount = Math.max(beforeEnd - beforeIdx, afterEnd - afterIdx);
    var topRows = [];
    var botRows = [];

    for (var i = 0; i < rowCount; i++) {
      // Jump
      if (contextSize && this.opcodes.length > 1 && change == 'equal' &&
          ((opcodeIdx > 0 && i == contextSize) ||
           (opcodeIdx == 0 && i == 0))) {
        var jump = rowCount - ((opcodeIdx == 0 ? 1 : 2) * contextSize);
        var isEnd = (opcodeIdx + 1 == this.opcodes.length);
        if (isEnd) {
          jump += (contextSize - 1);
        }
        if (jump > 1) {
          var els = [];
          topRows.push(els);

          var $skipEl = $('<div class=skip><a href="#">Show ' + jump + ' lines</a></div>');
          $skipEl.data({
            'beforeStartIndex': beforeIdx,
            'afterStartIndex': afterIdx,
            'jumpLength': jump
          });
          
          beforeIdx += jump;
          afterIdx += jump;
          i += jump - 1;
          els.push($('<div>...</div>').get(0));
          els.push($('<div class=skip>...</div>').get(0));
          els.push($('<div>...</div>').get(0));
          els.push($skipEl.get(0));
          
          // skip last lines if they're all equal
          if (isEnd) {
            break;
          } else {
            continue;
          }
        }
      }

      var els = [];
      topRows.push(els);
      beforeIdx = addCells(els, beforeIdx, beforeEnd, this.params.syntaxHighlighting, beforeLines, 'before line-' + (beforeIdx + 1) + ' ' + change);
      afterIdx = addCells(els, afterIdx, afterEnd, this.params.syntaxHighlighting, afterLines, 'after line-' + (afterIdx + 1) + ' ' + change);

      if (change == 'replace') {
        differ.addCharacterDiffs_(els[1], els[3], this.params.syntaxHighlighting);
      }
    }

    for (var i = 0; i < topRows.length; i++) rows.push(topRows[i]);
    for (var i = 0; i < botRows.length; i++) rows.push(botRows[i]);
  }

  var $container = $('<div class="diff">');

  $container.append(
      $('<div class="diff-header diff-column-width">').text(this.params.beforeName),
      $('<div class="diff-header diff-column-width">').text(this.params.afterName),
      $('<br>'));

  $container.append(
      $('<div class="diff-wrapper diff-column-width">').append($leftLineDiv, $leftContent),
      $('<div class="diff-wrapper diff-column-width">').append($rightLineDiv, $rightContent));

  // TODO(danvk): append each element of rows to the appropriate div here.
  rows.forEach(function(row) {
    if (row.length != 4) throw "Invalid row: " + row;

    $leftLineDiv.append(row[0]);
    $leftContent.append(row[1]);
    $rightLineDiv.append(row[2]);
    $rightContent.append(row[3]);
  });

  var $wrapperDivs = $container.find('.diff-wrapper');
  $wrapperDivs.on('scroll', function(e) {
    var otherDiv = $wrapperDivs.not(this).get(0);
    otherDiv.scrollLeft = this.scrollLeft;
  });

  return $container.get(0);
};

function addCells(row, tidx, tend, isHtml, textLines, change) {
  if (tidx < tend) {
    var txt = textLines[tidx].replace(/\t/g, "\u00a0\u00a0\u00a0\u00a0");
    row.push($('<div class=line-no>').text(tidx + 1).get(0));
    var $code = $('<div>').addClass(change + ' code');
    if (isHtml) {
      $code.html(txt);
    } else {
      $code.text(txt);
    }
    row.push($code.get(0));
    return tidx + 1;
  } else {
    row.push($('<div class=line-no>').get(0));
    row.push($('<div class="empty code">').get(0));
    return tidx;
  }
}

differ.htmlTextMapper = function(text, html) {
  this.text_ = text;
  this.html_ = html;
};

// Get the substring of HTML corresponding to text.substr(start, len).
// Leading markup is included with index 0, trailing with the last char.
differ.htmlTextMapper.prototype.getHtmlSubstring = function(start, limit) {
  var textIndex = 0, htmlIndex = 0;
  var html = this.html_;
  var advanceOne = function() {
    // This won't work for <span data="<foo">, but hljs never does that.
    if (html.charAt(htmlIndex) == '<') {
      while (html.charAt(htmlIndex) != '>') {
        htmlIndex += 1;
      }
      htmlIndex += 1;
    }
    htmlIndex += 1;
    textIndex += 1;
  };

  while (textIndex < start) {
    advanceOne();
  }
  var htmlStartIndex = htmlIndex;

  // special case: trailing tags go with the last character.
  var htmlEndIndex;
  if (limit < this.text_.length || (limit <= start)) {
    while (textIndex < limit) {
      advanceOne();
    }
    htmlEndIndex = htmlIndex;
  } else {
    htmlEndIndex = html.length;
  }

  return html.substring(htmlStartIndex, htmlEndIndex);
};

differ.addCharacterDiffs_ = function(beforeCell, afterCell) {
  var beforeText = $(beforeCell).text(),
      afterText = $(afterCell).text(),
      beforeHtml = $(beforeCell).html(),
      afterHtml = $(afterCell).html();
  var sm = new difflib.SequenceMatcher(beforeText.split(''), afterText.split(''));
  var opcodes = sm.get_opcodes();
  var minEqualFrac = 0.5;  // suppress character-by-character diffs if there's less than this much overlap.
  var equalCount = 0, charCount = 0;
  opcodes.forEach(function(opcode) {
    var change = opcode[0];
    var beforeLen = opcode[2] - opcode[1];
    var afterLen = opcode[4] - opcode[3];
    var count = beforeLen + afterLen;
    if (change == 'equal') equalCount += count;
    charCount += count;
  });
  if (equalCount < minEqualFrac * charCount) return;

  var m = differ.htmlTextMapper.prototype.getHtmlSubstring;
  var beforeMapper = new differ.htmlTextMapper(beforeText, beforeHtml);
  var afterMapper = new differ.htmlTextMapper(afterText, afterHtml);

  var beforeOut = '', afterOut = '';
  opcodes.forEach(function(opcode) {
    var change = opcode[0];
    var beforeIdx = opcode[1];
    var beforeEnd = opcode[2];
    var afterIdx = opcode[3];
    var afterEnd = opcode[4];
    var beforeSubstr = beforeMapper.getHtmlSubstring(beforeIdx, beforeEnd);
    var afterSubstr = afterMapper.getHtmlSubstring(afterIdx, afterEnd);
    if (change == 'equal') {
      beforeOut += beforeSubstr;
      afterOut += afterSubstr;
    } else if (change == 'delete') {
      beforeOut += '<span class=char-delete>' + beforeSubstr + '</span>';
    } else if (change == 'insert') {
      afterOut += '<span class=char-insert>' + afterSubstr + '</span>';
    } else if (change == 'replace') {
      beforeOut += '<span class=char-delete>' + beforeSubstr + '</span>';
      afterOut += '<span class=char-insert>' + afterSubstr + '</span>';
    } else {
      throw "Invalid opcode: " + opcode[0];
    }
  });
  $(beforeCell).empty().html(beforeOut);
  $(afterCell).empty().html(afterOut);
};

differ.buildView = function(beforeText, afterText, userParams) {
  var d = new differ(beforeText, afterText, userParams);
  return d.buildView_();
};

return differ;

})();
