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
ReactDOM.render(<App />, document.getElementById('application'));

declare const WS_PORT: number;
const hostname = window.location.hostname;
const websocket = new WebSocket(`ws://${hostname}:${WS_PORT}/`);
websocket.onmessage = msg => {
  // no-op
};
websocket.onopen = e => {
  websocket.send('hello!');
};
