import React from 'react';
import {ImageFile} from './CodeDiff';

export interface Props {
  image: ImageFile;
}

export function ImageMetadata({image}: Props) {
  const {width, height, num_bytes} = image;
  return (
    <p className="image-props">
      {width}x{height} pixels
      <br />({num_bytes.toLocaleString()} bytes)
    </p>
  );
}
