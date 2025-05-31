import React from 'react';
import {FilePair} from '../CodeDiffContainer';
import {guessLanguageUsingFileName} from './language';

export interface NormalizeJSONOptionProps {
  normalizeJSON: boolean;
  setNormalizeJSON: (newNormalizeJSON: boolean) => void;
  filePair: FilePair;
}

export function NormalizeJSONOption(props: NormalizeJSONOptionProps) {
  const {filePair} = props;
  const language = guessLanguageUsingFileName(filePair.a || filePair.b);
  if (language !== 'json') {
    return null;
  }

  const toggleNormalizeJSON = () => {
    props.setNormalizeJSON(!props.normalizeJSON);
  };

  return (
    <>
      <input
        type="checkbox"
        checked={props.normalizeJSON}
        onChange={toggleNormalizeJSON}
        id="normalize-json"
      />{' '}
      <label htmlFor="normalize-json">Normalize JSON (z): indent, sort keys</label>
    </>
  );
}
