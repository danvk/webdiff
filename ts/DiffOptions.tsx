import React from 'react';

import { DiffAlgorithm, DiffOptions, encodeDiffOptions, decodeDiffOptions } from './diff-options';

export interface Props {
  options: Partial<DiffOptions>;
  setOptions: (newOptions: Partial<DiffOptions>) => void;
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

const pageCoverStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

const popupStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 2,
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
  const {options, setOptions} = props;
  const [isPopupVisible, setIsPopupVisible] = React.useState(false);

  const togglePopup = () => setIsPopupVisible(oldVal => !oldVal);
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

  const diffOptsStr = encodeDiffOptions(options).join(' ');

  return (
    <>
      <button style={gearStyle} onClick={togglePopup}>
        ⚙
      </button>
      {isPopupVisible ? (
        <>
          <div style={pageCoverStyle} onClick={togglePopup}></div>
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
                  Context:</td>
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
              </tbody>
            </table>

            <p>
              <code>git diff {diffOptsStr}</code>
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}
