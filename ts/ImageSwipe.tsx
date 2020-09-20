import _ from "lodash";
import React from "react";
import { FilePair } from "./CodeDiff";
import { ImageMetadata } from "./ImageMetadata";
import { makePerceptualBoxDiv } from "./image_utils";

export interface ImageOnionSkinProps {
  filePair: FilePair;
  shrinkToFit: boolean;
  showPerceptualDiffBox: boolean;
}

export interface ImageSwipeProps extends ImageOnionSkinProps {
  mode?: "swipe" | "onion-skin";
}

// Two images on top of one another with a cross-fader
export function ImageOnionSkin(props: ImageOnionSkinProps) {
  return <ImageSwipe {...props} mode="onion-skin" />;
}

// Two images on top of one another with a slider to move the divider from left
// to right.
export function ImageSwipe(props: ImageSwipeProps) {
  const mode = props.mode || "swipe";
  const [rangePosition, setRangePosition] = React.useState(null);
  const sliderRef = React.createRef<HTMLInputElement>();
  const onSlide = () => {
    setRangePosition(Number(sliderRef.current.value));
  };

  const pair = props.filePair;
  const imA = _.clone(pair.image_a);
  const imB = _.clone(pair.image_b);
  let containerWidth = Math.max(imA.width, imB.width);
  const rangeMax = containerWidth;
  const pct = 100.0 * ((rangePosition ?? rangeMax / 2) / rangeMax);
  const frac = pct / 100.0;
  if (this.props.shrinkToFit) {
    var scaleDown = Math.min(1.0, (window.innerWidth - 30) / containerWidth);
    imA.width *= scaleDown;
    imA.height *= scaleDown;
    imB.width *= scaleDown;
    imB.height *= scaleDown;
    containerWidth = Math.max(imA.width, imB.width);
  }
  var diffBoxDiv = makePerceptualBoxDiv(this.props.pdiffMode, pair, scaleDown);
  const styleA = {};
  const styleB = {};
  const styleContainer = {
    width: containerWidth + "px",
    height: Math.max(imA.height, imB.height) + "px",
  };
  const urlA = "/a/image/" + pair.a;
  const urlB = "/b/image/" + pair.b;
  _.extend(styleA, {
    backgroundImage: "url(" + urlA + ")",
    backgroundSize: imA.width + "px " + imA.height + "px",
    width: imA.width + "px",
    height: imA.height + "px",
  });
  _.extend(styleB, {
    backgroundImage: "url(" + urlB + ")",
    backgroundSize: imB.width + "px " + imB.height + "px",
    width: imB.width + "px",
    height: imB.height + "px",
  });
  if (props.mode == "swipe") {
    _.extend(styleA, {
      width: Math.floor(frac * imA.width) + "px",
    });
    _.extend(styleB, {
      left: Math.floor(frac * imB.width) + "px",
      width: null,
      right: containerWidth - imB.width + "px",
      backgroundPosition: -Math.floor(frac * imB.width) + "px top",
    });
  } else {
    _.extend(styleB, { opacity: frac });
  }

  // Add an opaque grid under each image to expose transparency.
  [styleA, styleB].forEach(function (o) {
    o["backgroundImage"] += ", url(/static/img/trans_bg.gif)";
    if (_.has(o, "backgroundSize")) {
      o["backgroundSize"] += ", auto auto";
    }
  });

  return (
    <div>
      <div className="range-holder">
        <input
          type="range"
          min="0"
          max={rangeMax}
          defaultValue={rangeMax / 2}
          ref="slider"
          onChange={this.onSlide}
        />
      </div>
      <div className="overlapping-images" style={styleContainer}>
        <div style={styleA} className="side-a" />
        <div style={styleB} className="side-b" />
        {diffBoxDiv}
      </div>
      <div className="overlapping-images-metadata">
        <ImageMetadata image={pair.image_a} />
        <ImageMetadata image={pair.image_b} />
      </div>
    </div>
  );
}
