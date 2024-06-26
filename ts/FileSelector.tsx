import React from 'react';
import {FilePair} from './CodeDiffContainer';
import {FileDropdown} from './FileDropdown';
import {FileList} from './FileList';
import {FileModeSelector} from './FileModeSelector';

export interface Props {
  filePairs: FilePair[];
  selectedFileIndex: number;
  fileChangeHandler: (newIndex: number) => void;
  mode: FileSelectorMode;
  onChangeMode: (mode: FileSelectorMode) => void;
}

export type FileSelectorMode = 'list' | 'dropdown';

/** Shows a list of files in one of two possible modes (list or dropdown). */
export function FileSelector(props: Props) {
  const {filePairs, selectedFileIndex, fileChangeHandler, mode, onChangeMode} = props;

  // For single file diffs, a file selector is a waste of space.
  if (filePairs.length === 1) {
    return null;
  }

  let selector;
  if (mode === 'list') {
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
      {filePairs.length > 3 ? <FileModeSelector mode={mode} changeHandler={onChangeMode} /> : null}
    </div>
  );
}
