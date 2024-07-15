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
const websocket = new WebSocket(`ws://localhost:${WS_PORT}/`);
websocket.onmessage = msg => {
  console.log('message', msg);
};
websocket.onclose = e => {
  console.log('closed!', e);
};
websocket.onopen = e => {
  console.log('websocket open', e);
  websocket.send('hello!');
};
