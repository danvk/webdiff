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

export function decodeDiffOptions(flags: string[]): Partial<DiffOptions> {
  const options: Partial<DiffOptions> = {};
  for (const flag of flags) {
    if (flag == '-w' || flag == '--ignore-all-space') {
      options.ignoreAllSpace = true;
    } else if (flag == '-b' || flag == '--ignore-space-change') {
      options.ignoreSpaceChange = true;
    } else if (flag == '-W' || flag == '--function-context') {
      options.functionContext = true;
    } else if (flag.startsWith('--diff-algorithm=')) {
      // This is pretty imprecise; I believe `--diff-algorithm patience` would also work.
      const algo = flag.split('=')[1];
      options.diffAlgorithm = algo as DiffAlgorithm;
    } else if (flag.startsWith('-U')) {
      options.unified = Number(flag.slice(2));
    }
  }
  return options;
}
