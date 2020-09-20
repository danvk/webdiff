import React from 'react';
import { ImageDiffProps } from './ImageDiff';
import { ImageMetadata } from './ImageMetadata';
import { SingleImage } from './SingleImage';

export function AnnotatedImage(props: ImageDiffProps) {
  const {side} = props;
  if (!props.filePair[side]) {
    return <span>None</span>;
  }

  var im = props.filePair[side === 'a' ? 'image_a' : 'image_b'];
  return (
    <div className={'image-' + side}>
      <SingleImage {...props} />
      <ImageMetadata image={im} />
    </div>
  );
}
