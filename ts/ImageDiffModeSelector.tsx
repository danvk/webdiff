import React from 'react';
/** React components related to image diffs. */

import {FilePair} from './CodeDiff';
import {isOneSided} from './utils';

export const IMAGE_DIFF_MODES = ['side-by-side', 'blink', 'onion-skin', 'swipe'] as const;
export type ImageDiffMode = typeof IMAGE_DIFF_MODES[number];

export interface Props {
  filePair: FilePair;
  imageDiffMode: ImageDiffMode;
  changeImageDiffModeHandler: (imageDiffMode: ImageDiffMode) => void;
}

/** A widget to toggle between image diff modes (blink or side-by-side). */
export function ImageDiffModeSelector(props: Props) {
  if (isOneSided(props.filePair)) {
    return null; // Only "side-by-side" makes sense for one-sided diffs.
  }

  // Returns the text, optionally wrapped in a link and/or <b> tag.
  var linkOrB = (isLink: boolean, isB: boolean, val: ImageDiffMode, text: string) => {
    var inner = isB ? <b>{text}</b> : text;
    if (isLink) {
      return (
        <a href="#" onClick={() => props.changeImageDiffModeHandler(val)}>
          {inner}
        </a>
      );
    } else {
      return inner;
    }
  };

  const mode = props.imageDiffMode;
  const isBlink = mode == 'blink';
  const isSxS = mode == 'side-by-side';
  const isOnion = mode == 'onion-skin';
  const isSwipe = mode == 'swipe';
  return (
    <span>
      <span className="mode">{linkOrB(!isSxS, isSxS, 'side-by-side', 'Side by Side (s)')}</span>
      <span className="mode">{linkOrB(true, isBlink, 'blink', 'Blink (b)')}</span>
      <span className="mode">{linkOrB(!isOnion, isOnion, 'onion-skin', 'Onion Skin')}</span>
      <span className="mode">{linkOrB(!isSwipe, isSwipe, 'swipe', 'Swipe')}</span>
    </span>
  );
}
