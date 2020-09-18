export interface Props {
  mode: 'list' | 'dropdown';
  changeHandler: (mode: 'list' | 'dropdown') => void;
}

/** A widget for toggling between file selection modes. */
export function FileModeSelector(props: Props) {
  const handleChange = () => {
    const newMode = props.mode == 'list' ? 'dropdown' : 'list';
    props.changeHandler(newMode);
  };

  return <div className="file-mode-toggle" onClick={handleChange}>
    <div className="arrow-holder">
      {this.props.mode == 'dropdown' ? '»' : '«'}
    </div>
  </div>;
}
