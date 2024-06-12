import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import {injectStylesFromConfig} from './options';
import {Root} from './Root';

const App = () => (
  <Router>
    <Switch>
      <Route path="/:index?" component={Root} />
    </Switch>
  </Router>
);

injectStylesFromConfig();
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('application'),
);
