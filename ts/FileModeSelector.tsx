import React from 'react';
import {FileSelectorMode} from './FileSelector';

export interface Props {
  mode: FileSelectorMode;
  changeHandler: (mode: FileSelectorMode) => void;
}

/** A widget for toggling between file selection modes. */
export function FileModeSelector(props: Props) {
  const handleChange = () => {
    const newMode = props.mode == 'list' ? 'dropdown' : 'list';
    props.changeHandler(newMode);
  };

  return (
    <div className="file-mode-toggle" onClick={handleChange}>
      <div className="arrow-holder">{props.mode == 'dropdown' ? '»' : '«'}</div>
    </div>
  );
}
