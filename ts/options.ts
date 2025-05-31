import {DiffAlgorithm, flagsToGitDiffOptions, GitDiffOptions, gitDiffOptionsToFlags} from './diff-options';

/** Type of global git_config object */
export interface GitConfig {
  webdiff: WebdiffConfig;
  'webdiff.colors': ColorsConfig;
  diff: {
    algorithm?: DiffAlgorithm;
  };
}

export interface WebdiffConfig {
  unified: number;
  extraDirDiffArgs: string;
  extraFileDiffArgs: string;
  openBrowser: boolean;
  port: number;
  maxDiffWidth: number;
  theme: string;
  maxLinesForSyntax: number;
}

export interface ColorsConfig {
  insert: string;
  delete: string;
  charInsert: string;
  charDelete: string;
}

declare const GIT_CONFIG: GitConfig;

export function injectStylesFromConfig() {
  const colors = GIT_CONFIG['webdiff.colors'];
  document.write(`
  <style>
  .diff .delete, .before.replace {
    background-color: ${colors.delete};
  }
  .diff .insert, .after.replace {
    background-color: ${colors.insert};
  }
  .before .char-replace, .before .char-delete {
    background-color: ${colors.charDelete};
  }
  .after .char-replace, .after .char-insert {
    background-color: ${colors.charInsert};
  }
  </style>
  `);
}

export interface CombinedOptions extends GitDiffOptions {
  maxDiffWidth: number;
  normalizeJSON?: boolean;
}

export function parseOptions(query: URLSearchParams): Partial<CombinedOptions> {
  const flags = query.getAll('flag');
  const gitDiffOptions = flagsToGitDiffOptions(flags);
  const maxWidthStr = query.get('width');
  const maxDiffWidth = maxWidthStr ? {maxDiffWidth: Number(maxWidthStr)} : undefined;
  const normalizeJsonStr = query.get('normalize_json');
  const normalizeJSON = normalizeJsonStr ? {normalizeJSON: true} : undefined;
  return {...gitDiffOptions, ...maxDiffWidth, ...normalizeJSON};
}

export function encodeOptions(
  options: Partial<CombinedOptions>,
) {
  const {maxDiffWidth, normalizeJSON, ...diffOptions} = options;
  const flags = gitDiffOptionsToFlags(diffOptions);
  const params = new URLSearchParams(flags.map(f => ['flag', f]));
  if (maxDiffWidth !== GIT_CONFIG.webdiff.maxDiffWidth) {
    params.set('width', String(maxDiffWidth));
  }
  if (normalizeJSON) {
    params.set('normalize_json', '1');
  }
  return params;
}

export type UpdateOptionsFn = (
  updater:
    | ((oldOptions: Partial<CombinedOptions>) => Partial<CombinedOptions>)
    | Partial<CombinedOptions>,
) => void;
