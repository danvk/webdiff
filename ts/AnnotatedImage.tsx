import React from 'react';
import { ImageDiffProps } from './ImageDiff';

export function AnnotatedImage(props: ImageDiffProps) {
  const {side} = props;
  if (!props.filePair[side]) {
    return <span>None</span>;
  }

  var im = props.filePair['image_' + side];
  return (
    <div className={'image-' + side}>
      <SingleImage side={side} {...props} />
      <ImageMetadata image={im} />
    </div>
  );
}
