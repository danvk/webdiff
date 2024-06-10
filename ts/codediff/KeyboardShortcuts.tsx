import React from 'react';
import {PageCover} from './PageCover';

export interface KeyboardShortcutsProps {
  onClose: () => void;
}

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  marginTop: -8,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
};

const popupStyle: React.CSSProperties = {
  zIndex: 3,
  position: 'absolute',
  border: '1px solid #ddd',
  borderRadius: 4,
  paddingTop: 12,
  paddingBottom: 0,
  paddingLeft: 18,
  paddingRight: 18,
  background: 'white',
  userSelect: 'none',
  boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.5)',
  fontFamily: 'sans-serif',
};

const popupContainerStyle: React.CSSProperties = {
  zIndex: 3,
  display: 'flex' /* establish flex container */,
  flexDirection: 'column' /* make main axis vertical */,
  justifyContent: 'center' /* center items vertically, in this case */,
  alignItems: 'center' /* center items horizontally, in this case */,
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export function KeyboardShortcuts(props: KeyboardShortcutsProps) {
  return (
    <>
      <PageCover onClick={props.onClose} />
      <div style={popupContainerStyle}>
        <div style={popupStyle} className="keyboard-shortcuts">
          <button style={closeButtonStyle} onClick={props.onClose}>
            ✕
          </button>
          <p className="header">Webdiff Keyboard Shortcuts</p>
          <ul>
            <li>
              <kbd>j</kbd> Next File
            </li>
            <li>
              <kbd>k</kbd> Previous File
            </li>
            <li>
              <kbd>n</kbd> Next Diffhunk
            </li>
            <li>
              <kbd>p</kbd> Previous Diffhunk
            </li>
            <li>
              <kbd>.</kbd> Show diff options
            </li>
            <li>
              <kbd>?</kbd> Show this panel
            </li>
          </ul>
          <p className="header">Image Diff Keyboard Shortcuts</p>
          <ul>
            <li>
              <kbd>s</kbd> Side-by-Side (image diff)
            </li>
            <li>
              <kbd>b</kbd> Blink (image diff)
            </li>
            <li>
              <kbd>p</kbd> Cycle perceptual diff mode (image diff)
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
