import React from 'react';
import {GitDiffOptions, gitDiffOptionsToFlags} from './diff-options';
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
  num_add: number | null;
  num_delete: number | null;
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
export function NoChanges(props: {filePair: FilePair; isEqualAfterNormalization: boolean}) {
  const {filePair, isEqualAfterNormalization} = props;
  let msg = null;
  if (filePair.no_changes) {
    msg = <>(File content is identical)</>;
  } else if (isEqualAfterNormalization) {
    msg = <>(File content is identical after normalization)</>;
  } else if (filePair.is_image_diff && filePair.are_same_pixels) {
    msg = (
      <>Pixels are the same, though file content differs (perhaps the headers are different?)</>
    );
  }
  return msg ? <div className="no-changes">{msg}</div> : null;
}

// Either side can be empty (i.e. an add or a delete), in which case getOrNull resolves to null.
async function getOrNull(side: string, path: string, normalizeJSON: boolean) {
  if (!path) return null;
  const data = new URLSearchParams();
  data.set('path', path);
  if (normalizeJSON) {
    data.set('normalize_json', '1');
  }
  const response = await fetch(`/${side}/get_contents`, {
    method: 'post',
    body: data,
  });
  return response.text();
}

export interface CodeDiffContainerProps {
  filePair: FilePair;
  diffOptions: Partial<GitDiffOptions>;
  normalizeJSON: boolean;
}

// A side-by-side diff of source code.
export function CodeDiffContainer(props: CodeDiffContainerProps) {
  const {filePair, diffOptions, normalizeJSON} = props;
  const [contents, setContents] = React.useState<
    {before: string | null; after: string | null; diffOps: DiffRange[]} | undefined
  >();

  React.useEffect(() => {
    // It would be more correct to set contents=undefined here to get a loading state,
    // but this produces an unnecessary flash for rapid transitions.
    const getDiff = async () => {
      const response = await fetch(`/diff/${filePair.idx}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: gitDiffOptionsToFlags(diffOptions),
          normalize_json: normalizeJSON,
        }),
      });
      return response.json() as Promise<DiffRange[]>;
    };

    const {a, b} = filePair;
    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    // TODO: split these into three useEffects to avoid over-fetching when diff options change.
    (async () => {
      const [before, after, diffOps] = await Promise.all([
        getOrNull('a', a, normalizeJSON),
        getOrNull('b', b, normalizeJSON),
        getDiff(),
      ]);
      setContents({before, after, diffOps});
    })().catch((e: unknown) => {
      alert('Unable to get diff!');
      console.error(e);
    });
  }, [filePair, diffOptions, normalizeJSON]);

  const isEqualAfterNormalization = React.useMemo(() => {
    return !filePair.no_changes && normalizeJSON && contents && contents.before == contents.after;
  }, [contents, filePair.no_changes, normalizeJSON]);

  return (
    <div>
      <div key={filePair.idx}>
        {contents ? (
          <FileDiff
            filePair={filePair}
            contentsBefore={contents.before}
            contentsAfter={contents.after}
            diffOps={contents.diffOps}
            isEqualAfterNormalization={!!isEqualAfterNormalization}
          />
        ) : (
          'Loading…'
        )}
      </div>
    </div>
  );
}

interface FileDiffProps {
  filePair: FilePair;
  contentsBefore: string | null;
  contentsAfter: string | null;
  diffOps: DiffRange[];
  isEqualAfterNormalization: boolean;
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
  const {filePair, contentsBefore, contentsAfter, diffOps, isEqualAfterNormalization} = props;
  const pathBefore = filePair.a;
  const pathAfter = filePair.b;
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
      language,
      // TODO: thread through minJumpSize
    }),
    [language],
  );

  return (
    <div className="diff">
      <NoChanges filePair={filePair} isEqualAfterNormalization={isEqualAfterNormalization} />
      <CodeDiff
        beforeText={contentsBefore}
        afterText={contentsAfter}
        filePair={filePair}
        ops={diffOps}
        params={opts}
      />
    </div>
  );
}
