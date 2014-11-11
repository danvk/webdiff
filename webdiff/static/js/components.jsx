/** @jsx React.DOM */
var Route = ReactRouter.Route;
var Routes = ReactRouter.Routes;
var Link = ReactRouter.Link;

IMAGE_DIFF_MODES = ['side-by-side', 'blink', 'onion-skin', 'swipe'];

// Webdiff application root.
var Root = React.createClass({
  propTypes: {
    filePairs: React.PropTypes.array.isRequired,
    initiallySelectedIndex: React.PropTypes.number,
    params: React.PropTypes.object
  },
  mixins: [ReactRouter.Navigation],
  getInitialState: () => ({
    imageDiffMode: 'side-by-side'
  }),
  selectIndex: function(idx) {
    this.transitionTo('pair', {index:idx});
  },
  getIndex: function() {
    var idx = this.props.params.index;
    if (idx == null) idx = this.props.initiallySelectedIndex;
    return Number(idx);
  },
  changeImageDiffModeHandler: function(mode) {
    this.setState({imageDiffMode: mode});
  },
  render: function() {
    var idx = this.getIndex(),
        filePair = this.props.filePairs[idx];

    return (
      <div>
        <FileSelector selectedFileIndex={idx}
                      filePairs={this.props.filePairs}
                      fileChangeHandler={this.selectIndex} />
        <DiffView filePair={filePair}
                  imageDiffMode={this.state.imageDiffMode}
                  changeImageDiffModeHandler={this.changeImageDiffModeHandler} />
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
      }
    });
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

// A widget to toggle between image diff modes (blink or side-by-side).
var ImageDiffModeSelector = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    mode: React.PropTypes.oneOf(IMAGE_DIFF_MODES).isRequired,
    changeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    if (isOneSided(this.props.filePair)) {
      return null;  // Only "side-by-side" makes sense for one-sided diffs.
    }

    // Returns the text, optionally wrapped in a link and/or <b> tag.
    var linkOrB = (isLink, isB, val, text) => {
      var inner = isB ? <b>{text}</b> : text;
      if (isLink) {
        return <a href='#' onClick={this.handleClick} value={val}>{inner}</a>;
      } else {
        return inner;
      }
    };

    var isBlink = this.props.mode == 'blink',
        isSxS = this.props.mode == 'side-by-side',
        isOnion = this.props.mode == 'onion-skin',
        isSwipe = this.props.mode == 'swipe';
    return <span>
      <span className="mode">{linkOrB(!isSxS, isSxS, 'side-by-side', 'Side by Side (s)')}</span>
      <span className="mode">{linkOrB(true, isBlink, 'blink', 'Blink (b)')}</span>
      <span className="mode">{linkOrB(!isOnion, isOnion, 'onion-skin', 'Onion Skin')}</span>
      <span className="mode">{linkOrB(!isSwipe, isSwipe, 'swipe', 'Swipe')}</span>
    </span>;
  },
  handleClick: function(e) {
    this.props.changeHandler($(e.currentTarget).attr('value'));
  }
});

// A diff for a single pair of files (left/right).
var DiffView = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    imageDiffMode: React.PropTypes.oneOf(IMAGE_DIFF_MODES).isRequired,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired
  },
  render: function() {
    if (this.props.filePair.is_image_diff) {
      return <ImageDiff imageDiffMode={this.props.imageDiffMode}
                        filePair={this.props.filePair}
                        changeImageDiffModeHandler=
                          {this.props.changeImageDiffModeHandler} />;
    } else {
      return <CodeDiff filePair={this.props.filePair} />;
    }
  }
});

// A "no changes" sign which only appears when applicable.
var NoChanges = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  render: function() {
    if (this.props.filePair.no_changes) {
      return <div className="no-changes">(No Changes)</div>;
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

// A diff between two images.
var ImageDiff = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    imageDiffMode: React.PropTypes.oneOf(IMAGE_DIFF_MODES).isRequired,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    return {shrinkToFit: true};
  },
  toggleShrinkToFit: function(e) {
    this.setState({shrinkToFit: e.target.checked});
  },
  componentDidMount: function() {
    $(window).on('resize.shrink-to-fit', () => {
      if (this.state.shrinkToFit) this.forceUpdate();
    });
  },
  componentWillUnmount: function() {
    $(window).off('resize.shrink-to-fit');
  },
  render: function() {
    var mode = this.props.imageDiffMode;
    if (isOneSided(this.props.filePair)) {
      mode = 'side-by-side';  // Only one that makes sense for one-sided diffs.
    }
    var component = {
      'side-by-side': ImageSideBySide,
      'blink': ImageBlinker,
      'onion-skin': ImageOnionSkin,
      'swipe': ImageSwipe
    }[mode];
    var image = component({
      filePair: this.props.filePair,
      shrinkToFit: this.state.shrinkToFit
    });

    return <div>
      <div className="image-diff-controls">
        <ImageDiffModeSelector filePair={this.props.filePair}
                               mode={this.props.imageDiffMode}
                               changeHandler={this.props.changeImageDiffModeHandler}/>
        <input type="checkbox" id="shrink-to-fit" checked={this.state.shrinkToFit} onChange={this.toggleShrinkToFit} />
        <label htmlFor="shrink-to-fit"> Shrink to fit</label>
      </div>
      <div className={'image-diff ' + mode}>
        <NoChanges filePair={this.props.filePair} />
        {image}
      </div>
    </div>;
  }
});


var AnnotatedImage = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    side: React.PropTypes.oneOf(['a', 'b']).isRequired,
    maxWidth: React.PropTypes.number
  },
  render: function() {
    var side = this.props.side;
    if (!this.props.filePair[side]) {
      return <span>None</span>;
    }

    var im = this.props.filePair['image_' + side];
    return (
      <div className={'image-' + side}>
        <Image filePair={this.props.filePair} side={side} maxWidth={this.props.maxWidth} />
        <ImageMetadata image={im} />
      </div>
    );
  }
});


var Image = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    side: React.PropTypes.oneOf(['a', 'b']).isRequired,
    maxWidth: React.PropTypes.number
  },
  render: function() {
    var side = this.props.side;
    if (!this.props.filePair[side]) {
      return null;  // or: return empty <img> same size as other image?
    }

    var url = (side == 'a') ? '/a/image/' + this.props.filePair.a
                            : '/b/image/' + this.props.filePair.b;
    var im = _.clone(this.props.filePair['image_' + side]);
    if (this.props.maxWidth !== null && this.props.maxWidth < im.width) {
      var scaleDown = this.props.maxWidth / im.width;
      im.width *= scaleDown;
      im.height *= scaleDown;
    }
    return <img className={'side-' + side} src={url} width={im.width} height={im.height} />;
  }
});


var ImageMetadata = React.createClass({
  propTypes: {
    image: React.PropTypes.object.isRequired
  },
  render: function() {
    var im = this.props.image;
    return (
      <p className="image-props">
        {im.width}x{im.height} pixels<br/>
        ({im.num_bytes.toLocaleString()} bytes)
      </p>
    );
  }
});


// Two images placed side-by-side.
var ImageSideBySide = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    shrinkToFit: React.PropTypes.bool
  },
  render: function() {
    var pair = this.props.filePair;
    var maxWidth = this.props.shrinkToFit ? (window.innerWidth - 30) / 2 : null;
    return <table id="imagediff">
      <tr className="image-diff-content">
        <td className="diff-left"><AnnotatedImage filePair={pair} side="a" maxWidth={maxWidth} /></td>
        <td className="diff-right"><AnnotatedImage filePair={pair} side="b" maxWidth={maxWidth} /></td>
      </tr>
    </table>;
  }
});

// Two images on top of one another (i.e. "blinked").
// This component handles toggling between the two images itself.
var ImageBlinker = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    shrinkToFit: React.PropTypes.bool
  },
  mixins: [SetIntervalMixin],
  getInitialState: function() {
    return {idx: 0, autoBlink: true};
  },
  toggleAutoBlink: function(e) {
    this.setState({
      autoBlink: $(this.refs.autoblink.getDOMNode()).is(':checked')
    });
  },
  render: function() {
    var pair = this.props.filePair;
    var side = ['a', 'b'][this.state.idx];
    var path = [pair.a, pair.b][this.state.idx];
    var maxWidth = this.props.shrinkToFit ? window.innerWidth - 30 : null;
    return (
      <div>
        <input ref="autoblink" type="checkbox" id="autoblink" checked={this.state.autoBlink} onChange={this.toggleAutoBlink} />
        <label htmlFor="autoblink"> Auto-blink (hit ‘b’ to blink manually)</label>
        <table id="imagediff">
          <tr className="image-diff-content">
            <td><AnnotatedImage filePair={pair} side={side} maxWidth={maxWidth} /></td>
          </tr>
        </table>
      </div>
    );
  },
  componentDidMount: function() {
    var toggle = () => {
      if (this.isMounted()) {
        this.setState({idx: 1 - this.state.idx});
      }
    };

    $(document).on('keydown.blink', (e) => {
      if (!isLegitKeypress(e)) return;
      if (e.keyCode == 66) {  // 'b'
        if (this.isMounted()) {
          this.setState({autoBlink: false});
          toggle();
        }
      }
    }).on('click.blink', 'a[value="blink"]', toggle);

    this.setInterval(() => {
      if (this.state.autoBlink) toggle();
    }, 500);
  },
  componentDidUnmount: function(e) {
    $(document).off('keydown.blink').off('click.blink');
  }
});

// Two images on top of one another with a cross-fader
var ImageOnionSkin = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    shrinkToFit: React.PropTypes.bool
  },
  render: function() {
    return <ImageSwipe filePair={this.props.filePair}
                       shrinkToFit={this.props.shrinkToFit}
                       mode="onion-skin" />;
  }
});

// Two images on top of one another with a slider to move the divider from left
// to right.
var ImageSwipe = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    mode: React.PropTypes.oneOf(['swipe', 'onion-skin']),
    shrinkToFit: React.PropTypes.bool
  },
  getDefaultProps: function() {
    return {mode: 'swipe'};
  },
  getInitialState: function() {
    return {rangePosition: null};
  },
  onSlide: function(e) {
    this.setState({rangePosition: Number(this.refs.slider.getDOMNode().value)});
  },
  render: function() {
    var pair = this.props.filePair;
    var imA = _.clone(pair.image_a), imB = _.clone(pair.image_b);
    var containerWidth = Math.max(imA.width, imB.width),
        rangeMax = containerWidth,
        rangePosition = this.state.rangePosition,
        rangePosition = rangePosition === null ? rangeMax / 2 : rangePosition,
        pct = 100.0 * (rangePosition / rangeMax),
        frac = pct / 100.0;
    if (this.props.shrinkToFit) {
      var scaleDown = Math.min(1.0, (window.innerWidth - 30) / containerWidth);
      imA.width *= scaleDown;
      imA.height *= scaleDown;
      imB.width *= scaleDown;
      imB.height *= scaleDown;
      containerWidth = Math.max(imA.width, imB.width);
    }
    var styleA = {}, styleB = {}, styleContainer = {
      width: containerWidth + 'px',
      height: Math.max(imA.height, imB.height) + 'px'
    };
    var urlA = '/a/image/' + pair.a,
        urlB = '/b/image/' + pair.b;
    _.extend(styleA, {
      'background-image': 'url(' + urlA + ')',
      'background-size': imA.width + 'px ' + imA.height + 'px',
      'width': imA.width + 'px',
      'height': imA.height + 'px'
    });
    _.extend(styleB, {
      'background-image': 'url(' + urlB + ')',
      'background-size': imB.width + 'px ' + imB.height + 'px',
      'width': imB.width + 'px',
      'height': imB.height + 'px'
    });
    if (this.props.mode == 'swipe') {
      _.extend(styleA, {
        width: Math.floor(frac * imA.width) + 'px'
      });
      _.extend(styleB, {
        left: Math.floor(frac * imB.width) + 'px',
        width: null,
        right: containerWidth - imB.width + 'px',
        'background-position-x': -Math.floor(frac * imB.width) + 'px'
      });
    } else {
      _.extend(styleB, {opacity: frac});
    }

    // Add an opaque grid under each image to expose transparency.
    [styleA, styleB].forEach(function(o) {
      o['background-image'] += ', url(/static/img/trans_bg.gif)';
      if (_.has(o, 'background-size')) {
        o['background-size'] += ', auto auto';
      }
      if (_.has(o, 'background-position-x')) {
        o['background-position-x'] += ', ' + o['background-position-x'];
      }
    });

    return (
      <div>
        <input type="range" min="0" max={rangeMax} defaultValue={rangeMax/2} ref="slider" onChange={this.onSlide} />
        <div className="overlapping-images" style={styleContainer}>
          <div style={styleA} className="side-a" />
          <div style={styleB} className="side-b" />
        </div>
        <div className="overlapping-images-metadata">
          <ImageMetadata image={pair.image_a} />
          <ImageMetadata image={pair.image_b} />
        </div>
      </div>
    );
  }
});
