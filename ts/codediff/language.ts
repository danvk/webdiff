/**
 * Returns a valid HighlightJS language based on a file name/path.
 * If it can't guess a language, returns null.
 */
export function guessLanguageUsingFileName(name: string) {
  const lang = (function () {
    let m = /\.([^.]+)$/.exec(name);
    if (m) {
      const ext = m[1];
      if (ext == 'py') return 'python';
      if (ext == 'sh') return 'bash';
      if (ext == 'md') return 'markdown';
      if (ext == 'js') return 'javascript';
      return m[1].toLowerCase();
    }

    // Highlighting based purely on file name, e.g. "Makefile".
    m = /(?:.*\/)?([^/]*)$/.exec(name);
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
export function guessLanguageUsingContents(contents: string): string | undefined {
  // First check for a shebang line.
  const firstLine = contents.substring(0, contents.indexOf('\n'));
  let lang: string | undefined;
  if (firstLine.startsWith('#!')) {
    const processor = firstLine.substring(2);
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
      lang = options[interpreter];
      if (processor.includes(interpreter)) {
        return lang;
      }
    }
  }

  // Now let HighlightJS guess.
  const guess = hljs.highlightAuto(contents);
  lang = guess.language;
  return lang;
}
