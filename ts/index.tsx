import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import {Root} from './Root';

const App = () => (
  <Router>
    <Switch>
      <Route name="pair" path="/:index?" component={Root} />
    </Switch>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('application'));
