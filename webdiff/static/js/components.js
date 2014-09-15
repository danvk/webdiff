/** @jsx React.DOM */
var Root = React.createClass({
  render: function() {
    return <div>There are {this.props.file_pairs.length} file pairs</div>;
  }
});
