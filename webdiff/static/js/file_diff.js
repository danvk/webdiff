// Render the diff using jsdifflib. Also attaches comments.
function displayDiffs(pathBefore, pathAfter, baseTxt, afterTxt) {
  var diffDiv = renderDiff(pathBefore, pathAfter, baseTxt, afterTxt);

  $('#thediff').empty().append(diffDiv);
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
    beforeName: pathBefore || '(none)',
    afterName: pathAfter || '(none)',
    contextSize: 10
  };
  var language = guessLanguage(pathBefore || pathAfter);
  if (language && hljs.getLanguage(language)) {
    opts.language = language;
  }

  diffDiv.appendChild(codediff.buildView(contentsBefore, contentsAfter, opts));

  return diffDiv;
}

function guessLanguage(filename) {
  var m = /\.([^.]+)$/.exec(filename);
  if (m) {
    var ext = m[1];
    if (ext == 'py') return 'python';
    return m[1];
  } else {
    return undefined;
  }
}

function handleBlink() {
  // Four possible states:
  var leftVis = $('.image-diff-content .diff-left').is(':visible'),
      rightVis = $('.image-diff-content .diff-right').is(':visible');

  if (!leftVis && !rightVis) {
    return;  // not an image diff.
  } else if (leftVis && rightVis) {
    // side-by-side mode. Show left image first.
    $('#imagediff .diff-right').hide();
    $('#image-side-by-side').attr('href', '#');
  } else if (leftVis && !rightVis) {
    $('#imagediff .diff-left').hide();
    $('#imagediff .diff-right').show();
  } else if (!leftVis && rightVis) {
    $('#imagediff .diff-left').show();
    $('#imagediff .diff-right').hide();
  }
}

function handleSideBySide() {
  $('#imagediff').find('.diff-left, .diff-right').show();
  $('#image-side-by-side').removeAttr('href');
}

// Keyboard shortcuts:
// j/k = next/prev file
// n/p = next/prev diff
// b = blink images
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
  } else if (e.keyCode == 66) {  // 'b'
    handleBlink();
  }
  // console.log(e.keyCode);
}

function attachHandlers() {
  $(document)
    .on('keydown', handleKeyPress)
    .on('change', '#pair-chooser', function() {
      document.location = '/' + $('#pair-chooser').val();
    });

  $('#add-button').click(function(e) {
    $.ajax('/add/' + $('#pair-chooser').val());
  });

  $('#reset-button').click(function(e) {
    $.ajax('/reset/' + $('#pair-chooser').val());
  });
}
