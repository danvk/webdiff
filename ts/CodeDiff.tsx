import React from 'react';
import {renderDiffWithOps} from './file_diff';
import {DiffOptions, encodeDiffOptions} from './diff-options';

interface BaseFilePair {
  idx: number;
  /** file name of left side of diff */
  a: string;
  /** file name of right side of diff */
  b: string;
  type: 'add' | 'delete' | 'move' | 'change'; // XXX check "change"
}

interface TextFilePair extends BaseFilePair {
  is_image_diff?: false;
}

// XXX this type is probably imprecise. What's a "thick" vs. "thin" diff?
export interface ImageFilePair extends BaseFilePair {
  is_image_diff: true;
  are_same_pixels: boolean;
  image_a: ImageFile;
  image_b: ImageFile;
  diffData?: ImageDiffData;
}

export type FilePair = TextFilePair | ImageFilePair;

export interface ImageFile {
  width: number;
  height: number;
  num_bytes: number;
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
export function CodeDiff(props: {filePair: FilePair; diffOptions: Partial<DiffOptions>}) {
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
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({options: encodeDiffOptions(diffOptions ?? {})}),
      });
      return response.json();
    };

    const {a, b} = filePair;
    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    (async () => {
      const [before, after, diffOps] = await Promise.all([
        getOrNull('a', a),
        getOrNull('b', b),
        getDiff(),
      ]);
      // Call out to codediff.js to construct the side-by-side diff.
      const codediffEl = codediffRef.current;
      if (codediffEl) {
        codediffEl.innerHTML = '';
        codediffEl.appendChild(renderDiffWithOps(a, b, before, after, diffOps));
      }
    })().catch(e => {
      alert('Unable to get diff!');
      console.error(e);
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
