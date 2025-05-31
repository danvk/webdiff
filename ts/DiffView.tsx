import React from 'react';
import {CodeDiffContainer, FilePair} from './CodeDiffContainer';
import {GitDiffOptions} from './diff-options';
import {getThickDiff} from './file_diff';
import {ImageDiff} from './ImageDiff';
import {ImageDiffMode} from './ImageDiffModeSelector';

export type PerceptualDiffMode = 'off' | 'bbox' | 'pixels';

export interface Props {
  thinFilePair: FilePair;
  imageDiffMode: ImageDiffMode;
  pdiffMode: PerceptualDiffMode;
  diffOptions: Partial<GitDiffOptions>;
  normalizeJSON: boolean;
  changeImageDiffMode: (mode: ImageDiffMode) => void;
  changePDiffMode: React.Dispatch<React.SetStateAction<PerceptualDiffMode>>;
  changeDiffOptions: (options: Partial<GitDiffOptions>) => void;
}

export function DiffView(props: Props) {
  const {diffOptions, thinFilePair} = props;
  const [filePair, setFilePair] = React.useState<FilePair | null>(null);

  React.useEffect(() => {
    (async () => {
      const newFilePair = await getThickDiff(thinFilePair.idx);
      setFilePair({
        ...newFilePair,
        idx: thinFilePair.idx,
      });
    })().catch((e: unknown) => {
      console.error(e);
    });
  }, [thinFilePair, setFilePair]);

  if (!filePair) {
    return <div>Loading…</div>;
  }

  let diffEl;
  if (filePair.is_image_diff) {
    diffEl = <ImageDiff filePair={filePair} {...props} />;
  } else {
    diffEl = (
      <CodeDiffContainer
        filePair={filePair}
        diffOptions={diffOptions}
        normalizeJSON={props.normalizeJSON}
      />
    );
  }

  return diffEl;
}
