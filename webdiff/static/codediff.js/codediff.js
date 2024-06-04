(() => {

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
var $a4b41c61879d57cc$exports = {};

$parcel$export($a4b41c61879d57cc$exports, "differ", () => $a4b41c61879d57cc$export$d7ae8a2952d3eaf0);
class $b8027a79b3117d71$export$edaad34459cb0d2b {
    constructor(text, html){
        this.text_ = text;
        this.html_ = html;
    }
    // Get the substring of HTML corresponding to text.substr(start, len).
    // Leading markup is included with index 0, trailing with the last char.
    getHtmlSubstring(start, limit) {
        var count = limit - start;
        return $b8027a79b3117d71$var$html_substr(this.html_, start, count);
    }
}
// Returns the HTML corresponding to text in positions [start, start+count).
// This includes any HTML in that character range, or enclosing it.
// cobbled together from:
// http://stackoverflow.com/questions/6003271/substring-text-with-html-tags-in-javascript?rq=1
// http://stackoverflow.com/questions/16856928/substring-text-with-javascript-including-html-tags
function $b8027a79b3117d71$var$html_substr(html, start, count) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var consumed = 0;
    walk(div, track);
    function track(el) {
        if (count > 0) {
            var len = el.data.length;
            if (start <= len) {
                el.data = el.substringData(start, len);
                start = 0;
            } else {
                start -= len;
                el.data = "";
            }
            len = el.data.length;
            count -= len;
            consumed += len;
            if (count <= 0) el.data = el.substringData(0, el.data.length + count);
        } else el.data = "";
    }
    function walk(el, fn) {
        var node = el.firstChild, oldNode;
        var elsToRemove = [];
        do {
            if (node?.nodeType === 3) fn(node);
            else if (node?.nodeType === 1 && node.childNodes && node.childNodes[0]) walk(node, fn);
            if (consumed == 0 && node?.nodeType == 1) elsToRemove.push(node);
        }while ((node = node?.nextSibling ?? null) && count > 0);
        // remove remaining nodes
        while(node){
            oldNode = node;
            node = node.nextSibling;
            el.removeChild(oldNode);
        }
        for(var i = 0; i < elsToRemove.length; i++){
            const el = elsToRemove[i];
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }
    }
    return div.innerHTML;
}


function $1190ad35680a3ea6$export$bbc379085bcd4964(beforeText, afterText) {
    var beforeWords = $1190ad35680a3ea6$export$f5f0783f1100ed33(beforeText), afterWords = $1190ad35680a3ea6$export$f5f0783f1100ed33(afterText);
    // TODO: precompute two arrays; this does too much work.
    var wordToIdx = function(isBefore, idx) {
        var words = isBefore ? beforeWords : afterWords;
        var charIdx = 0;
        for(var i = 0; i < idx; i++)charIdx += words[i].length;
        return charIdx;
    };
    var sm = new difflib.SequenceMatcher(beforeWords, afterWords);
    var opcodes = sm.get_opcodes();
    // Suppress char-by-char diffs if there's less than 50% character overlap.
    // The one exception is pure whitespace diffs, which should always be shown.
    var minEqualFrac = 0.5;
    var equalCount = 0, charCount = 0;
    var beforeDiff = "", afterDiff = "";
    opcodes.forEach(function(opcode) {
        var change = opcode[0];
        var beforeIdx = wordToIdx(true, opcode[1]);
        var beforeEnd = wordToIdx(true, opcode[2]);
        var afterIdx = wordToIdx(false, opcode[3]);
        var afterEnd = wordToIdx(false, opcode[4]);
        var beforeLen = beforeEnd - beforeIdx;
        var afterLen = afterEnd - afterIdx;
        var count = beforeLen + afterLen;
        if (change == "equal") equalCount += count;
        else {
            beforeDiff += beforeText.substring(beforeIdx, beforeEnd);
            afterDiff += afterText.substring(afterIdx, afterEnd);
        }
        charCount += count;
    });
    if (equalCount < minEqualFrac * charCount && !(beforeDiff.match(/^\s*$/) && afterDiff.match(/^\s*$/))) return null;
    var beforeOut = [], afterOut = []; // (span class, start, end) triples
    opcodes.forEach(function(opcode) {
        var change = opcode[0];
        var beforeIdx = wordToIdx(true, opcode[1]);
        var beforeEnd = wordToIdx(true, opcode[2]);
        var afterIdx = wordToIdx(false, opcode[3]);
        var afterEnd = wordToIdx(false, opcode[4]);
        if (change == "equal") {
            beforeOut.push([
                null,
                beforeIdx,
                beforeEnd
            ]);
            afterOut.push([
                null,
                afterIdx,
                afterEnd
            ]);
        } else if (change == "delete") beforeOut.push([
            "delete",
            beforeIdx,
            beforeEnd
        ]);
        else if (change == "insert") afterOut.push([
            "insert",
            afterIdx,
            afterEnd
        ]);
        else if (change == "replace") {
            beforeOut.push([
                "delete",
                beforeIdx,
                beforeEnd
            ]);
            afterOut.push([
                "insert",
                afterIdx,
                afterEnd
            ]);
        } else throw "Invalid opcode: " + opcode[0];
    });
    beforeOut = $1190ad35680a3ea6$export$4a6fd8fca76e617(beforeOut);
    afterOut = $1190ad35680a3ea6$export$4a6fd8fca76e617(afterOut);
    return [
        beforeOut,
        afterOut
    ];
}
function $1190ad35680a3ea6$export$66fc1d006dbd50e9(beforeCell, afterCell) {
    var beforeText = $(beforeCell).text(), afterText = $(afterCell).text();
    var codes = $1190ad35680a3ea6$export$bbc379085bcd4964(beforeText, afterText);
    if (codes == null) return;
    const beforeOut = codes[0];
    const afterOut = codes[1];
    // Splice in "insert", "delete" and "replace" tags.
    // This is made more difficult by the presence of syntax highlighting, which
    // has its own set of tags. The two can co-exists if we're careful to only
    // wrap complete (balanced) DOM trees.
    var beforeHtml = $(beforeCell).html(), afterHtml = $(afterCell).html();
    var beforeMapper = new (0, $b8027a79b3117d71$export$edaad34459cb0d2b)(beforeText, beforeHtml);
    var afterMapper = new (0, $b8027a79b3117d71$export$edaad34459cb0d2b)(afterText, afterHtml);
    $(beforeCell).empty().html($1190ad35680a3ea6$export$bb64c3e92bb86580(beforeMapper, beforeOut));
    $(afterCell).empty().html($1190ad35680a3ea6$export$bb64c3e92bb86580(afterMapper, afterOut));
}
function $1190ad35680a3ea6$export$f5f0783f1100ed33(line) {
    var LC = 0, UC = 2, NUM = 3, WS = 4, SYM = 5;
    var charType = function(c) {
        if (c.match(/[a-z]/)) return LC;
        if (c.match(/[A-Z]/)) return UC;
        if (c.match(/[0-9]/)) return NUM;
        if (c.match(/\s/)) return WS;
        return SYM;
    };
    // Single words can be [A-Z][a-z]+, [A-Z]+, [a-z]+, [0-9]+ or \s+.
    var words = [];
    var lastType = -1;
    for(var i = 0; i < line.length; i++){
        var c = line.charAt(i);
        var ct = charType(c);
        if (ct == lastType && ct != SYM && ct != WS || ct == LC && lastType == UC && words[words.length - 1].length == 1) words[words.length - 1] += c;
        else words.push(c);
        lastType = ct;
    }
    return words;
}
function $1190ad35680a3ea6$export$4a6fd8fca76e617(codes) {
    var newCodes = [];
    for(var i = 0; i < codes.length; i++){
        var code = codes[i];
        if (i == 0) {
            newCodes.push(code);
            continue;
        }
        var lastIndex = newCodes.length - 1;
        var lastCodeClass = newCodes[lastIndex][0];
        if (lastCodeClass == code[0]) newCodes[lastIndex][2] = code[2]; // extend last run.
        else newCodes.push(code);
    }
    return newCodes;
}
function $1190ad35680a3ea6$export$bb64c3e92bb86580(mapper, codes) {
    var html = "";
    for(var i = 0; i < codes.length; i++){
        var code = codes[i], type = code[0], start = code[1], limit = code[2];
        var thisHtml = mapper.getHtmlSubstring(start, limit);
        if (type == null) html += thisHtml;
        else html += '<span class="char-' + type + '">' + thisHtml + "</span>";
    }
    return html;
}


function $7b3893c47869bfd4$export$bc16352bf8ce7a63(opcodes, contextSize, minJumpSize) {
    var ranges = [];
    for(let i = 0; i < opcodes.length; i++){
        const opcode = opcodes[i];
        const [change, beforeIdx, beforeEnd, afterIdx, afterEnd] = opcode;
        var range = {
            type: change,
            before: [
                beforeIdx,
                beforeEnd
            ],
            after: [
                afterIdx,
                afterEnd
            ]
        };
        if (change !== "equal") {
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
        if (firstSkipOffset > 0) ranges.push({
            type: "equal",
            before: [
                beforeIdx,
                beforeIdx + firstSkipOffset
            ],
            after: [
                afterIdx,
                afterIdx + firstSkipOffset
            ]
        });
        ranges.push({
            type: "skip",
            before: [
                beforeIdx + firstSkipOffset,
                beforeIdx + lastSkipOffset
            ],
            after: [
                afterIdx + firstSkipOffset,
                afterIdx + lastSkipOffset
            ]
        });
        if (lastSkipOffset < rowCount) ranges.push({
            type: "equal",
            before: [
                beforeIdx + lastSkipOffset,
                beforeEnd
            ],
            after: [
                afterIdx + lastSkipOffset,
                afterEnd
            ]
        });
    }
    return ranges;
}


/**
 * @param text Possibly multiline text containing spans that cross
 *     line breaks.
 * @return An array of individual lines, each of which has
 *     entirely balanced <span> tags.
 */ function $b86f11f5e9077ed0$export$1f6ff06b43176f68(text) {
    const lines = difflib.stringAsLines(text);
    const spanRe = /(<span[^>]*>)|(<\/span>)/;
    const outLines = [];
    const liveSpans = [];
    for (const line of lines){
        const groups = line.split(spanRe);
        let i = 0;
        let outLine = liveSpans.join("");
        while(i < groups.length){
            const g = groups[i];
            if (g === undefined) {
                // close span
                outLine += groups[i + 1];
                liveSpans.pop();
                i += 2;
            } else if (g.substr(0, 5) == "<span") {
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
        liveSpans.forEach(function() {
            outLine += "</span>";
        });
        outLines.push(outLine);
    }
    if (liveSpans.length) throw "Unbalanced <span>s in " + text;
    return outLines;
}



/**
 * Returns a valid HighlightJS language based on a file name/path.
 * If it can't guess a language, returns null.
 */ function $6d1363c84edc199c$export$189ed0fd75cb2ccc(name) {
    var lang = function() {
        var m = /\.([^.]+)$/.exec(name);
        if (m) {
            var ext = m[1];
            if (ext == "py") return "python";
            if (ext == "sh") return "bash";
            if (ext == "md") return "markdown";
            if (ext == "js") return "javascript";
            return m[1].toLowerCase();
        }
        // Highlighting based purely on file name, e.g. "Makefile".
        m = /(?:.*\/)?([^\/]*)$/.exec(name);
        if (m && m[1] == "Makefile") return "makefile";
        return null;
    }();
    if (!lang || !hljs.getLanguage(lang)) return null;
    else return lang;
}
function $6d1363c84edc199c$export$2440592065e06347(contents) {
    // First check for a shebang line.
    var firstLine = contents.substring(0, contents.indexOf("\n"));
    if (firstLine.substring(0, 2) == "#!") {
        var processor = firstLine.substring(2);
        if (processor == "/bin/bash") return "bash";
        if (processor == "/bin/sh") return "bash";
        const options = {
            python: "python",
            perl: "perl",
            ruby: "ruby",
            node: "javascript"
        };
        let interpreter;
        for(interpreter in options){
            var lang = options[interpreter];
            if (processor.indexOf(interpreter) >= 0) return lang;
        }
    }
    // Now let HighlightJS guess.
    var guess = hljs.highlightAuto(contents);
    var lang = guess.language;
    return lang;
}



function $d0fe6ceded5cfd85$export$9ab1e790f5c0e723(type, beforeLineNum, beforeTextOrHtml, afterLineNum, afterTextOrHtml, language) {
    var $makeCodeTd = function(textOrHtml) {
        if (textOrHtml == null) return $('<td class="empty code">');
        textOrHtml = textOrHtml.replace(/\t/g, "\xa0\xa0\xa0\xa0");
        var $td = $('<td class="code">').addClass(type);
        if (language) $td.html(textOrHtml);
        else $td.text(textOrHtml);
        return $td;
    };
    var cells = [
        $("<td class=line-no>").text(beforeLineNum || "").get(0),
        $makeCodeTd(beforeTextOrHtml).addClass("before").get(0),
        $makeCodeTd(afterTextOrHtml).addClass("after").get(0),
        $("<td class=line-no>").text(afterLineNum || "").get(0)
    ];
    if (type == "replace") (0, $1190ad35680a3ea6$export$66fc1d006dbd50e9)(cells[1], cells[2]);
    return $("<tr>").append(cells).get(0);
}
function $d0fe6ceded5cfd85$export$8d7d7a7d0377361b(beforeIdx, afterIdx, numRowsSkipped, header, expandLines) {
    const arrows = numRowsSkipped <= expandLines ? `<span class="skip" title="show ${numRowsSkipped} skipped lines">\u{2195}</span>` : `<span class="skip expand-up" title="show ${expandLines} more lines above">\u{21A5}</span><span class="skip expand-down"title="show ${expandLines} more lines below">\u{21A7}</span>`;
    const showMore = `<a href="#">Show ${numRowsSkipped} more lines</a>`;
    const headerHTML = header ? `<span class="hunk-header">${header}</span>` : "";
    const $tr = $(`<tr class="skip-row">
      <td colspan="4" class="skip code"><span class="arrows-left">${arrows}</span>${showMore} ${headerHTML}<span class="arrows-right">${arrows}</span></td>
    </tr>`);
    $tr.find(".skip").data({
        beforeStartIndex: beforeIdx,
        afterStartIndex: afterIdx,
        jumpLength: numRowsSkipped,
        header: header
    });
    return $tr.get(0);
}


const $a4b41c61879d57cc$var$DEFAULT_OPTIONS = {
    contextSize: 3,
    minJumpSize: 10,
    expandLines: 10
};
const $a4b41c61879d57cc$var$DEFAULT_PARAMS = {
    minJumpSize: 10,
    language: null,
    beforeName: "Before",
    afterName: "After",
    wordWrap: false,
    expandLines: 10
};
class $a4b41c61879d57cc$export$d7ae8a2952d3eaf0 {
    constructor(beforeText, beforeLines, afterText, afterLines, ops, params){
        this.params = {
            ...$a4b41c61879d57cc$var$DEFAULT_PARAMS,
            ...params
        };
        this.beforeLines = beforeLines;
        this.afterLines = afterLines;
        this.diffRanges = ops;
        const { language: language } = this.params;
        if (language) {
            this.beforeLinesHighlighted = $a4b41c61879d57cc$var$highlightText(beforeText ?? "", language);
            this.afterLinesHighlighted = $a4b41c61879d57cc$var$highlightText(afterText ?? "", language);
        }
    // TODO: from this point on language shouldn't need to be used.
    }
    maxLineNumber() {
        return Math.max(this.beforeLines.length, this.afterLines.length);
    }
    /**
   * Attach event listeners, notably for the "show more" links.
   */ attachHandlers_(el) {
        // TODO: gross duplication with buildView_
        const language = this.params.language;
        const beforeLines = language ? this.beforeLinesHighlighted : this.beforeLines;
        const afterLines = language ? this.afterLinesHighlighted : this.afterLines;
        const expandLines = this.params.expandLines;
        $(el).on("click", ".skip a, span.skip", function(e) {
            e.preventDefault();
            const $skip = $(this).closest(".skip");
            const skipData = $skip.data();
            let type = $skip.hasClass("expand-down") ? "down" : $skip.hasClass("expand-up") ? "up" : "all";
            const beforeIdx = skipData.beforeStartIndex;
            const afterIdx = skipData.afterStartIndex;
            const jump = skipData.jumpLength;
            if (jump < expandLines) type = "all";
            const newTrs = [];
            const a = type === "up" || type === "all" ? 0 : jump - expandLines;
            const b = type === "up" ? expandLines : jump;
            if (type === "down") newTrs.push((0, $d0fe6ceded5cfd85$export$8d7d7a7d0377361b)(beforeIdx, afterIdx, jump - expandLines, skipData.header, expandLines));
            for(let i = a; i < b; i++)newTrs.push((0, $d0fe6ceded5cfd85$export$9ab1e790f5c0e723)("equal", beforeIdx + i + 1, beforeLines[beforeIdx + i], afterIdx + i + 1, afterLines[afterIdx + i], language));
            if (type === "up") newTrs.push((0, $d0fe6ceded5cfd85$export$8d7d7a7d0377361b)(beforeIdx + expandLines, afterIdx + expandLines, jump - expandLines, skipData.header, expandLines));
            // Replace the old "skip" row with the new code and (maybe) new skip row.
            var $skipTr = $(this).closest("tr");
            $skipTr.replaceWith(newTrs);
        });
        // Hooks for single-column text selection.
        // See http://stackoverflow.com/a/27530627/388951 for details.
        $(el).on("mousedown", function(e) {
            var $td = $(e.target).closest("td"), isLeft = $td.is(".before"), isRight = $td.is(".after");
            if (!isLeft && !isRight) return;
            el.removeClass("selecting-left selecting-right").addClass("selecting-" + (isLeft ? "left" : "right"));
        }).on("copy", function(e) {
            var isLeft = el.is(".selecting-left");
            var sel = window.getSelection(), range = sel.getRangeAt(0), doc = range.cloneContents(), nodes = doc.querySelectorAll("td." + (isLeft ? "before" : "after")), text = "";
            if (nodes.length === 0) text = doc.textContent;
            else [].forEach.call(nodes, function(td, i) {
                text += (i ? "\n" : "") + td.textContent;
            });
            var clipboardData = e.originalEvent.clipboardData;
            clipboardData?.setData("text", text);
            e.preventDefault();
        });
    }
    buildView_() {
        // TODO: is this distinction necessary?
        const language = this.params.language;
        const beforeLines = language ? this.beforeLinesHighlighted : this.beforeLines;
        const afterLines = language ? this.afterLinesHighlighted : this.afterLines;
        const expandLines = this.params.expandLines;
        const $table = $('<table class="diff">');
        $table.append($("<tr>").append($('<th class="diff-header" colspan=2>').text(this.params.beforeName), $('<th class="diff-header" colspan=2>').text(this.params.afterName)));
        for (const range of this.diffRanges){
            const type = range.type;
            const numBeforeRows = range.before[1] - range.before[0];
            const numAfterRows = range.after[1] - range.after[0];
            const numRows = Math.max(numBeforeRows, numAfterRows);
            if (type == "skip") $table.append((0, $d0fe6ceded5cfd85$export$8d7d7a7d0377361b)(range.before[0], range.after[0], numRows, range.header ?? null, expandLines));
            else for(let j = 0; j < numRows; j++){
                const beforeIdx = j < numBeforeRows ? range.before[0] + j : null;
                const afterIdx = j < numAfterRows ? range.after[0] + j : null;
                $table.append((0, $d0fe6ceded5cfd85$export$9ab1e790f5c0e723)(type, beforeIdx != null ? 1 + beforeIdx : null, beforeIdx != null ? beforeLines[beforeIdx] : undefined, afterIdx != null ? 1 + afterIdx : null, afterIdx != null ? afterLines[afterIdx] : undefined, language));
            }
        }
        if (this.params.wordWrap) $table.addClass("word-wrap");
        const $container = $('<div class="diff">');
        $container.append($table);
        // Attach event handlers & apply char diffs.
        this.attachHandlers_($container);
        return $container.get(0);
    }
    static buildView(beforeText, afterText, userParams) {
        const params = {
            ...$a4b41c61879d57cc$var$DEFAULT_OPTIONS,
            ...$a4b41c61879d57cc$var$DEFAULT_PARAMS,
            ...userParams
        };
        const beforeLines = beforeText ? difflib.stringAsLines(beforeText) : [];
        const afterLines = afterText ? difflib.stringAsLines(afterText) : [];
        const sm = new difflib.SequenceMatcher(beforeLines, afterLines);
        const opcodes = sm.get_opcodes();
        const diffRanges = (0, $7b3893c47869bfd4$export$bc16352bf8ce7a63)(opcodes, params.contextSize, params.minJumpSize);
        var d = new $a4b41c61879d57cc$export$d7ae8a2952d3eaf0(beforeText, beforeLines, afterText, afterLines, diffRanges, params);
        return d.buildView_();
    }
    static buildViewFromOps(beforeText, afterText, ops, params) {
        const beforeLines = beforeText ? difflib.stringAsLines(beforeText) : [];
        const afterLines = afterText ? difflib.stringAsLines(afterText) : [];
        const fullParams = {
            ...$a4b41c61879d57cc$var$DEFAULT_PARAMS,
            ...params
        };
        const diffRanges = $a4b41c61879d57cc$var$enforceMinJumpSize(ops, fullParams.minJumpSize);
        var d = new $a4b41c61879d57cc$export$d7ae8a2952d3eaf0(beforeText, beforeLines, afterText, afterLines, diffRanges, params);
        return d.buildView_();
    }
}
/**
 * @return Lines marked up with syntax <span>s. The <span>
 *     tags will be balanced within each line.
 */ function $a4b41c61879d57cc$var$highlightText(text, language) {
    if (text === null) return [];
    // TODO(danvk): look into suppressing highlighting if .relevance is low.
    const html = hljs.highlight(text, {
        language: language,
        ignoreIllegals: true
    }).value;
    // Some of the <span>s might cross lines, which won't work for our diff
    // structure. We convert them to single-line only <spans> here.
    return (0, $b86f11f5e9077ed0$export$1f6ff06b43176f68)(html);
}
/** This removes small skips like "skip 1 line" that are disallowed by minJumpSize. */ function $a4b41c61879d57cc$var$enforceMinJumpSize(diffs, minJumpSize) {
    return diffs.map((d)=>d.type === "skip" && d.before[1] - d.before[0] < minJumpSize ? {
            ...d,
            type: "equal"
        } : d);
}
window.codediff = {
    ...$a4b41c61879d57cc$export$d7ae8a2952d3eaf0,
    // These are exported for testing
    distributeSpans_: (0, $b86f11f5e9077ed0$export$1f6ff06b43176f68),
    simplifyCodes_: (0, $1190ad35680a3ea6$export$4a6fd8fca76e617),
    codesToHtml_: (0, $1190ad35680a3ea6$export$bb64c3e92bb86580),
    addCharacterDiffs_: (0, $1190ad35680a3ea6$export$66fc1d006dbd50e9),
    computeCharacterDiffs_: (0, $1190ad35680a3ea6$export$bbc379085bcd4964),
    splitIntoWords_: (0, $1190ad35680a3ea6$export$f5f0783f1100ed33),
    guessLanguageUsingFileName: $6d1363c84edc199c$export$189ed0fd75cb2ccc,
    guessLanguageUsingContents: $6d1363c84edc199c$export$2440592065e06347,
    opcodesToDiffRanges: (0, $7b3893c47869bfd4$export$bc16352bf8ce7a63),
    htmlTextMapper: $b8027a79b3117d71$export$edaad34459cb0d2b,
    buildView: $a4b41c61879d57cc$export$d7ae8a2952d3eaf0.buildView,
    buildViewFromOps: $a4b41c61879d57cc$export$d7ae8a2952d3eaf0.buildViewFromOps
};

})();
//# sourceMappingURL=codediff.js.map
