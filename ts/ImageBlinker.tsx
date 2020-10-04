import React from 'react';
import {AnnotatedImage} from './AnnotatedImage';
import {isLegitKeypress} from './file_diff';
import {ImageDiffProps} from './ImageDiff';

/**
 * Two images on top of one another (i.e. "blinked").
 * This component handles toggling between the two images itself.
 */
export function ImageBlinker(props: ImageDiffProps) {
  const [idx, setIdx] = React.useState(0);
  const [autoBlink, setAutoBlink] = React.useState(true);

  const autoblinkRef = React.createRef<HTMLInputElement>();

  const toggleAutoBlink = () => {
    if (autoblinkRef.current) {
      setAutoBlink(autoblinkRef.current.checked);
    }
  };

  const blink = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isLegitKeypress(e)) {
        return;
      }
      if (e.key === 'b') {
        setAutoBlink(false);
        setIdx(idx => 1 - idx);
      }
    },
    [setIdx, setAutoBlink],
  );

  // XXX old version also sets this on a[value="blink"], what is that?
  React.useEffect(() => {
    document.addEventListener('keydown', blink);
    return () => {
      document.removeEventListener('keydown', blink);
    };
  }, [blink]);

  React.useEffect(() => {
    if (autoBlink) {
      const interval = setInterval(() => setIdx(idx => 1 - idx), 500 /* ms */);
      return () => clearInterval(interval);
    }
  }, [autoBlink, setIdx]);

  const side = idx === 0 ? 'a' : 'b';
  const maxWidth = props.shrinkToFit ? window.innerWidth - 30 : null;
  return (
    <div>
      <input
        ref={autoblinkRef}
        type="checkbox"
        id="autoblink"
        checked={autoBlink}
        onChange={toggleAutoBlink}
      />
      <label htmlFor="autoblink"> Auto-blink (hit ‘b’ to blink manually)</label>
      <table id="imagediff">
        <tbody>
          <tr className="image-diff-content">
            <td>
              <AnnotatedImage side={side} maxWidth={maxWidth} {...props} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
