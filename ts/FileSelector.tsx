import React from "react";
import { FilePair } from "./CodeDiff";

export interface Props {
  filePairs: FilePair[];
  selectedFileIndex: number;
  fileChangeHandler: (newIndex: number) => void;
}

type Mode = "list" | "dropdown";

/** Shows a list of files in one of two possible modes (list or dropdown). */
export function FileSelector(props: Props) {
  const { filePairs, selectedFileIndex, fileChangeHandler } = props;

  // An explicit list is better, unless there are a ton of files.
  const [mode, setMode] = React.useState<Mode>(
    filePairs.length <= 6 ? "list" : "dropdown"
  );

  // For single file diffs, a file selector is a waste of space.
  if (filePairs.length === 1) {
    return null;
  }

  let selector;
  if (this.state.mode === "list") {
    selector = (
      <FileList
        filePairs={filePairs}
        selectedIndex={selectedFileIndex}
        fileChangeHandler={fileChangeHandler}
      />
    );
  } else {
    selector = (
      <FileDropdown
        filePairs={filePairs}
        selectedIndex={selectedFileIndex}
        fileChangeHandler={fileChangeHandler}
      />
    );
  }

  return (
    <div className="file-selector">
      {selector}
      {filePairs.length > 3 ? (
        <FileModeSelector mode={mode} changeHandler={setMode} />
      ) : null}
    </div>
  );
}
