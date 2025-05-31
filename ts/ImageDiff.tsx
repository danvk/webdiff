import React from 'react';

import {DiffBox, ImageFilePair} from './CodeDiffContainer';
import {PerceptualDiffMode} from './DiffView';
import {ImageDiffMode, ImageDiffModeSelector} from './ImageDiffModeSelector';
import {NoChanges} from './CodeDiffContainer';
import {isOneSided, isSameSizeImagePair} from './utils';
import {ImageSideBySide} from './ImageSideBySide';
import {ImageBlinker} from './ImageBlinker';
import {ImageOnionSkin, ImageSwipe} from './ImageSwipe';
import {isLegitKeypress} from './file_diff';

declare const HAS_IMAGE_MAGICK: boolean;

export interface Props {
  filePair: ImageFilePair;
  imageDiffMode: ImageDiffMode;
  pdiffMode: PerceptualDiffMode;
  changeImageDiffMode: (mode: ImageDiffMode) => void;
  changePDiffMode: React.Dispatch<React.SetStateAction<PerceptualDiffMode>>;
}

export interface ImageDiffProps {
  filePair: ImageFilePair;
  pdiffMode: PerceptualDiffMode;
  shrinkToFit: boolean;
}

const PDIFF_MODES: PerceptualDiffMode[] = ['off', 'bbox', 'pixels'];

/** A diff between two images. */
export function ImageDiff(props: Props) {
  const [shrinkToFit, setShrinkToFit] = React.useState(true);

  const toggleShrinkToFit: React.ChangeEventHandler<HTMLInputElement> = e => {
    setShrinkToFit(e.target.checked);
  };

  const {changePDiffMode, pdiffMode, changeImageDiffMode} = props;
  let {imageDiffMode} = props;
  const pair = props.filePair;
  if (isOneSided(pair)) {
    imageDiffMode = 'side-by-side'; // Only one that makes sense for one-sided diffs.
  }

  const [, forceUpdate] = React.useState(0);
  const computePerceptualDiffBox = (fp: ImageFilePair) => {
    if (!isSameSizeImagePair(fp)) return;
    // TODO(danvk): restructure this, it's a mess
    (async () => {
      const response = await fetch(`/pdiffbbox/${fp.idx}`);
      const bbox = (await response.json()) as DiffBox;
      const {diffData} = fp;
      // XXX are there other fields?
      fp.diffData = {
        ...diffData,
        diffBounds: bbox,
      };
      console.log('forcing update');
      forceUpdate(n => n + 1); // tell react about this change
    })().catch((error: unknown) => {
      console.error(error);
    });
  };

  if (pdiffMode === 'bbox' && !pair.diffData) {
    // XXX this might shoot off unnecessary XHRs--use a Promise!
    computePerceptualDiffBox(pair);
  }

  React.useEffect(() => {
    const handleResize = () => {
      if (shrinkToFit) forceUpdate(n => n + 1);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [shrinkToFit, forceUpdate]);

  // TODO: switch to useKey() or some such
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isLegitKeypress(e)) return;
      if (e.code == 'KeyS') {
        changeImageDiffMode('side-by-side');
      } else if (e.code == 'KeyB') {
        changeImageDiffMode('blink');
      } else if (e.code == 'KeyP') {
        changePDiffMode(mode => PDIFF_MODES[(PDIFF_MODES.indexOf(mode) + 1) % 3]);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [changeImageDiffMode, changePDiffMode]);

  const component = {
    'side-by-side': ImageSideBySide,
    blink: ImageBlinker,
    'onion-skin': ImageOnionSkin,
    swipe: ImageSwipe,
  }[imageDiffMode];
  const image = React.createElement(component, {
    filePair: pair,
    shrinkToFit,
    pdiffMode,
  });
  const diffBoxEnabled = isSameSizeImagePair(pair);
  const boxClasses = diffBoxEnabled ? '' : 'diff-box-disabled';
  const boxStyles = {display: HAS_IMAGE_MAGICK ? '' : 'none'};
  const imageMagickCallout = !HAS_IMAGE_MAGICK ? (
    <span className="magick">
      Install <a href="http://www.imagemagick.org/script/binary-releases.php">ImageMagick</a> to see
      perceptual diffs
    </span>
  ) : null;

  return (
    <div>
      <div className="diff-mode-controls">
        <ImageDiffModeSelector {...props} />
        <input
          type="checkbox"
          id="shrink-to-fit"
          checked={shrinkToFit}
          onChange={toggleShrinkToFit}
        />
        <label htmlFor="shrink-to-fit"> Shrink to fit</label>
        &nbsp;
        <span className="pdiff-options">
          <span className={boxClasses} style={boxStyles}>
            Perceptual Diff:&nbsp;
            <input
              type="radio"
              name="pdiff-mode"
              id="pdiff-off"
              checked={pdiffMode === 'off'}
              disabled={!diffBoxEnabled}
              onChange={() => {
                changePDiffMode('off');
              }}
            />
            <label htmlFor="pdiff-off"> None</label>
            &nbsp;
            <input
              type="radio"
              name="pdiff-mode"
              id="pdiff-bbox"
              checked={pdiffMode === 'bbox'}
              disabled={!diffBoxEnabled}
              onChange={() => {
                changePDiffMode('bbox');
              }}
            />
            <label htmlFor="pdiff-bbox"> Box</label>
            &nbsp;
            <input
              type="radio"
              name="pdiff-mode"
              id="pdiff-pixels"
              checked={pdiffMode === 'pixels'}
              disabled={!diffBoxEnabled}
              onChange={() => {
                changePDiffMode('pixels');
              }}
            />
            <label htmlFor="pdiff-pixels"> Differing Pixels</label>
          </span>
          {imageMagickCallout}
        </span>
      </div>
      <div className={'image-diff ' + imageDiffMode}>
        <NoChanges filePair={props.filePair} />
        {image}
      </div>
    </div>
  );
}
