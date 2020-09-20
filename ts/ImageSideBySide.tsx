import { ImageDiffData } from "./CodeDiff";
import { ImageDiffProps } from "./ImageDiff";

export interface Props extends ImageDiffProps {
  shrinkToFit: number;
}

// Two images placed side-by-side.
export function ImageSideBySide(props: Props) {
  var maxWidth = props.shrinkToFit ? (window.innerWidth - 30) / 2 : null;
  return (
    <table id="imagediff">
      <tr className="image-diff-content">
        <td className="diff-left">
          <AnnotatedImage side="a" maxWidth={maxWidth} {...this.props} />
        </td>
        <td className="diff-right">
          <AnnotatedImage side="b" maxWidth={maxWidth} {...this.props} />
        </td>
      </tr>
    </table>
  );
}
