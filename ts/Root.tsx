import React from 'react';
import {useNavigate, useParams} from 'react-router';
import {FilePair} from './CodeDiffContainer';
import {DiffOptions} from './diff-options';
import {DiffView, PerceptualDiffMode} from './DiffView';
import {FileSelector, FileSelectorMode} from './FileSelector';
import {isLegitKeypress} from './file_diff';
import {ImageDiffMode} from './ImageDiffModeSelector';
import {filePairDisplayName} from './utils';
import {DiffOptionsControl} from './DiffOptions';
import {KeyboardShortcuts} from './codediff/KeyboardShortcuts';
import {GitConfig} from './options';

declare const pairs: FilePair[];
declare const initialIdx: number;
declare const GIT_CONFIG: GitConfig;

// Webdiff application root.
export function Root() {
  const [pdiffMode, setPDiffMode] = React.useState<PerceptualDiffMode>('off');
  const [imageDiffMode, setImageDiffMode] = React.useState<ImageDiffMode>('side-by-side');
  const [diffOptions, setDiffOptions] = React.useState<Partial<DiffOptions>>({});
  const [maxDiffWidth, setMaxDiffWidth] = React.useState(GIT_CONFIG.webdiff.maxDiffWidth);
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  // An explicit list is better, unless there are a ton of files.
  const [fileSelectorMode, setFileSelectorMode] = React.useState<FileSelectorMode>(
    pairs.length <= 6 ? 'list' : 'dropdown',
  );

  const navigate = useNavigate();
  const selectIndex = React.useCallback(
    (idx: number) => {
      navigate(`/${idx}`);
    },
    [navigate],
  );

  const params = useParams();
  const idx = Number(params.index ?? initialIdx);
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
      } else if (e.code == 'KeyV') {
        setFileSelectorMode(mode => (mode === 'dropdown' ? 'list' : 'dropdown'));
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

  const inlineStyle = `
  td.code {
    width: ${1 + maxDiffWidth}ch;
  }`;

  return (
    <>
      <style>{inlineStyle}</style>
      <div>
        <DiffOptionsControl
          options={diffOptions}
          setOptions={setDiffOptions}
          maxDiffWidth={maxDiffWidth}
          setMaxDiffWidth={setMaxDiffWidth}
          defaultMaxDiffWidth={GIT_CONFIG.webdiff.maxDiffWidth}
          isVisible={showOptions}
          setIsVisible={setShowOptions}
        />
        <FileSelector
          selectedFileIndex={idx}
          filePairs={pairs}
          fileChangeHandler={selectIndex}
          mode={fileSelectorMode}
          onChangeMode={setFileSelectorMode}
        />
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
          changeImageDiffMode={setImageDiffMode}
          changePDiffMode={setPDiffMode}
          changeDiffOptions={setDiffOptions}
        />
      </div>
    </>
  );
}
