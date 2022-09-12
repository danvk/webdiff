import React from 'react';
import {renderDiffWithOps} from './file_diff';

export interface ImageFile {
  width: number;
  height: number;
  num_bytes: number;
}

// XXX this type is probably imprecise. What's a "thick" vs. "thin" diff?
export interface FilePair {
  is_image_diff: boolean;
  are_same_pixels: boolean;
  a: string;
  b: string;
  type: 'add' | 'delete' | 'move' | 'change'; // XXX check "change"
  image_a: ImageFile;
  image_b: ImageFile;
  idx: number;
  diffData?: ImageDiffData;
}

export interface DiffBox {
  width: number;
  height: number;
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export interface ImageDiffData {
  diffBounds: DiffBox;
}

export type DiffAlgorithm = 'patience' | 'minimal' | 'histogram' | 'myers';

export interface DiffOptions {
  /** aka -w */
  ignoreAllSpace: boolean;
  /** aka -b */
  ignoreSpaceChange: boolean;
  /** The default diff algorithm is myers */
  diffAlgorithm: DiffAlgorithm;
  /** aka -U<N>. Show this many lines of context. */
  unified: number;
  /** Adjust rename threshold (percent of file). Default is 50. */
  findRenames: number;
  /** Find copies in addition to renames. Units are percents. */
  findCopies: number;
}

function encodeDiffOptions(opts: Partial<DiffOptions>) {
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
    flags.push(`-U8`);  // TODO: other default options?
  }
  if (opts.findRenames) {
    flags.push(`--find-renames=${opts.findRenames}%`);
  }
  if (opts.findCopies) {
    flags.push(`--find-copies=${opts.findCopies}%`);
  }
  return flags;
}

// A "no changes" sign which only appears when applicable.
export function NoChanges(props: {filePair: any}) {
  const {filePair} = props;
  if (filePair.no_changes) {
    return <div className="no-changes">(File content is identical)</div>;
  } else if (filePair.is_image_diff && filePair.are_same_pixels) {
    return (
      <div className="no-changes">
        Pixels are the same, though file content differs (perhaps the headers are different?)
      </div>
    );
  }
  return null;
}

// A side-by-side diff of source code.
export function CodeDiff(props: {filePair: FilePair, diffOptions: Partial<DiffOptions>}) {
  const {filePair, diffOptions} = props;
  const codediffRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Either side can be empty (i.e. an add or a delete), in which case
    // getOrNull resolves to null
    var getOrNull = async (side: string, path: string) => {
      if (!path) return null;
      const data = new URLSearchParams();
      data.set('path', path);
      const response = await fetch(`/${side}/get_contents`, {
        method: 'post',
        body: data,
      });
      return response.text();
    };

    const getDiff = async () => {
      const response = await fetch(`/diff/${filePair.idx}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({options: encodeDiffOptions(diffOptions ?? {})})
      });
      return response.json();
    };

    const {a, b} = filePair;
    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    (async () => {
      const [before, after, diffOps] = await Promise.all([getOrNull('a', a), getOrNull('b', b), getDiff()]);
      // Call out to codediff.js to construct the side-by-side diff.
      const codediffEl = codediffRef.current;
      if (codediffEl) {
        codediffEl.innerHTML = '';
        codediffEl.appendChild(renderDiffWithOps(a, b, before, after, diffOps));
      }
    })().catch(e => {
      alert('Unable to get diff!');
    });
  }, [filePair, diffOptions]);

  return (
    <div>
      <NoChanges filePair={filePair} />
      <div ref={codediffRef} key={filePair.idx}>
        Loading&hellip;
      </div>
    </div>
  );
}
