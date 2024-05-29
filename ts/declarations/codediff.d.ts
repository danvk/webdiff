// TODO: bundle this with codediff now that it's written in TS

declare module codediff {
  export interface Options {
    /**
     * Language to use for syntax highlighting.
     *
     * This parameter is passed through to highlight.js, which does the highlighting.
     * Any value it will accept is fine. You can do hljs.getLanguage(language) to see
     * if a language code is valid. A null value (the default) will disable syntax highlighting.
     * Example values include "python" or "javascript". (default: null)
     */
    language?: string;
    /** Text to place above the left side of the diff. (Default: "Before") */
    beforeName?: string;
    /** Text to place above the right side of the diff. (Default: "After") */
    afterName?: string;
    /** Minimum number of lines of context to show around each diff hunk. (default: 3). */
    contextSize?: number;
    /** Minimum number of equal lines to collapse into a "Show N more lines" link. (default: 10) */
    minJumpSize?: number;
    /**
     * By default, code will go all the way to the right margin of the diff.
     * If there are 60 characters of space, character 61 will wrap to the next line, even mid-word.
     * To wrap at word boundaries instead, set this option.
     */
    wordWrap?: boolean;
  }

  function guessLanguageUsingFileName(path: string): string;
  function guessLanguageUsingContents(contents: string): string;
  function buildView(before: string, after: string, opts: Options): HTMLElement;
  function buildViewFromOps(beforeText: string, afterText: string, ops: any[], opts: Options): HTMLElement;
}
