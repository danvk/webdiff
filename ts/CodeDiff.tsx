import React from 'react';
import { renderDiff } from './file_diff';

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
  type: 'add' | 'delete' | 'move' | 'change';  // XXX check "change"
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
export function CodeDiff(props: {filePair: FilePair}) {
  const {filePair} = props;
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
    }

    const {a, b} = filePair;
    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    (async () => {
      const [before, after] = await Promise.all([getOrNull('a', a), getOrNull('b', b)]);
      // Call out to codediff.js to construct the side-by-side diff.
      const codediffEl = codediffRef.current;
      if (codediffEl) {
        codediffEl.innerHTML = '';
        codediffEl.appendChild(renderDiff(a, b, before, after));
      }
    })().catch(e => {
      alert("Unable to get diff!")
    });
  }, [filePair]);

  return (
    <div>
      <NoChanges filePair={filePair} />
      <div ref={codediffRef} key={filePair.idx}>Loading&hellip;</div>
    </div>
  );
}
