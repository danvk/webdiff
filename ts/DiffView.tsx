import React from 'react';
import {CodeDiff, FilePair} from './CodeDiff';
import {getThickDiff} from './file_diff';
import {ImageDiff} from './ImageDiff';
import {ImageDiffMode} from './ImageDiffModeSelector';

export type PerceptualDiffMode = 'off' | 'bbox' | 'pixels';

export interface Props {
  thinFilePair: FilePair;
  imageDiffMode: ImageDiffMode;
  pdiffMode: PerceptualDiffMode;
  changeImageDiffModeHandler: (mode: ImageDiffMode) => void;
  changePDiffMode: (pdiffMode: PerceptualDiffMode) => void;
}

export function DiffView(props: Props) {
  const [filePair, setFilePair] = React.useState<FilePair | null>(null);

  const {thinFilePair} = props;
  React.useEffect(() => {
    (async () => {
      const newFilePair = await getThickDiff(thinFilePair.idx);
      setFilePair({
        ...newFilePair,
        idx: thinFilePair.idx,
      });
    })();
  }, [thinFilePair, setFilePair]);

  if (!filePair) {
    return <div>Loading…</div>;
  }

  if (filePair.is_image_diff) {
    return <ImageDiff filePair={filePair} {...props} />;
  } else {
    return <CodeDiff filePair={filePair} />;
  }
}
