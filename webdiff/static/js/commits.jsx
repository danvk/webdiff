/** @jsx React.DOM */

var CommitsTable = React.createClass({
  propTypes: {
    commits: React.PropTypes.array.isRequired
  },
  getInitialState: function() {
    return {
      selectedCommitIdx: null
    };
  },
  handleSelected: function(commit) {
    this.setState({ selectedCommitIdx: commit.props.idx });
  },
  render: function() {
    var commits = this.props.commits;
    return <div className="commits-div">
          <table className="commits">
            <thead>
              <tr>
                <th><div className="header">SHA</div></th>
                <th><div className="header">Subject</div></th>
                <th><div className="header">Author</div></th>
                <th><div className="header">Time</div></th>
              </tr>
            </thead>
            <tbody><div>
            {
              commits.map(function(commit, idx) {
                return <CommitRow
                    key={commit.hex}
                    commit={commit}
                    idx={idx}
                    selected={idx == this.state.selectedCommitIdx}
                    handleSelected={this.handleSelected} />;
              }.bind(this))
            }</div></tbody>
          </table>
        </div>;
  }
});

var CommitRow = React.createClass({
  propTypes: {
    commit: React.PropTypes.object.isRequired
  },
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
});
