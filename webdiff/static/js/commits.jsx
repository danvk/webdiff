/** @jsx React.DOM */

var Commits = React.createClass({
  propTypes: {
    commits: React.PropTypes.array.isRequired
  },
  getInitialState: function() {
    return {
      selectedCommitIdx: -1
    };
  },
  handleSelected: function(commit) {
    this.setState({ selectedCommitIdx: commit.props.idx });
  },
  render: function() {
    return <div id="commits"><table><tbody>{
      this.props.commits.map(function(commit, idx) {
        return <Commit
            commit={commit}
            idx={idx}
            selected={idx == this.state.selectedCommitIdx}
            handleSelected={this.handleSelected} />;
      }.bind(this))
    }</tbody></table></div>;
  }
});

var Commit = React.createClass({
  onClick: function(e) {
    this.props.handleSelected(this);
  },
  render: function() {
    return <tr onClick={this.onClick} className={this.props.selected ? 'selected' : ''}>
      <td className="hex">{this.props.commit.hex}</td>
      <td className="message">{this.props.commit.message}</td>
      <td className="author">{this.props.commit.author.name} ({this.props.commit.author.email})</td>
      <td className="author-datetime">{moment(this.props.commit.author.time * 1000).format('YYYY/MM/DD hh:mm:ss a')}</td>
    </tr>;
  }
})
