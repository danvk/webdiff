import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
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
ReactDOM.render(<App />, document.getElementById('application'));
