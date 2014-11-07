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

  // First guess a language based on the file name.
  // Fall back to guessing based on the contents of the longer version.
  var language = codediff.guessLanguageUsingFileName(pathBefore || pathAfter);
  if (!language) {
    var byLength = [contentsBefore, contentsAfter];
    if (contentsAfter.length > contentsBefore.length) {
      byLength = [byLength[1], byLength[0]];
    }
    language = codediff.guessLanguageUsingContents(byLength[0]);
  }
  if (language) {
    opts.language = language;
  }

  diffDiv.appendChild(codediff.buildView(contentsBefore, contentsAfter, opts));

  return diffDiv;
}


// Useful for avoiding capturing keyboard shortcuts and text entry.
function isLegitKeypress(e) {
  if (e.ctrlKey || e.altKey || e.metaKey ||
      e.target.tagName.toLowerCase() == 'input' ||
      e.target.tagName.toLowerCase() == 'textarea') {
    return false;
  }
  return true;
}
