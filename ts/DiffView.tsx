import React from 'react';
import {CodeDiffContainer, FilePair} from './CodeDiffContainer';
import {DiffOptions} from './diff-options';
import {getThickDiff} from './file_diff';
import {ImageDiff} from './ImageDiff';
import {ImageDiffMode} from './ImageDiffModeSelector';

export type PerceptualDiffMode = 'off' | 'bbox' | 'pixels';

export interface Props {
  thinFilePair: FilePair;
  imageDiffMode: ImageDiffMode;
  pdiffMode: PerceptualDiffMode;
  diffOptions: Partial<DiffOptions>;
  changeImageDiffModeHandler: (mode: ImageDiffMode) => void;
  changePDiffMode: (pdiffMode: PerceptualDiffMode) => void;
  changeDiffOptions: (options: Partial<DiffOptions>) => void;
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
    diffEl = <CodeDiffContainer filePair={filePair} diffOptions={diffOptions} />;
  }

  return diffEl;
}
