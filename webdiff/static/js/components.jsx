/**
 * React components for webdiff.
 * Depends on image.jsx.
 */
'use strict';

// Perceptual diffing mode
var PDIFF_MODE = {
  OFF: 0,
  BBOX: 1,
  PIXELS: 2
};

// Webdiff application root.
var makeRoot = function(filePairs, initiallySelectedIndex) {
  return React.createClass({
    propTypes: {
      filePairs: React.PropTypes.array.isRequired,
      initiallySelectedIndex: React.PropTypes.number,
      params: React.PropTypes.object
    },
    mixins: [ReactRouter.Navigation, ReactRouter.State],
    getInitialState: () => ({
      imageDiffMode: 'side-by-side',
      pdiffMode: PDIFF_MODE.OFF
    }),
    getDefaultProps: function() {
      return {filePairs, initiallySelectedIndex};
    },
    selectIndex: function(idx) {
      this.transitionTo('pair', {index:idx});
    },
    getIndex: function() {
      var idx = this.getParams().index;
      if (idx == null) idx = this.props.initiallySelectedIndex;
      return Number(idx);
    },
    changeImageDiffModeHandler: function(mode) {
      this.setState({imageDiffMode: mode});
    },
    changePdiffMode: function(pdiffMode) {
      this.setState({pdiffMode});
    },
    computePerceptualDiffBox: function() {
      var fp = this.props.filePairs[this.getIndex()];
      if (!fp.is_image_diff || !isSameSizeImagePair(fp)) return;
      $.getJSON(`/pdiffbbox/${this.getIndex()}`)
          .done(bbox => {
            if (!fp.diffData) fp.diffData = {};
            fp.diffData.diffBounds = bbox;
            this.forceUpdate();  // tell react about this change
          }).fail(error => {
            console.error(error);
          });
    },
    render: function() {
      var idx = this.getIndex(),
          filePair = this.props.filePairs[idx];

      return (
        <div>
          <FileSelector selectedFileIndex={idx}
                        filePairs={this.props.filePairs}
                        fileChangeHandler={this.selectIndex} />
          <DiffView key={'diff-' + idx}
                    thinFilePair={filePair}
                    imageDiffMode={this.state.imageDiffMode}
                    pdiffMode={this.state.pdiffMode}
                    changeImageDiffModeHandler={this.changeImageDiffModeHandler}
                    changePdiffMode={this.changePdiffMode} />
        </div>
      );
    },
    componentDidMount: function() {
      $(document).on('keydown', (e) => {
        if (!isLegitKeypress(e)) return;
        var idx = this.getIndex();
        if (e.keyCode == 75) {  // j
          if (idx > 0) {
            this.selectIndex(idx - 1);
          }
        } else if (e.keyCode == 74) {  // k
          if (idx < this.props.filePairs.length - 1) {
            this.selectIndex(idx + 1);
          }
        } else if (e.keyCode == 83) {  // s
          this.setState({imageDiffMode: 'side-by-side'});
        } else if (e.keyCode == 66) {  // b
          this.setState({imageDiffMode: 'blink'});
        } else if (e.keyCode == 80) {  // p
          this.setState({
            pdiffMode: (this.state.pdiffMode + 1) % 3
          });
        }
      });
    }
  });
};

// Shows a list of files in one of two possible modes (list or dropdown).
var FileSelector = React.createClass({
  propTypes: {
    filePairs: React.PropTypes.array.isRequired,
    selectedFileIndex: React.PropTypes.number.isRequired,
    fileChangeHandler: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    // An explicit list is better, unless there are a ton of files.
    return {mode: this.props.filePairs.length <= 6 ? 'list' : 'dropdown'}
  },
  render: function() {
    // For single file diffs, a file selector is a waste of space.
    if (this.props.filePairs.length == 1) {
      return null;
    }

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

    var changer = <FileModeSelector mode={this.state.mode}
                                    changeHandler={this.changeSelectionModeHandler} />

    return <div className="file-selector">
      {selector}
      {this.props.filePairs.length > 3 ? changer : null}
    </div>;
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
    </div>;
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
    var lis = this.props.filePairs.map((filePair, idx) => {
      var displayName = filePairDisplayName(filePair);
      var content;
      if (idx != props.selectedIndex) {
        content = <a data-idx={idx} onClick={this.clickHandler} href='#'>
          {displayName}</a>;
      } else {
        content = <b>{displayName}</b>;
      }
      return <li key={idx}>
        <span title={filePair.type} className={'diff ' + filePair.type}/>
        {content}
      </li>;
    });
    return <ul className="file-list">{lis}</ul>;
  },
  clickHandler: function(e) {
    this.props.fileChangeHandler(Number($(e.target).attr('data-idx')));
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

    var linkOrNone = (idx) => {
      if (idx < 0 || idx >= props.filePairs.length) {
        return <i>none</i>;
      } else {
        return <a href='#' data-idx={idx} onClick={this.handleLinkClick}>
          {filePairDisplayName(props.filePairs[idx])}
        </a>;
      }
    };

    var prevLink = linkOrNone(props.selectedIndex - 1);
    var nextLink = linkOrNone(props.selectedIndex + 1);

    var options = this.props.filePairs.map((filePair, idx) =>
      <option key={idx} value={idx}>{filePairDisplayName(filePair)} ({filePair.type})</option>);

    return <div className="file-dropdown">
      Prev (k): {prevLink}<br/>
      <select value={props.selectedIndex}
              onChange={this.handleDropdownChange}>{options}</select><br/>
      Next (j): {nextLink}
    </div>;
  },
  handleDropdownChange: function(e) {
    this.props.fileChangeHandler(Number($(e.target).val()));
  },
  handleLinkClick: function(e) {
    this.props.fileChangeHandler(Number($(e.target).attr('data-idx')));
  }
});


// A diff for a single pair of files (left/right).
var DiffView = React.createClass({
  propTypes: {
    thinFilePair: React.PropTypes.object.isRequired,
    imageDiffMode: React.PropTypes.oneOf(IMAGE_DIFF_MODES).isRequired,
    pdiffMode: React.PropTypes.number,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired,
    changePdiffMode: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    // Only the "thin" file pair is available on page load.
    // To get the "thick" file pair, we need to issue an XHR
    return {filePair: null};
  },
  componentDidMount: function() {
    getThickDiff(this.props.thinFilePair.idx).done(filePair => {
      filePair.idx = this.props.thinFilePair.idx;
      this.setState({filePair});
    });
  },
  render: function() {
    var filePair = this.state.filePair;
    if (!filePair) {
      return <div>Loading…</div>;
    }

    if (filePair.is_image_diff) {
      return <ImageDiff filePair={filePair} {...this.props} />;
    } else {
      return <CodeDiff filePair={filePair} />;
    }
  }
});

// A "no changes" sign which only appears when applicable.
var NoChanges = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  render: function() {
    var fp = this.props.filePair;
    if (fp.no_changes) {
      return <div className="no-changes">(File content is identical)</div>;
    } else if (fp.is_image_diff && fp.are_same_pixels) {
      return <div className="no-changes">Pixels are the same, though file content differs (perhaps the headers are different?)</div>;
    } else {
      return null;
    }
  }
});

// A side-by-side diff of source code.
var CodeDiff = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  render: function() {
    return (
      <div>
        <NoChanges filePair={this.props.filePair} />
        <div ref="codediff" key={this.props.filePair.idx}>Loading&hellip;</div>
      </div>
    );
  },
  renderDiff: function() {
    // Either side can be empty (i.e. an add or a delete), in which case
    // getOrNull returns an empty Deferred object.
    var getOrNull = (side, path) =>
        path ? $.post('/' + side + '/get_contents', {path: path}) : [null];
    var pair = this.props.filePair;

    // Do XHRs for the contents of both sides in parallel and fill in the diff.
    var beforeDeferred = getOrNull('a', pair.a);
    var afterDeferred = getOrNull('b', pair.b);

    $.when(beforeDeferred, afterDeferred).done((before, after) => {
      if (!this.isMounted()) return;
      // Call out to codediff.js to construct the side-by-side diff.
      $(this.refs.codediff.getDOMNode()).empty().append(
          renderDiff(pair.a, pair.b, before[0], after[0]));
    })
    .fail((e) => alert("Unable to get diff!"));
  },
  componentDidMount: function() {
    this.renderDiff();  // Called on initial display of this component.
  },
  componentDidUpdate: function() {
    this.componentDidMount();  // Called on updates.
  }
});
