import _ from 'lodash';
import React from "react";
import { ImageDiffProps } from "./ImageDiff";

export function SingleImage(props: ImageDiffProps) {
  var {filePair, side} = filePair;
  if (!filePair[side]) {
    return null; // or: return empty <img> same size as other image?
  }

  const url = side == "a" ? "/a/image/" + filePair.a : "/b/image/" + filePair.b;
  const im = _.clone(filePair["image_" + side]);
  let scaleDown = 1.0;
  const {maxWidth} = props;
  if (maxWidth !== null && maxWidth < im.width) {
    scaleDown = maxWidth / im.width;
    im.width *= scaleDown;
    im.height *= scaleDown;
  }
  const diffBoxDiv = makePerceptualBoxDiv(
    props.pdiffMode,
    filePair,
    scaleDown
  );

  return (
    <div className="image-holder">
      {diffBoxDiv}
      <img
        className={"side-" + side}
        src={url}
        width={im.width}
        height={im.height}
      />
    </div>
  );
}
