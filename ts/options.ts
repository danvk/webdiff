/** Type of global git_config object */
export interface GitConfig {
    webdiff: WebdiffConfig;
    'colors.webdiff': ColorsConfig;
}

export interface WebdiffConfig {
    unified: number,
    extraDirDiffArgs: string;
    extraFileDiffArgs: string;
    openBrowser: boolean;
    port: number;
    maxDiffWidth: number;
    theme: string;
}

export interface ColorsConfig {
    insert: string;
    delete: string;
    charInsert: string;
    charDelete: string;
}
