// Render the diff using jsdifflib. Also attaches comments.
function displayDiffs(baseTxt, afterTxt) {
  var diffDiv = renderDiff(baseTxt, afterTxt);

  $('#thediff').append(diffDiv);
}

/**
 * Display the diff for a single file.
 * @param {string} contentsBefore
 * @param {string} contentsAfter
 * @param {!HTMLDivElement} An unattached div containing the rendered diff.
 */
function renderDiff(contentsBefore, contentsAfter) {
  var diffDiv = $('<div class="diff"></div>').get(0);

  // From https://github.com/cemerick/jsdifflib
  var baseLines = difflib.stringAsLines(contentsBefore);
  var afterLines = difflib.stringAsLines(contentsAfter);

  // create a SequenceMatcher instance that diffs the two sets of lines
  var sm = new difflib.SequenceMatcher(baseLines, afterLines);

  // get the opcodes from the SequenceMatcher instance
  // opcodes is a list of 3-tuples describing what changes should be made to the base text
  // in order to yield the new text
  var opcodes = sm.get_opcodes();
  var contextSize = 10;

  // build the diff view and add it to the current DOM
  diffDiv.appendChild(diffview.buildView({
      baseTextLines: baseLines,
      newTextLines: afterLines,
      opcodes: opcodes,
      // set the display titles for each resource
      baseTextName: "Before",
      newTextName: "After",
      contextSize: contextSize,
      viewType: 0,  // i.e. two column rather than inline.
      characterDiffs: true
  }));

  return diffDiv;
}


// Keyboard shortcuts:
// j/k = next/prev file
// n/p = next/prev diff
// u = up to pull request
function handleKeyPress(e) {
  if (e.ctrlKey || e.altKey || e.metaKey ||
      e.target.tagName.toLowerCase() == 'input' ||
      e.target.tagName.toLowerCase() == 'textarea') {
    return;
  }
  if (e.keyCode == 74 || e.keyCode == 75) {  // j/k
    var klass = (e.keyCode == 74 ? 'next' : 'prev');
    // Any better way to visit links?
    var url = $('a.' + klass).attr('href');
    if (url) {
      window.location = url;
    }
  }
  // console.log(e.keyCode);
}

function attachHandlers() {
  $(document).on('keydown', handleKeyPress);
}
