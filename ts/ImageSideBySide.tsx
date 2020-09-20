import React from "react";
import { AnnotatedImage } from "./AnnotatedImage";
import { ImageDiffProps } from "./ImageDiff";

// Two images placed side-by-side.
export function ImageSideBySide(props: ImageDiffProps) {
  var maxWidth = props.shrinkToFit ? (window.innerWidth - 30) / 2 : null;
  return (
    <table id="imagediff">
      <tr className="image-diff-content">
        <td className="diff-left">
          <AnnotatedImage side="a" maxWidth={maxWidth} {...props} />
        </td>
        <td className="diff-right">
          <AnnotatedImage side="b" maxWidth={maxWidth} {...props} />
        </td>
      </tr>
    </table>
  );
}
