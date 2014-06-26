/*
This is part of jsdifflib v1.0. <http://github.com/cemerick/jsdifflib>

Copyright 2007 - 2011 Chas Emerick <cemerick@snowtide.com>. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY Chas Emerick ``AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Chas Emerick OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of Chas Emerick.
*/
diffview = {
	/**
	 * Builds and returns a visual diff view.  The single parameter, `params', should contain
	 * the following values:
	 *
	 * - baseTextLines: the array of strings that was used as the base text input to SequenceMatcher
	 * - newTextLines: the array of strings that was used as the new text input to SequenceMatcher
	 * - opcodes: the array of arrays returned by SequenceMatcher.get_opcodes()
	 * - baseTextName: the title to be displayed above the base text listing in the diff view; defaults
	 *	   to "Base Text"
	 * - newTextName: the title to be displayed above the new text listing in the diff view; defaults
	 *	   to "New Text"
	 * - contextSize: the number of lines of context to show around differences; by default, all lines
	 *	   are shown
	 * - viewType: if 0, a side-by-side diff view is generated (default); if 1, an inline diff view is
	 *	   generated
	 */
	buildView: function (params) {
		var baseTextLines = params.baseTextLines;
		var newTextLines = params.newTextLines;
		var opcodes = params.opcodes;
		var baseTextName = params.baseTextName ? params.baseTextName : "Base Text";
		var newTextName = params.newTextName ? params.newTextName : "New Text";
		var contextSize = params.contextSize;
		var inline = (params.viewType == 0 || params.viewType == 1) ? params.viewType : 0;
		var characterDiffs = params.characterDiffs || false;

		if (baseTextLines == null)
			throw "Cannot build diff view; baseTextLines is not defined.";
		if (newTextLines == null)
			throw "Cannot build diff view; newTextLines is not defined.";
		if (!opcodes)
			throw "Cannot build diff view; opcodes is not defined.";
		
		function celt (name, clazz) {
			var e = document.createElement(name);
			e.className = clazz;
			return e;
		}
		
		function telt (name, text) {
			var e = document.createElement(name);
			e.appendChild(document.createTextNode(text));
			return e;
		}
		
		function ctelt (name, clazz, text) {
			var e = document.createElement(name);
			e.className = clazz;
			e.appendChild(document.createTextNode(text));
			return e;
		}
	
		var tdata = document.createElement("thead");
		var node = document.createElement("tr");
		tdata.appendChild(node);
		if (inline) {
			node.appendChild(document.createElement("th"));
			node.appendChild(document.createElement("th"));
			node.appendChild(ctelt("th", "texttitle", baseTextName + " vs. " + newTextName));
		} else {
			node.appendChild(document.createElement("th"));
			node.appendChild(ctelt("th", "texttitle", baseTextName));
			node.appendChild(document.createElement("th"));
			node.appendChild(ctelt("th", "texttitle", newTextName));
		}
		tdata = [tdata];
		
		var rows = [];
		var node2;
		
		/**
		 * Adds two cells to the given row; if the given row corresponds to a real
		 * line number (based on the line index tidx and the endpoint of the 
		 * range in question tend), then the cells will contain the line number
		 * and the line of text from textLines at position tidx (with the class of
		 * the second cell set to the name of the change represented), and tidx + 1 will
		 * be returned.	 Otherwise, tidx is returned, and two empty cells are added
		 * to the given row.
		 */
		function addCells (row, tidx, tend, textLines, change) {
			if (tidx < tend) {
				row.appendChild(telt("th", (tidx + 1).toString()));
				row.appendChild(ctelt("td", change, textLines[tidx].replace(/\t/g, "\u00a0\u00a0\u00a0\u00a0")));
				return tidx + 1;
			} else {
				row.appendChild(document.createElement("th"));
				row.appendChild(celt("td", "empty"));
				return tidx;
			}
		}
		
		function addCellsInline (row, tidx, tidx2, textLines, change) {
			row.appendChild(telt("th", tidx == null ? "" : (tidx + 1).toString()));
			row.appendChild(telt("th", tidx2 == null ? "" : (tidx2 + 1).toString()));
			row.appendChild(ctelt("td", change, textLines[tidx != null ? tidx : tidx2].replace(/\t/g, "\u00a0\u00a0\u00a0\u00a0")));
		}

		function addCharacterDiffs(row) {
			var tds = row.getElementsByTagName("td");
			if (tds.length != 2) return;
			var beforeTd = tds[0];
			var afterTd = tds[1];
			var beforeText = beforeTd.textContent;
			var afterText = afterTd.textContent;
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

			var htmlEscape = function(text) {
				var e = document.createElement('span');
				e.appendChild(document.createTextNode(text));
				return e.innerHTML;
			};

			var beforeHtml = '';
			var afterHtml = '';
			opcodes.forEach(function(opcode) {
				var change = opcode[0];
				var beforeIdx = opcode[1];
				var beforeEnd = opcode[2];
				var afterIdx = opcode[3];
				var afterEnd = opcode[4];
				var beforeOpHtml = htmlEscape(beforeText.substring(beforeIdx, beforeEnd));
				var afterOpHtml = htmlEscape(afterText.substring(afterIdx, afterEnd));
				if (change == 'equal') {
					beforeHtml += beforeOpHtml;
					afterHtml += afterOpHtml;
				} else if (change == 'delete') {
					beforeHtml += '<span class=char-delete>' + beforeOpHtml + '</span>';
					// assert afterIdx == afterEnd
				} else if (change == 'insert') {
					// TODO(danvk): handle escaping
					afterHtml += '<span class=char-insert>' + afterOpHtml + '</span>';
					// assert beforeIdx == beforeEnd
				} else if (change == 'replace') {
					beforeHtml += '<span class=char-replace>' + beforeOpHtml + '</span>';
					afterHtml += '<span class=char-replace>' + afterOpHtml + '</span>';
				} else {
					throw "Invalid opcode: " + opcode[0];
				}
			});
			beforeTd.innerHTML = beforeHtml;
			afterTd.innerHTML = afterHtml;
		}
		
		for (var idx = 0; idx < opcodes.length; idx++) {
			code = opcodes[idx];
			change = code[0];
			var b = code[1];
			var be = code[2];
			var n = code[3];
			var ne = code[4];
			var rowcnt = Math.max(be - b, ne - n);
			var toprows = [];
			var botrows = [];
			for (var i = 0; i < rowcnt; i++) {
				// jump ahead if we've alredy provided leading context or if this is the first range
				if (contextSize && opcodes.length > 1 && ((idx > 0 && i == contextSize) || (idx == 0 && i == 0)) && change=="equal") {
					var jump = rowcnt - ((idx == 0 ? 1 : 2) * contextSize);
					var isEnd = (idx + 1 == opcodes.length);
					if (isEnd) {
						jump += (contextSize - 1);
					}
					if (jump > 1) {
						toprows.push(node = document.createElement("tr"));

						var $skipEl = $('<td class=skip><a href="#">Show ' + jump + ' lines</a></td>');
						$skipEl.data({
							'beforeStartIndex': b,
							'afterStartIndex': n,
							'jumpLength': jump
						});
						
						b += jump;
						n += jump;
						i += jump - 1;
						node.appendChild(telt("th", "..."));
						if (!inline) node.appendChild(ctelt("td", "skip", ""));
						node.appendChild(telt("th", "..."));
						if (inline) {
							node.appendChild(ctelt("td", "skip", ""));
						} else {
							$(node).append($skipEl);
						}
						
						// skip last lines if they're all equal
						if (isEnd) {
							break;
						} else {
							continue;
						}
					}
				}
				
				toprows.push(node = document.createElement("tr"));
				if (inline) {
					if (change == "insert") {
						addCellsInline(node, null, n++, newTextLines, change);
					} else if (change == "replace") {
						botrows.push(node2 = document.createElement("tr"));
						if (b < be) addCellsInline(node, b++, null, baseTextLines, "delete");
						if (n < ne) addCellsInline(node2, null, n++, newTextLines, "insert");
					} else if (change == "delete") {
						addCellsInline(node, b++, null, baseTextLines, change);
					} else {
						// equal
						addCellsInline(node, b++, n++, baseTextLines, change);
					}
				} else {
					b = addCells(node, b, be, baseTextLines, 'before line-' + (b+1) + ' ' + change);
					n = addCells(node, n, ne, newTextLines, 'after line-' + (n+1) + ' ' + change);
					if (change == "replace" && characterDiffs) {
						addCharacterDiffs(node);
					}
				}
			}

			for (var i = 0; i < toprows.length; i++) rows.push(toprows[i]);
			for (var i = 0; i < botrows.length; i++) rows.push(botrows[i]);
		}
		
		rows.push(node = ctelt("th", "author", "diff view generated by "));
		node.setAttribute("colspan", inline ? 3 : 4);
		node.appendChild(node2 = telt("a", "jsdifflib"));
		node2.setAttribute("href", "http://github.com/cemerick/jsdifflib");
		
		tdata.push(node = document.createElement("tbody"));
		for (var idx in rows) rows.hasOwnProperty(idx) && node.appendChild(rows[idx]);
		
		node = celt("table", "diff" + (inline ? " inlinediff" : ""));
		for (var idx in tdata) tdata.hasOwnProperty(idx) && node.appendChild(tdata[idx]);

		// Set up links to show more context.
		if (!inline) {
			$(node).data('params', params);
			$(node).on('click', '.skip a', function(e) {
				var skipData = $(this).closest('td.skip').data();
				var params = $(this).closest('table').data('params');
				var $skipRow = $(this).closest('tr');
				var newRows = [];

				// TODO(danvk): consolidate w/ above
				var b = skipData.beforeStartIndex;
				var n = skipData.afterStartIndex;
                                var jump = skipData.jumpLength;
				var be = b + jump, ne = n + jump;
				var node;
				var change = "equal";
				for (var i = 0; i < skipData.jumpLength; i++) {
					newRows.push(node = document.createElement("tr"));
					b = addCells(node, b, be, params.baseTextLines, 'before line-' + (b+1) + ' ' + change);
					n = addCells(node, n, ne, params.newTextLines, 'after line-' + (n+1) + ' ' + change);
				}
				$skipRow.after(newRows);
				$skipRow.remove();
				e.preventDefault();
			});
		}

		return node;
	}
};

