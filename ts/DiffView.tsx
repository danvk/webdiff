import React from 'react';
import { FilePair } from './CodeDiff';

export type ImageDiffMode = 'side-by-side' | 'blink';

export interface Props {
  thinFilePair: any;
  imageDiffMode: ImageDiffMode;
  pdiffMode: number;
  changeImageDiffModeHandler: (mode: ImageDiffMode) => void;
  changePDiffMode: (pdiffMode: number) => void;
}

export function DiffView(props: Props) {
  const [filePair, setFilePair] = React.useState<FilePair | null>(null);

  const {thinFilePair} = props;
  React.useEffect(() => {
    (async () => {
      const newFilePair = await getThickDiff(thinFilePair.idx);
      newFilePair.idx = thinFilePair.idx;
      setFilePair(newFilePair);
    })();
  }, [thinFilePair, setFilePair]);

  if (!filePair) {
    return <div>Loading…</div>;
  }

  if (filePair.is_image_diff) {
    return <ImageDiff filePair={filePair} {...this.props} />;
  } else {
    return <CodeDiff filePair={filePair} />;
  }
}
