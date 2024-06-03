import { GitConfig } from "./options";

export type DiffAlgorithm = 'patience' | 'minimal' | 'histogram' | 'myers';

export interface DiffOptions {
  /** aka -w */
  ignoreAllSpace: boolean;
  /** aka -b */
  ignoreSpaceChange: boolean;
  /** The default diff algorithm is myers */
  diffAlgorithm: DiffAlgorithm;
  /** aka -W */
  functionContext: boolean;
  /** aka -U<N>. Show this many lines of context. */
  unified: number;
  /** Adjust rename threshold (percent of file). Default is 50. */
  findRenames: number;
  /** Find copies in addition to renames. Units are percents. */
  findCopies?: number;
}

export function encodeDiffOptions(opts: Partial<DiffOptions>) {
  const flags = [];
  if (opts.ignoreAllSpace) {
    flags.push('-w');
  }
  if (opts.ignoreSpaceChange) {
    flags.push('-b');
  }
  if (opts.diffAlgorithm) {
    flags.push(`--diff-algorithm=${opts.diffAlgorithm}`);
  }
  if (opts.unified) {
    flags.push(`-U${opts.unified}`);
  } else {
    flags.push(`-U8`); // TODO: other default options?
  }
  if (opts.findRenames) {
    flags.push(`--find-renames=${opts.findRenames}%`);
  }
  if (opts.findCopies) {
    flags.push(`--find-copies=${opts.findCopies}%`);
  }
  if (opts.functionContext) {
    flags.push('-W');
  }
  return flags;
}

export function decodeDiffOptions(flags: string): Partial<DiffOptions> {
  const args = flags.split(' ');
  const options: Partial<DiffOptions> = {};
  for (const arg of args) {
    if (arg == '-w' || arg == '--ignoreAllSpace') {
      options.ignoreAllSpace = true;
    } else if (arg == '-b' || arg == '--ignoreSpaceChange') {
      options.ignoreSpaceChange = true;
    } else if (arg.startsWith('--diff-algorithm=')) {
      // This is pretty imprecise; I believe `--diff-algorithm patience` would also work.
      const algo = arg.split('=')[1];
      options.diffAlgorithm = algo as DiffAlgorithm;
    } else if (arg.startsWith('-U')) {
      options.unified = Number(arg.slice(2));
    }
  }
  return options;
}

export function fillDiffOptions(options: Partial<DiffOptions>, defaults: GitConfig['diff']): DiffOptions {
  return {
    ignoreAllSpace: options.ignoreAllSpace ?? false,
    ignoreSpaceChange: options.ignoreSpaceChange ?? false,
    functionContext: options.functionContext ?? false,
    diffAlgorithm: options.diffAlgorithm ?? defaults.algorithm ?? 'myers',
    unified: options.unified ?? 8,
    findRenames: options.findRenames ?? 50,
    findCopies: options.findCopies,
  };
}
