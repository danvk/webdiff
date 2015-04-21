/**
 * React components related to image diffs.
 */
'use strict';

var IMAGE_DIFF_MODES = ['side-by-side', 'blink', 'onion-skin', 'swipe'];

// A widget to toggle between image diff modes (blink or side-by-side).
var ImageDiffModeSelector = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    imageDiffMode: React.PropTypes.oneOf(IMAGE_DIFF_MODES).isRequired,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired
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

    var mode = this.props.imageDiffMode,
        isBlink = mode == 'blink',
        isSxS = mode == 'side-by-side',
        isOnion = mode == 'onion-skin',
        isSwipe = mode == 'swipe';
    return <span>
      <span className="mode">{linkOrB(!isSxS, isSxS, 'side-by-side', 'Side by Side (s)')}</span>
      <span className="mode">{linkOrB(true, isBlink, 'blink', 'Blink (b)')}</span>
      <span className="mode">{linkOrB(!isOnion, isOnion, 'onion-skin', 'Onion Skin')}</span>
      <span className="mode">{linkOrB(!isSwipe, isSwipe, 'swipe', 'Swipe')}</span>
    </span>;
  },
  handleClick: function(e) {
    this.props.changeImageDiffModeHandler($(e.currentTarget).attr('value'));
  }
});

// A diff between two images.
var ImageDiff = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    imageDiffMode: React.PropTypes.oneOf(IMAGE_DIFF_MODES).isRequired,
    pdiffMode: React.PropTypes.number,
    changeImageDiffModeHandler: React.PropTypes.func.isRequired,
    changePdiffMode: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    return {shrinkToFit: true};
  },
  toggleShrinkToFit: function(e) {
    this.setState({shrinkToFit: e.target.checked});
  },
  setPdiffMode: function(mode) {
    this.props.changePdiffMode(mode);
  },
  componentDidMount: function() {
    $(window).on('resize.shrink-to-fit', () => {
      if (this.state.shrinkToFit) this.forceUpdate();
    });
  },
  componentWillUnmount: function() {
    $(window).off('resize.shrink-to-fit');
  },
  computePerceptualDiffBox: function(fp) {
    if (!isSameSizeImagePair(fp)) return;
    $.getJSON(`/pdiffbbox/${fp.idx}`)
        .done(bbox => {
          if (!fp.diffData) fp.diffData = {};
          fp.diffData.diffBounds = bbox;
          this.forceUpdate();  // tell react about this change
        }).fail(error => {
          console.error(error);
        });
  },
  render: function() {
    var mode = this.props.imageDiffMode;
    var pair = this.props.filePair;
    if (isOneSided(pair)) {
      mode = 'side-by-side';  // Only one that makes sense for one-sided diffs.
    }

    if (this.props.pdiffMode == PDIFF_MODE.BBOX && !pair.diffData) {
      // XXX this might shoot off unnecessary XHRs--use a Promise!
      this.computePerceptualDiffBox(pair);
    }

    var component = {
      'side-by-side': ImageSideBySide,
      'blink': ImageBlinker,
      'onion-skin': ImageOnionSkin,
      'swipe': ImageSwipe
    }[mode];
    var image = React.createElement(component, {
      filePair: pair,
      shrinkToFit: this.state.shrinkToFit,
      pdiffMode: this.props.pdiffMode
    });
    var diffBoxEnabled = isSameSizeImagePair(pair);
    var boxClasses = diffBoxEnabled ? '' : 'diff-box-disabled';
    var boxStyles = { display: HAS_IMAGE_MAGICK ? '' : 'none' };
    var imageMagickCallout = !HAS_IMAGE_MAGICK ? (
        <span className="magick">Install{' '}
        <a href="http://www.imagemagick.org/script/binary-releases.php">ImageMagick</a>{' '}
        to see perceptual diffs</span>
    ) : null;

    return <div>
      <div className="image-diff-controls">
        <ImageDiffModeSelector {...this.props} />
        <input type="checkbox" id="shrink-to-fit" checked={this.state.shrinkToFit} onChange={this.toggleShrinkToFit} />
        <label htmlFor="shrink-to-fit"> Shrink to fit</label>
        &nbsp;
        <span className="pdiff-options">
          <span className={boxClasses} style={boxStyles}>
            Perceptual Diff:&nbsp;
            <input type="radio" name="pdiff-mode"
                   id="pdiff-off"
                   checked={this.props.pdiffMode == PDIFF_MODE.OFF}
                   disabled={!diffBoxEnabled}
                   onChange={() => this.setPdiffMode(PDIFF_MODE.OFF)} />
            <label htmlFor="pdiff-off"> None</label>
            &nbsp;
            <input type="radio" name="pdiff-mode"
                   id="pdiff-bbox"
                   checked={this.props.pdiffMode == PDIFF_MODE.BBOX}
                   disabled={!diffBoxEnabled}
                   onChange={() => this.setPdiffMode(PDIFF_MODE.BBOX)} />
            <label htmlFor="pdiff-bbox"> Box</label>
            &nbsp;
            <input type="radio" name="pdiff-mode"
                   id="pdiff-pixels"
                   checked={this.props.pdiffMode == PDIFF_MODE.PIXELS}
                   disabled={!diffBoxEnabled}
                   onChange={() => this.setPdiffMode(PDIFF_MODE.PIXELS)} />
            <label htmlFor="pdiff-pixels"> Differing Pixels</label>
          </span>
          {imageMagickCallout}
        </span>
      </div>
      <div className={'image-diff ' + mode}>
        <NoChanges filePair={this.props.filePair} />
        {image}
      </div>
    </div>;
  }
});


/**
 * Returns a React.DIV which boxes the changed parts of the image pair.
 * scaleDown is in [0, 1], with 1 being full-size
 */
function makePerceptualBoxDiv(pdiffMode, filePair, scaleDown) {
  if (pdiffMode == PDIFF_MODE.OFF ||
      !isSameSizeImagePair(filePair)) {
    return null;
  } else if (pdiffMode == PDIFF_MODE.BBOX) {
    var padding = 5;  // try not to obscure anything inside the box
    if (filePair.diffData &&
        filePair.diffData.diffBounds) {
      var bbox = filePair.diffData.diffBounds;
      if (bbox.width == 0 || bbox.height == 0) return null;
      var styles = {
        top: Math.floor(scaleDown * (bbox.top - padding)) + 'px',
        left: Math.floor(scaleDown * (bbox.left - padding)) + 'px',
        width: Math.ceil(scaleDown * (bbox.right - bbox.left + 2 * padding)) + 'px',
        height: Math.ceil(scaleDown * (bbox.bottom - bbox.top + 2 * padding)) + 'px'
      };
      return <div className='perceptual-diff bbox' style={styles} />;
    } else {
      return null;
    }
  } else if (pdiffMode == PDIFF_MODE.PIXELS) {
    var styles = {top: 0, left: 0},
        width = filePair.image_a.width * scaleDown,
        height = filePair.image_a.height * scaleDown,
        src = `/pdiff/${filePair.idx}`;
    return (
        <img className='perceptual-diff pixels'
             style={styles}
             width={width}
             height={height}
             src={src} />
    );
  }
}


var AnnotatedImage = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    side: React.PropTypes.oneOf(['a', 'b']).isRequired,
    maxWidth: React.PropTypes.number,
    pdiffMode: React.PropTypes.number
  },
  render: function() {
    var side = this.props.side;
    if (!this.props.filePair[side]) {
      return <span>None</span>;
    }

    var im = this.props.filePair['image_' + side];
    return (
      <div className={'image-' + side}>
        <SingleImage side={side} {...this.props} />
        <ImageMetadata image={im} />
      </div>
    );
  }
});


var SingleImage = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    side: React.PropTypes.oneOf(['a', 'b']).isRequired,
    maxWidth: React.PropTypes.number,
    pdiffMode: React.PropTypes.number
  },
  render: function() {
    var filePair = this.props.filePair;
    var side = this.props.side;
    if (!filePair[side]) {
      return null;  // or: return empty <img> same size as other image?
    }

    var url = (side == 'a') ? '/a/image/' + filePair.a
                            : '/b/image/' + filePair.b;
    var im = _.clone(filePair['image_' + side]);
    var scaleDown = 1.0;
    if (this.props.maxWidth !== null && this.props.maxWidth < im.width) {
      scaleDown = this.props.maxWidth / im.width;
      im.width *= scaleDown;
      im.height *= scaleDown;
    }
    var diffBoxDiv = makePerceptualBoxDiv(this.props.pdiffMode, filePair, scaleDown);

    return (
      <div className='image-holder'>
        {diffBoxDiv}
        <img className={'side-' + side} src={url}
             width={im.width} height={im.height} />
      </div>
    );
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
    shrinkToFit: React.PropTypes.bool,
    pdiffMode: React.PropTypes.number
  },
  render: function() {
    var maxWidth = this.props.shrinkToFit ? (window.innerWidth - 30) / 2 : null;
    return <table id="imagediff">
      <tr className="image-diff-content">
        <td className="diff-left">
          <AnnotatedImage side="a" maxWidth={maxWidth} {...this.props} />
        </td>
        <td className="diff-right">
          <AnnotatedImage side="b" maxWidth={maxWidth} {...this.props} />
        </td>
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
            <td>
              <AnnotatedImage side={side} maxWidth={maxWidth} {...this.props} />
            </td>
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
    shrinkToFit: React.PropTypes.bool,
    showPerceptualDiffBox: React.PropTypes.bool
  },
  render: function() {
    return <ImageSwipe {...this.props} mode="onion-skin" />;
  }
});

// Two images on top of one another with a slider to move the divider from left
// to right.
var ImageSwipe = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired,
    mode: React.PropTypes.oneOf(['swipe', 'onion-skin']),
    shrinkToFit: React.PropTypes.bool,
    showPerceptualDiffBox: React.PropTypes.bool
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
    var diffBoxDiv = makePerceptualBoxDiv(this.props.pdiffMode, pair, scaleDown);
    var styleA = {}, styleB = {}, styleContainer = {
      width: containerWidth + 'px',
      height: Math.max(imA.height, imB.height) + 'px'
    };
    var urlA = '/a/image/' + pair.a,
        urlB = '/b/image/' + pair.b;
    _.extend(styleA, {
      'backgroundImage': 'url(' + urlA + ')',
      'backgroundSize': imA.width + 'px ' + imA.height + 'px',
      'width': imA.width + 'px',
      'height': imA.height + 'px'
    });
    _.extend(styleB, {
      'backgroundImage': 'url(' + urlB + ')',
      'backgroundSize': imB.width + 'px ' + imB.height + 'px',
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
        'backgroundPositionX': -Math.floor(frac * imB.width) + 'px'
      });
    } else {
      _.extend(styleB, {opacity: frac});
    }

    // Add an opaque grid under each image to expose transparency.
    [styleA, styleB].forEach(function(o) {
      o['backgroundImage'] += ', url(/static/img/trans_bg.gif)';
      if (_.has(o, 'backgroundSize')) {
        o['backgroundSize'] += ', auto auto';
      }
      if (_.has(o, 'backgroundPositionX')) {
        o['backgroundPositionX'] += ', ' + o['backgroundPositionX'];
      }
    });

    return (
      <div>
        <div className="range-holder">
          <input type="range" min="0" max={rangeMax} defaultValue={rangeMax/2} ref="slider" onChange={this.onSlide} />
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
});


var NoPixelsChanged = React.createClass({
  propTypes: {
    filePair: React.PropTypes.object.isRequired
  },
  render: function() {
    if (this.props.filePair.are_same_pixels) {
      return <div className="no-changes">(Pixels are identical)</div>;
    } else {
      return null;
    }
  }
});
