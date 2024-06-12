import React from 'react';

import {DiffAlgorithm, DiffOptions, encodeDiffOptions} from './diff-options';
import {PageCover} from './codediff/PageCover';
import {isLegitKeypress} from './file_diff';

export interface Props {
  options: Partial<DiffOptions>;
  setOptions: (newOptions: Partial<DiffOptions>) => void;
  defaultMaxDiffWidth: number;
  maxDiffWidth: number;
  setMaxDiffWidth: (maxDiffWidth: number) => void;
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
}

const gearStyle: React.CSSProperties = {
  position: 'sticky',
  float: 'right',
  marginTop: -10,
  zIndex: 1,
  top: 0,
  border: 0,
  fontSize: 'large',
  background: 'transparent',
  cursor: 'pointer',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  marginTop: -8,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
};

const popupStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 3,
  right: 8,
  border: '1px solid #ddd',
  borderRadius: 4,
  padding: 12,
  marginLeft: 8,
  marginTop: 12,
  background: 'white',
  fontSize: '90%',
  userSelect: 'none',
  boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.5)',
  fontFamily: 'sans-serif',
};

export function DiffOptionsControl(props: Props) {
  const {options, setOptions, isVisible, setIsVisible, maxDiffWidth, setMaxDiffWidth} = props;

  const togglePopup = () => {
    setIsVisible(!isVisible);
  };
  const toggleIgnoreAllSpace = () => {
    setOptions({...options, ignoreAllSpace: !options.ignoreAllSpace});
  };
  const toggleIgnoreSpaceChange = () => {
    setOptions({...options, ignoreSpaceChange: !options.ignoreSpaceChange});
  };
  const toggleFunctionContext = () => {
    setOptions({...options, functionContext: !options.functionContext});
  };
  const setUnifiedContext: React.ChangeEventHandler<HTMLInputElement> = e => {
    setOptions({...options, unified: e.currentTarget.valueAsNumber});
  };
  const changeDiffAlgorithm: React.ChangeEventHandler<HTMLSelectElement> = e => {
    setOptions({...options, diffAlgorithm: e.currentTarget.value as DiffAlgorithm});
  };
  const changeMaxDiffWidth: React.ChangeEventHandler<HTMLInputElement> = e => {
    setMaxDiffWidth(e.currentTarget.valueAsNumber);
  };

  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isLegitKeypress(e)) return;
      if (e.code == 'KeyW') {
        setOptions({...options, ignoreAllSpace: !options.ignoreAllSpace});
      } else if (e.code == 'KeyB') {
        setOptions({...options, ignoreSpaceChange: !options.ignoreSpaceChange});
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [options, setOptions]);

  const diffOptsStr = encodeDiffOptions(options).join(' ');

  return (
    <>
      <button style={gearStyle} onClick={togglePopup}>
        ⚙
      </button>
      {isVisible ? (
        <>
          <PageCover onClick={togglePopup} />
          <div style={popupStyle}>
            <button style={closeButtonStyle} onClick={togglePopup}>
              ✕
            </button>
            <table>
              <tbody>
                <tr>
                  <td style={{textAlign: 'right', verticalAlign: 'top'}} rowSpan={2}>
                    Whitespace:
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!options.ignoreAllSpace}
                      id="ignore-all-space"
                      onChange={toggleIgnoreAllSpace}
                    />{' '}
                    <label htmlFor="ignore-all-space">
                      Ignore All Space (<code>git diff -w</code>)
                    </label>
                  </td>
                </tr>
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!options.ignoreSpaceChange}
                      id="ignore-space-changes"
                      onChange={toggleIgnoreSpaceChange}
                    />{' '}
                    <label htmlFor="ignore-space-changes">
                      Ignore Space Changes (<code>git diff -b</code>)
                    </label>
                  </td>
                </tr>
                <tr>
                  <td style={{textAlign: 'right', verticalAlign: 'top'}} rowSpan={2}>
                    Context:
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={options.unified ?? 8}
                      onChange={setUnifiedContext}
                    />{' '}
                    lines
                  </td>
                </tr>
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!options.functionContext}
                      id="function-context"
                      onChange={toggleFunctionContext}
                    />{' '}
                    <label htmlFor="function-context">
                      Function Context (<code>git diff -W</code>)
                    </label>
                  </td>
                </tr>
                <tr>
                  <td style={{textAlign: 'right'}}>Diff Algorithm:</td>
                  <td>
                    <select value={options.diffAlgorithm ?? 'myers'} onChange={changeDiffAlgorithm}>
                      <option value="myers">Myers (Default)</option>
                      <option value="patience">Patience</option>
                      <option value="minimal">Minimal</option>
                      <option value="histogram">Histogram</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td style={{textAlign: 'right', verticalAlign: 'top'}}>Max line width:</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={maxDiffWidth}
                      onChange={changeMaxDiffWidth}
                    />{' '}
                    lines
                  </td>
                </tr>
              </tbody>
            </table>

            {diffOptsStr ? <pre>git diff {diffOptsStr}</pre> : null}
            {maxDiffWidth !== props.defaultMaxDiffWidth ? (
              <pre>git config webdiff.maxDiffWidth {maxDiffWidth}</pre>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}
