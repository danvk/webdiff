declare module 'codediff.js' {
  export interface Options {
    beforeName: string;
    afterName: string;
    contextSize: number;
    language?: string;
  }

  function guessLanguageUsingFileName(path: string): string;
  function guessLanguageUsingContents(contents: string): string;
  function buildView(before: string, after: string, opts: Options): HTMLElement;
}
