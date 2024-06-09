import React from 'react';
import {ImageFilePair} from './CodeDiffContainer';
import {PerceptualDiffMode} from './DiffView';
import {isSameSizeImagePair} from './utils';

// XXX should this just be a component?

/**
 * Returns a React.DIV which boxes the changed parts of the image pair.
 * scaleDown is in [0, 1], with 1 being full-size
 */
export function makePerceptualBoxDiv(
  pdiffMode: PerceptualDiffMode,
  filePair: ImageFilePair,
  scaleDown: number,
) {
  if (pdiffMode === 'off' || !isSameSizeImagePair(filePair)) {
    return null;
  } else if (pdiffMode === 'bbox') {
    const padding = 5; // try not to obscure anything inside the box
    if (filePair.diffData?.diffBounds) {
      const bbox = filePair.diffData.diffBounds;
      const {top, left, right, bottom, width, height} = bbox;
      if (width === 0 || height === 0) return null;
      const styles = {
        top: Math.floor(scaleDown * (top - padding)),
        left: Math.floor(scaleDown * (left - padding)),
        width: Math.ceil(scaleDown * (right - left + 2 * padding)),
        height: Math.ceil(scaleDown * (bottom - top + 2 * padding)),
      };
      return <div className="perceptual-diff bbox" style={styles} />;
    } else {
      return null;
    }
  } else if (pdiffMode === 'pixels') {
    const styles = {top: 0, left: 0};
    const width = filePair.image_a.width * scaleDown;
    const height = filePair.image_a.height * scaleDown;
    const src = `/pdiff/${filePair.idx}`;
    return (
      <img
        className="perceptual-diff pixels"
        style={styles}
        width={width}
        height={height}
        src={src}
      />
    );
  }
}
