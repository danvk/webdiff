import React from 'react';

const pageCoverStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 3,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export interface PageCoverProps {
  onClick: () => void;
}

export function PageCover(props: PageCoverProps) {
  return <div style={pageCoverStyle} onClick={props.onClick}></div>;
}
