import {DiffAlgorithm} from './diff-options';

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
  const config = GIT_CONFIG.webdiff;
  const colors = GIT_CONFIG['webdiff.colors'];
  document.write(`
  <style>
  td.code {
    width: ${1 + config.maxDiffWidth}ch;
  }
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
