import React from 'react';

import { DiffBox, FilePair } from "./CodeDiff"
import { PerceptualDiffMode } from "./DiffView"
import {ImageDiffMode, ImageDiffModeSelector} from './ImageDiffModeSelector';
import {NoChanges} from './CodeDiff';
import { isOneSided, isSameSizeImagePair } from './utils';
import { ImageSideBySide } from './ImageSideBySide';
import { ImageBlinker } from './ImageBlinker';
import { ImageOnionSkin, ImageSwipe } from './ImageSwipe';

declare const HAS_IMAGE_MAGICK: boolean;

export interface Props {
  filePair: FilePair;
  imageDiffMode: ImageDiffMode;
  pdiffMode: PerceptualDiffMode;
  changeImageDiffModeHandler: (mode: ImageDiffMode) => void;
  changePDiffMode: (pdiffMode: PerceptualDiffMode) => void;
}

export interface ImageDiffProps {
  filePair: FilePair;
  pdiffMode: PerceptualDiffMode;
  shrinkToFit: boolean;
}

/** A diff between two images. */
export function ImageDiff(props: Props) {
  const [shrinkToFit, setShrinkToFit] = React.useState(true);

  const toggleShrinkToFit: React.ChangeEventHandler<HTMLInputElement> = e => {
    setShrinkToFit(e.target.checked);
  };

  let mode = props.imageDiffMode;
  let pair = props.filePair;
  if (isOneSided(pair)) {
    mode = 'side-by-side';  // Only one that makes sense for one-sided diffs.
  }

  const computePerceptualDiffBox = (fp: FilePair) => {
    if (!isSameSizeImagePair(fp)) return;
    // TODO(danvk): restructure this, it's a mess
    (async () => {
      const response = await fetch(`/pdiffbbox/${fp.idx}`);
      const bbox = await response.json() as DiffBox;
      const {diffData} = fp;
      // XXX are there other fields?
      fp.diffData = {
        ...(diffData || {}),
        diffBounds: bbox,
      };
      forceUpdate(0);  // tell react about this change
    })().catch(error => {
      console.error(error);
    })
  };

  if (props.pdiffMode === 'bbox' && !pair.diffData) {
    // XXX this might shoot off unnecessary XHRs--use a Promise!
    computePerceptualDiffBox(pair);
  }

  const [, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    const handleResize = () => {
      if (shrinkToFit) forceUpdate(0);
    };
    const listener = window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [shrinkToFit]);

  const component = {
    'side-by-side': ImageSideBySide,
    'blink': ImageBlinker,
    'onion-skin': ImageOnionSkin,
    'swipe': ImageSwipe
  }[mode];
  var image = React.createElement(component, {
    filePair: pair,
    shrinkToFit,
    pdiffMode: props.pdiffMode
  });
  var diffBoxEnabled = isSameSizeImagePair(pair);
  var boxClasses = diffBoxEnabled ? '' : 'diff-box-disabled';
  var boxStyles = { display: HAS_IMAGE_MAGICK ? '' : 'none' };
  var imageMagickCallout = !HAS_IMAGE_MAGICK ? (
      <span className="magick">Install{' '}
      <a href="http://www.imagemagick.org/script/binary-releases.php">ImageMagick</a>{' '}
      to see perceptual diffs</span>
  ) : null;

  return (
  <div>
    <div className="image-diff-controls">
      <ImageDiffModeSelector {...props} />
      <input type="checkbox" id="shrink-to-fit" checked={shrinkToFit} onChange={toggleShrinkToFit} />
      <label htmlFor="shrink-to-fit"> Shrink to fit</label>
      &nbsp;
      <span className="pdiff-options">
        <span className={boxClasses} style={boxStyles}>
          Perceptual Diff:&nbsp;
          <input type="radio" name="pdiff-mode"
                 id="pdiff-off"
                 checked={props.pdiffMode === 'off'}
                 disabled={!diffBoxEnabled}
                 onChange={() => props.changePDiffMode('off')} />
          <label htmlFor="pdiff-off"> None</label>
          &nbsp;
          <input type="radio" name="pdiff-mode"
                 id="pdiff-bbox"
                 checked={props.pdiffMode === 'bbox'}
                 disabled={!diffBoxEnabled}
                 onChange={() => props.changePDiffMode('bbox')} />
          <label htmlFor="pdiff-bbox"> Box</label>
          &nbsp;
          <input type="radio" name="pdiff-mode"
                 id="pdiff-pixels"
                 checked={props.pdiffMode === 'pixels'}
                 disabled={!diffBoxEnabled}
                 onChange={() => props.changePDiffMode('pixels')} />
          <label htmlFor="pdiff-pixels"> Differing Pixels</label>
        </span>
        {imageMagickCallout}
      </span>
    </div>
    <div className={'image-diff ' + mode}>
      <NoChanges filePair={props.filePair} />
      {image}
    </div>
  </div>
  );
}
