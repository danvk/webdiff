import React from "react";
import {RouteComponentProps, useHistory} from 'react-router';
import { FilePair } from "./CodeDiff";
import { DiffView, ImageDiffMode, PerceptualDiffMode } from "./DiffView";
import { FileSelector } from "./FileSelector";
import { isLegitKeypress } from "./file_diff";

declare const pairs: FilePair[];
declare const initialIdx: number;

type Props = RouteComponentProps<{index?: string}>;

const PDIFF_MODES: PerceptualDiffMode[] = ['off', 'bbox', 'pixels'];

// Webdiff application root.
export function Root(props: Props) {
  const [diffMode, setDiffMode] = React.useState<ImageDiffMode>("side-by-side");
  const [pdiffMode, setPDiffMode] = React.useState<PerceptualDiffMode>("off");
  const [imageDiffMode, setImageDiffMode] = React.useState<ImageDiffMode>('blink');

  const history = useHistory();
  const selectIndex = (idx: number) => {
    history.push(`/${idx}`);
  };

  const idx = Number(props.match.params.index ?? initialIdx);
  const filePair = pairs[idx];
  React.useEffect(() => {
    document.title =
      "Diff: " + filePairDisplayName(filePair) + " (" + filePair.type + ")";
  }, [filePair]);

  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isLegitKeypress(e)) return;
      if (e.keyCode == 75) {
        // j
        if (idx > 0) {
          selectIndex(idx - 1);
        }
      } else if (e.keyCode == 74) {
        // k
        if (idx < this.props.filePairs.length - 1) {
          selectIndex(idx + 1);
        }
      } else if (e.keyCode == 83) {
        // s
        setImageDiffMode("side-by-side");
      } else if (e.keyCode == 66) {
        // b
        setImageDiffMode("blink");
      } else if (e.keyCode == 80) {
        // p
        setPDiffMode(PDIFF_MODES[(PDIFF_MODES.indexOf(pdiffMode) + 1) % 3]);
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return (
    <div>
      <FileSelector
        selectedFileIndex={idx}
        filePairs={this.props.filePairs}
        fileChangeHandler={this.selectIndex}
      />
      <DiffView
        key={"diff-" + idx}
        thinFilePair={filePair}
        imageDiffMode={imageDiffMode}
        pdiffMode={pdiffMode}
        changeImageDiffModeHandler={this.changeImageDiffModeHandler}
        changePDiffMode={setPDiffMode}
      />
    </div>
  );
}
