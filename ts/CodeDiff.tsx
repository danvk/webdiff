import React from 'react';

export interface ImageFile {
  width: number;
  height: number;
}

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
  const codediffRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    // Either side can be empty (i.e. an add or a delete), in which case
    // getOrNull returns an empty Deferred object.
    var getOrNull = (side: string, path: string) =>
        path ? $.post(`/${side}/get_contents`, {path}) : [null];

    const {a, b} = filePair;
    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    var beforeDeferred = getOrNull('a', a);
    var afterDeferred = getOrNull('b', b);

    $.when(beforeDeferred, afterDeferred).done((before, after) => {
      if (!this.isMounted()) return;
      // Call out to codediff.js to construct the side-by-side diff.
      $(codediffRef.current).empty().append(
        renderDiff(a, b, before[0], after[0])
      );
    })
    .fail((e) => alert("Unable to get diff!"));
  }, [filePair]);

  return (
    <div>
      <NoChanges filePair={this.props.filePair} />
      <div ref="codediff" key={this.props.filePair.idx}>Loading&hellip;</div>
    </div>
  );
}