/** @jsx React.DOM */

// Webdiff application root.
var Root = React.createClass({
  propTypes: {
    filePairs: React.PropTypes.array.isRequired
  },
  getInitialState: function() {
    return {
      selectedFileIndex: 0,
      imageDiffMode: 'side-by-side'
    };
  },
  fileChangeHandler: function(idx) {
    this.setState({selectedFileIndex: idx});
  },
  changeImageDiffModeHandler: function(mode) {
    this.setState({imageDiffMode: mode});
  },
  render: function() {
    var filePair = this.props.filePairs[this.state.selectedFileIndex];

    return <div>
       <FileSelector selectedFileIndex={this.state.selectedFileIndex}
                     filePairs={this.props.filePairs}
                     fileChangeHandler={this.fileChangeHandler} />
       <DiffView filePair={filePair}
                 imageDiffMode={this.state.imageDiffMode}
                 changeImageDiffModeHandler={this.changeImageDiffModeHandler} />
    </div>
  },
  componentDidMount: function() {
    $(document).on('keydown', function(e) {
      if (!isLegitKeypress(e)) return;
      var idx = this.state.selectedFileIndex;
      if (e.keyCode == 75) {  // j
        if (idx > 0) {
          this.setState({selectedFileIndex: idx - 1});
        }
      } else if (e.keyCode == 74) {  // k
        if (idx < this.props.filePairs.length - 1) {
          this.setState({selectedFileIndex: idx + 1});
        }
      } else if (e.keyCode == 83) {  // s
        this.setState({imageDiffMode: 'side-by-side'});
      } else if (e.keyCode == 66) {  // b
        this.setState({imageDiffMode: 'blink'});
      }
    }.bind(this));
  }
});

// Shows a list of files in one of two possible modes (list or dropdown).
var FileSelector = React.createClass({
  propTypes: {
    filePairs: React.PropTypes.array.isRequired,
    selectedFileIndex: React.PropTypes.number.isRequired,
    fileChangeHandler: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    return {mode: 'list'};
  },
  render: function() {
    var selector;
    if (this.state.mode == 'list') {
      selector = <FileList filePairs={this.props.filePairs}
                           selectedIndex={this.props.selectedFileIndex}
                           fileChangeHandler={this.props.fileChangeHandler} />;
    } else {
      selector = <FileDropdown filePairs={this.props.filePairs}
                               selectedIndex={this.props.selectedFileIndex}
                               fileChangeHandler={this.props.fileChangeHandler} />;
    }

    return <div className="file-selector">
      {selector}
      <FileModeSelector mode={this.state.mode}
                        changeHandler={this.changeSelectionModeHandler} />
    </div>
  },
  changeSelectionModeHandler: function(mode) {
    this.setState({mode: mode});
  }
});

// A widget for toggling between file selection modes.
var FileModeSelector = React.createClass({
  propTypes: {
    mode: React.PropTypes.oneOf(['list', 'dropdown']).isRequired,
    changeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    return <div className="file-mode-toggle" onClick={this.changeHandler}>
      <div className="arrow-holder">
        {this.props.mode == 'dropdown' ? '»' : '«'}
      </div>
    </div>
  },
  changeHandler: function(e) {
    var newMode = this.props.mode == 'list' ? 'dropdown' : 'list';
    this.props.changeHandler(newMode);
  }
});

// A list of all the files. Clicking a non-selected file selects it.
// This view is simpler and generally preferable for short lists of files.
var FileList = React.createClass({
  propTypes: {
    filePairs: React.PropTypes.array.isRequired,
    selectedIndex: React.PropTypes.number.isRequired,
    fileChangeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    var props = this.props;
    var lis = this.props.filePairs.map(function(file_pair, idx) {
      var content;
      if (idx != props.selectedIndex) {
        content = <a data-idx={idx} onClick={this.clickHandler} href='#'>
          {file_pair.path}</a>;
      } else {
        content = <b>{file_pair.path}</b>
      }
      return <li key={idx}>{content}</li>
    }.bind(this));
    return <ul className="file-list">{lis}</ul>
  },
  clickHandler: function(e) {
    this.props.fileChangeHandler(parseInt($(e.target).attr('data-idx'), 10));
  }
});

// A list of files in a dropdown menu. This is more compact with many files.
var FileDropdown = React.createClass({
  propTypes: {
    filePairs: React.PropTypes.array.isRequired,
    selectedIndex: React.PropTypes.number.isRequired,
    fileChangeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    var props = this.props;

    var linkOrNone = function(idx) {
      if (idx < 0 || idx >= props.filePairs.length) {
        return <i>none</i>;
      } else {
        return <a href='#' data-idx={idx} onClick={this.handleLinkClick}>
          {props.filePairs[idx].path}
        </a>;
      }
    }.bind(this);

    var prevLink = linkOrNone(props.selectedIndex - 1);
    var nextLink = linkOrNone(props.selectedIndex + 1);

    var options = this.props.filePairs.map(function(file_pair, idx) {
      return <option key={idx} value={idx}>
        {file_pair.path} ({file_pair.type})
      </option>;
    });
    return <div className="file-dropdown">
      Prev (k): {prevLink}<br/>
      <select value={props.selectedIndex}
              onChange={this.handleDropdownChange}>{options}</select><br/>
      Next (j): {nextLink}
    </div>
  },
  handleDropdownChange: function(e) {
    this.props.fileChangeHandler(parseInt($(e.target).val(), 10));
  },
  handleLinkClick: function(e) {
    this.props.fileChangeHandler(parseInt($(e.target).attr('data-idx'), 10));
  }
});

// A widget to toggle between image diff modes (blink or side-by-side).
var ImageDiffModeSelector = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    mode: React.PropTypes.oneOf(['side-by-side', 'blink']).isRequired,
    changeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    if (!this.props.filePair.is_image_diff) {
      return <span/>;  // have to return something.
    }

    // Returns the text, optionally wrapped in a link and/or <b> tag.
    var linkOrB = function(isLink, isB, val, text) {
      var inner = isB ? <b>{text}</b> : text;
      if (isLink) {
        return <a href='#' onClick={this.handleClick} value={val}>{inner}</a>
      } else {
        return inner;
      }
    }.bind(this);

    var isBlink = this.props.mode == 'blink';
    return <div>Image diff mode:&nbsp;
      {linkOrB(isBlink, !isBlink, 'side-by-side', 'Side by Side (s)')}
      &nbsp;|&nbsp;
      {linkOrB(true, isBlink, 'blink', 'Blink (b)')}
    </div>
  },
  handleClick: function(e) {
    this.props.changeHandler($(e.target).attr('value'));
  }
});

// A diff for a single pair of files (left/right).
var DiffView = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    imageDiffMode: React.PropTypes.oneOf(['side-by-side', 'blink']).isRequired,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    if (this.props.filePair.is_image_diff) {
      return <ImageDiff mode={this.props.imageDiffMode}
                        filePair={this.props.filePair}
                        changeImageDiffModeHandler={this.props.changeImageDiffModeHandler} />
    } else {
      return <CodeDiff filePair={this.props.filePair} />
    }
  }
});

// A side-by-side diff of source code.
var CodeDiff = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  render: function() {
    return <div key={this.props.filePair.idx}>Loading&hellip;</div>
  },
  renderDiff: function() {
    // Do XHRs for the contents of both sides and fill in the diff.
    var pair = this.props.filePair;
    var beforeDeferred = getOrNull('a', pair.a);
    var afterDeferred = getOrNull('b', pair.b);

    var self = this;
    $.when(beforeDeferred, afterDeferred).done(function(before, after) {
      if (!self.isMounted()) return;
      // Call out to codediff.js to construct the side-by-side diff.
      $(self.getDOMNode()).empty().append(
          renderDiff(pair.a, pair.b, before[0], after[0]));
    }).fail(function(e) {
      alert("Unable to get diff!");
    });
  },
  componentDidMount: function() {
    this.renderDiff();  // Called on initial display of this component.
  },
  componentDidUpdate: function() {
    this.componentDidMount();  // Called on updates.
  }
});

// A diff between two images.
var ImageDiff = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    mode: React.PropTypes.oneOf(['side-by-side', 'blink']).isRequired,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    var image = this.props.mode == 'side-by-side' ?
      <ImageSideBySide filePair={this.props.filePair} /> :
      <ImageBlinker filePair={this.props.filePair} />;

    return <div>
      <ImageDiffModeSelector filePair={this.props.filePair}
                             mode={this.props.mode}
                             changeHandler={this.props.changeImageDiffModeHandler}/>
      {image}
    </div>
  }
});

// Two images placed side-by-side.
var ImageSideBySide = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  render: function() {
    var pair = this.props.filePair;
    var aImage = pair.a ? <img src={'/a/image/' + pair.a} /> : 'None';
    var bImage = pair.b ? <img src={'/a/image/' + pair.b} /> : 'None';
    return <table id="imagediff">
      <tr className="image-diff-header">
        <td className="diff-left diff-header">{pair.a || 'None'}</td>
        <td className="diff-right diff-header">{pair.b || 'None'}</td>
      </tr>
      <tr className="image-diff-content">
        <td className="diff-left">{aImage}</td>
        <td className="diff-right">{bImage}</td>
      </tr>
    </table>
  }
});

// Two images on top of one another (i.e. "blinked").
// This component handles toggling between the two images itself.
var ImageBlinker = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    return {idx: 0};
  },
  render: function() {
    var pair = this.props.filePair;
    var side = ['a', 'b'][this.state.idx];
    var path = [pair.a, pair.b][this.state.idx];
    var img = path ? <img src={'/' + side + '/image/' + path} /> : 'None';
    return <table id="imagediff">
      <tr className="image-diff-header">
        <td className="diff-header">{path} ({side == 'a' ? 'left' : 'right'})</td>
      </tr>
      <tr className="image-diff-content">
        <td>{img}</td>
      </tr>
    </table>;
  },
  componentDidMount: function() {
    var toggle = function() {
      if (this.isMounted()) {
        this.setState({idx: 1 - this.state.idx});
      }
    }.bind(this);

    $(document).on('keydown.blink', function(e) {
      if (!isLegitKeypress(e)) return;
      if (e.keyCode == 66) {  // 'b'
        toggle();
      }
    }).on('click.blink', 'a[value="blink"]', toggle);
  },
  componentDidUnmount: function(e) {
    $(document).off('keydown.blink').off('click.blink');
  }
});
