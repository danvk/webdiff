import React from 'react';
import {RouteComponentProps, useHistory} from 'react-router';
import {FilePair} from './CodeDiffContainer';
import {DiffOptions} from './diff-options';
import {DiffView, PerceptualDiffMode} from './DiffView';
import {FileSelector} from './FileSelector';
import {isLegitKeypress} from './file_diff';
import {ImageDiffMode} from './ImageDiffModeSelector';
import {filePairDisplayName} from './utils';
import {DiffOptionsControl} from './DiffOptions';
import {KeyboardShortcuts} from './codediff/KeyboardShortcuts';

declare const pairs: FilePair[];
declare const initialIdx: number;

type Props = RouteComponentProps<{index?: string}>;

const PDIFF_MODES: PerceptualDiffMode[] = ['off', 'bbox', 'pixels'];

// Webdiff application root.
export function Root(props: Props) {
  const [pdiffMode, setPDiffMode] = React.useState<PerceptualDiffMode>('off');
  const [imageDiffMode, setImageDiffMode] = React.useState<ImageDiffMode>('side-by-side');
  const [diffOptions, setDiffOptions] = React.useState<Partial<DiffOptions>>({});
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);

  const history = useHistory();
  const selectIndex = React.useCallback(
    (idx: number) => {
      history.push(`/${idx}`);
    },
    [history],
  );

  const idx = Number(props.match.params.index ?? initialIdx);
  const filePair = pairs[idx];
  React.useEffect(() => {
    document.title = 'Diff: ' + filePairDisplayName(filePair) + ' (' + filePair.type + ')';
  }, [filePair]);

  // TODO: switch to useKey() or some such
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isLegitKeypress(e)) return;
      if (e.code == 'KeyK') {
        if (idx > 0) {
          selectIndex(idx - 1);
        }
      } else if (e.code == 'KeyJ') {
        if (idx < pairs.length - 1) {
          selectIndex(idx + 1);
        }
      } else if (e.code == 'KeyS') {
        setImageDiffMode('side-by-side');
      } else if (e.code == 'KeyB') {
        setImageDiffMode('blink');
      } else if (e.code == 'KeyP') {
        setPDiffMode(mode => PDIFF_MODES[(PDIFF_MODES.indexOf(mode) + 1) % 3]);
      } else if (e.code === 'Slash' && e.shiftKey) {
        setShowKeyboardHelp(val => !val);
      } else if (e.code === 'Escape') {
        setShowKeyboardHelp(false);
      } else if (e.code === 'Period') {
        setShowOptions(val => !val);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [idx, selectIndex]);

  return (
    <div>
      <DiffOptionsControl
        options={diffOptions}
        setOptions={setDiffOptions}
        isVisible={showOptions}
        setIsVisible={setShowOptions}
      />
      <FileSelector selectedFileIndex={idx} filePairs={pairs} fileChangeHandler={selectIndex} />
      {showKeyboardHelp ? (
        <KeyboardShortcuts
          onClose={() => {
            setShowKeyboardHelp(false);
          }}
        />
      ) : null}
      <DiffView
        key={`diff-${idx}`}
        thinFilePair={filePair}
        imageDiffMode={imageDiffMode}
        pdiffMode={pdiffMode}
        diffOptions={diffOptions}
        changeImageDiffModeHandler={setImageDiffMode}
        changePDiffMode={setPDiffMode}
        changeDiffOptions={setDiffOptions}
      />
    </div>
  );
}
