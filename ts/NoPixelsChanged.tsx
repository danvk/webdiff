import React from "react";
import { ImageDiffProps } from "./ImageDiff";

export function NoPixelsChanged({filePair}: ImageDiffProps) {
  if (filePair.are_same_pixels) {
    return <div className="no-changes">(Pixels are identical)</div>;
  } else {
    return null;
  }
}
