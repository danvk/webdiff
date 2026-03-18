import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter as Router, Routes, Route} from 'react-router';
import {injectStylesFromConfig} from './options';
import {Root} from './Root';

const App = () => (
  <Router>
    <Routes>
      <Route path="/:index?" element={<Root />} />
    </Routes>
  </Router>
);

injectStylesFromConfig();
const appEl = document.getElementById('application');
if (!appEl) throw new Error('Missing #application element');
createRoot(appEl).render(<App />);

const host = window.location.host;
const websocket = new WebSocket(`ws://${host}/ws`);
websocket.onmessage = msg => {
  // no op
};
websocket.onopen = e => {
  websocket.send('hello!');
};
