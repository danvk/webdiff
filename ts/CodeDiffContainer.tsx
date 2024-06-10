import React from 'react';
import {DiffOptions, encodeDiffOptions} from './diff-options';
import {CodeDiff, PatchOptions} from './codediff/codediff';
import {guessLanguageUsingContents, guessLanguageUsingFileName} from './codediff/language';
import {GitConfig} from './options';
import {DiffRange} from './codediff/codes';

interface BaseFilePair {
  idx: number;
  /** file name of left side of diff */
  a: string;
  /** file name of right side of diff */
  b: string;
  type: 'add' | 'delete' | 'move' | 'change'; // XXX check "change"
  /** Are there any changes to the file? Only set for "thick" diffs. */
  no_changes?: boolean;
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
export function NoChanges(props: {filePair: FilePair}) {
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

// Either side can be empty (i.e. an add or a delete), in which case
// getOrNull resolves to null
async function getOrNull(side: string, path: string) {
  if (!path) return null;
  const data = new URLSearchParams();
  data.set('path', path);
  const response = await fetch(`/${side}/get_contents`, {
    method: 'post',
    body: data,
  });
  return response.text();
}

// A side-by-side diff of source code.
export function CodeDiffContainer(props: {filePair: FilePair; diffOptions: Partial<DiffOptions>}) {
  const {filePair, diffOptions} = props;
  const codediffRef = React.useRef<HTMLDivElement>(null);
  const [contents, setContents] = React.useState<
    {before: string | null; after: string | null; diffOps: DiffRange[]} | undefined
  >();

  React.useEffect(() => {
    const getDiff = async () => {
      const response = await fetch(`/diff/${filePair.idx}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({options: encodeDiffOptions(diffOptions)}),
      });
      return response.json() as Promise<DiffRange[]>;
    };

    const {a, b} = filePair;
    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    // TODO: split these into three useEffects to avoid over-fetching when diff options change.
    (async () => {
      const [before, after, diffOps] = await Promise.all([
        getOrNull('a', a),
        getOrNull('b', b),
        getDiff(),
      ]);
      setContents({before, after, diffOps});
    })().catch((e: unknown) => {
      alert('Unable to get diff!');
      console.error(e);
    });
  }, [filePair, diffOptions]);

  return (
    <div>
      <NoChanges filePair={filePair} />
      <div ref={codediffRef} key={filePair.idx}>
        {contents ? (
          <FileDiff
            pathBefore={filePair.a}
            pathAfter={filePair.b}
            contentsBefore={contents.before}
            contentsAfter={contents.after}
            diffOps={contents.diffOps}
          />
        ) : (
          'Loading…'
        )}
      </div>
    </div>
  );
}

interface FileDiffProps {
  pathBefore: string;
  pathAfter: string;
  contentsBefore: string | null;
  contentsAfter: string | null;
  diffOps: DiffRange[];
}

function extractFilename(path: string) {
  const parts = path.split('/');
  return parts[parts.length - 1];
}
const HIGHLIGHT_BLACKLIST = ['TODO', 'README', 'NOTES'];
declare const GIT_CONFIG: GitConfig;

function lengthOrZero(data: unknown[] | string | null | undefined) {
  return data?.length ?? 0;
}

function FileDiff(props: FileDiffProps) {
  const {pathBefore, pathAfter, contentsBefore, contentsAfter, diffOps} = props;
  // build the diff view and add it to the current DOM

  const lastOp = diffOps[diffOps.length - 1];
  const numLines = Math.max(lastOp.before[1], lastOp.after[1]);

  // First guess a language based on the file name.
  // Fall back to guessing based on the contents of the longer version.
  const path = pathBefore || pathAfter;
  const language = React.useMemo(() => {
    let language = guessLanguageUsingFileName(path);
    if (
      !language &&
      !HIGHLIGHT_BLACKLIST.includes(extractFilename(path)) &&
      numLines < GIT_CONFIG.webdiff.maxLinesForSyntax
    ) {
      let byLength = [contentsBefore, contentsAfter];
      if (contentsAfter && lengthOrZero(contentsAfter) > lengthOrZero(contentsBefore)) {
        byLength = [byLength[1], byLength[0]];
      }
      language = byLength[0] ? guessLanguageUsingContents(byLength[0]) ?? null : null;
    }
    return language;
  }, [contentsAfter, contentsBefore, numLines, path]);

  const opts = React.useMemo(
    (): Partial<PatchOptions> => ({
      // set the display titles for each resource
      beforeName: pathBefore || '(none)',
      afterName: pathAfter || '(none)',
      language,
      // TODO: thread through minJumpSize
    }),
    [language, pathAfter, pathBefore],
  );

  return (
    <div className="diff">
      <CodeDiff beforeText={contentsBefore} afterText={contentsAfter} ops={diffOps} params={opts} />
    </div>
  );
}
