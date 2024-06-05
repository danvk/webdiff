/**
 * Returns a valid HighlightJS language based on a file name/path.
 * If it can't guess a language, returns null.
 */
export function guessLanguageUsingFileName(name: string) {
  var lang = (function () {
    var m = /\.([^.]+)$/.exec(name);
    if (m) {
      var ext = m[1];
      if (ext == 'py') return 'python';
      if (ext == 'sh') return 'bash';
      if (ext == 'md') return 'markdown';
      if (ext == 'js') return 'javascript';
      return m[1].toLowerCase();
    }

    // Highlighting based purely on file name, e.g. "Makefile".
    m = /(?:.*\/)?([^\/]*)$/.exec(name);
    if (m && m[1] == 'Makefile') {
      return 'makefile';
    }
    return null;
  })();

  if (!lang || !hljs.getLanguage(lang)) {
    return null;
  } else {
    return lang;
  }
}

/**
 * Guess a language based on a file's contents.
 * This always returns a valid HighlightJS language. It considers the shebang
 * line (if present) and then falls back to HighlightJS's keyword-based
 * guessing.
 */
export function guessLanguageUsingContents(contents: string) {
  // First check for a shebang line.
  var firstLine = contents.substring(0, contents.indexOf('\n'));
  if (firstLine.substring(0, 2) == '#!') {
    var processor = firstLine.substring(2);
    if (processor == '/bin/bash') return 'bash';
    if (processor == '/bin/sh') return 'bash';

    const options = {
      python: 'python',
      perl: 'perl',
      ruby: 'ruby',
      node: 'javascript',
    };
    let interpreter: keyof typeof options;
    for (interpreter in options) {
      var lang = options[interpreter];
      if (processor.indexOf(interpreter) >= 0) {
        return lang;
      }
    }
  }

  // Now let HighlightJS guess.
  var guess = hljs.highlightAuto(contents);
  var lang = guess.language;
  return lang;
}
