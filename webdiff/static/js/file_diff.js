// Render the diff using jsdifflib. Also attaches comments.
function displayDiffs(pathBefore, pathAfter, baseTxt, afterTxt) {
  var diffDiv = renderDiff(pathBefore, pathAfter, baseTxt, afterTxt);

  $('#thediff').append(diffDiv);
}

/**
 * Display the diff for a single file.
 * @param {string} contentsBefore
 * @param {string} contentsAfter
 * @param {!HTMLDivElement} An unattached div containing the rendered diff.
 */
function renderDiff(pathBefore, pathAfter, contentsBefore, contentsAfter) {
  var diffDiv = $('<div class="diff"></div>').get(0);

  // build the diff view and add it to the current DOM
  var opts = {
    // set the display titles for each resource
    baseTextName: pathBefore,
    newTextName: pathAfter,
    contextSize: 10,
    syntaxHighlighting: true
  };
  var language = guessLanguage(pathBefore || pathAfter);
  if (language && hljs.getLanguage(language)) {
    opts.language = language;
  }

  diffDiv.appendChild(diffview.buildView(contentsBefore, contentsAfter, opts));

  return diffDiv;
}

function guessLanguage(filename) {
  var m = /\.([^.]+)$/.exec(filename);
  if (m) {
    return m[1];
  } else {
    return undefined;
  }
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
  $(document)
    .on('keydown', handleKeyPress)
    .on('change', '#pair-chooser', function() {
      document.location = '/' + $('#pair-chooser').val();
    });
}
