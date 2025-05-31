import React from 'react';
import {useNavigate, useParams} from 'react-router';
import {useSearchParams} from 'react-router-dom';
import {FilePair} from './CodeDiffContainer';
import {decodeDiffOptions, DiffOptions, encodeDiffOptions} from './diff-options';
import {DiffView, PerceptualDiffMode} from './DiffView';
import {FileSelector, FileSelectorMode} from './FileSelector';
import {isLegitKeypress} from './file_diff';
import {ImageDiffMode} from './ImageDiffModeSelector';
import {filePairDisplayName} from './utils';
import {DiffOptionsControl} from './DiffOptions';
import {KeyboardShortcuts} from './codediff/KeyboardShortcuts';
import {GitConfig} from './options';
import {NormalizeJSONOption} from './codediff/NormalizeJSONOption';

declare const pairs: FilePair[];
declare const initialIdx: number;
declare const GIT_CONFIG: GitConfig;

interface CombinedOptions extends DiffOptions {
  maxDiffWidth: number;
  normalizeJSON?: boolean;
}

function parseOptions(query: URLSearchParams): Partial<CombinedOptions> {
  const flags = query.getAll('flag');
  const diffOptions = decodeDiffOptions(flags);
  const maxWidthStr = query.get('width');
  const maxDiffWidth = maxWidthStr ? {maxDiffWidth: Number(maxWidthStr)} : undefined;
  const normalizeJsonStr = query.get('normalize_json');
  const normalizeJSON = normalizeJsonStr ? {normalizeJSON: true} : undefined;
  return {...diffOptions, ...maxDiffWidth, ...normalizeJSON};
}

function encodeOptions(
  diffOptions: Partial<DiffOptions>,
  maxDiffWidth: number,
  normalizeJSON: boolean,
) {
  const flags = encodeDiffOptions(diffOptions);
  const params = new URLSearchParams(flags.map(f => ['flag', f]));
  if (maxDiffWidth !== GIT_CONFIG.webdiff.maxDiffWidth) {
    params.set('width', String(maxDiffWidth));
  }
  if (normalizeJSON) {
    params.set('normalize_json', '1');
  }
  return params;
}

// Webdiff application root.
export function Root() {
  const [pdiffMode, setPDiffMode] = React.useState<PerceptualDiffMode>('off');
  const [imageDiffMode, setImageDiffMode] = React.useState<ImageDiffMode>('side-by-side');
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);

  // An explicit list is better, unless there are a ton of files.
  const [fileSelectorMode, setFileSelectorMode] = React.useState<FileSelectorMode>(
    pairs.length <= 6 ? 'list' : 'dropdown',
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectIndex = React.useCallback(
    (idx: number) => {
      const search = searchParams.toString();
      const url = `/${idx}` + (search ? `?${search}` : '');
      navigate(url);
    },
    [navigate, searchParams],
  );

  const params = useParams();
  const idx = Number(params.index ?? initialIdx);
  const filePair = pairs[idx];
  React.useEffect(() => {
    const fileName = filePairDisplayName(filePair);
    const diffType = filePair.type;
    document.title = `Diff: ${fileName} (${diffType})`;
  }, [filePair]);

  const options = React.useMemo(() => parseOptions(searchParams), [searchParams]);
  const maxDiffWidth = options.maxDiffWidth ?? GIT_CONFIG.webdiff.maxDiffWidth;
  const normalizeJSON = !!options.normalizeJSON;

  const setDiffOptions = React.useCallback(
    (newOptions: Partial<DiffOptions>) => {
      setSearchParams(encodeOptions(newOptions, maxDiffWidth, normalizeJSON));
    },
    [maxDiffWidth, setSearchParams, normalizeJSON],
  );

  const setMaxDiffWidth = React.useCallback(
    (newMaxWidth: number) => {
      setSearchParams(encodeOptions(options, newMaxWidth, normalizeJSON));
    },
    [options, setSearchParams, normalizeJSON],
  );

  const setNormalizeJSON = React.useCallback(
    (newNormalizeJSON?: boolean) => {
      if (newNormalizeJSON === undefined) {
        newNormalizeJSON = !options.normalizeJSON;
      }
      setSearchParams(encodeOptions(options, maxDiffWidth, newNormalizeJSON));
    },
    [options, setSearchParams, maxDiffWidth],
  );

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
      } else if (e.code === 'KeyZ') {
        setNormalizeJSON();  // toggles
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [idx, selectIndex, setNormalizeJSON]);

  const inlineStyle = `
  td.code {
    width: ${1 + maxDiffWidth}ch;
  }`;

  return (
    <>
      <style>{inlineStyle}</style>
      <div>
        <DiffOptionsControl
          options={options}
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
        <NormalizeJSONOption
          normalizeJSON={normalizeJSON}
          setNormalizeJSON={setNormalizeJSON}
          filePair={filePair}
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
          diffOptions={options}
          changeImageDiffMode={setImageDiffMode}
          changePDiffMode={setPDiffMode}
          changeDiffOptions={setDiffOptions}
          normalizeJSON={normalizeJSON}
        />
      </div>
    </>
  );
}
