import {createRoot} from 'react-dom/client';
import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {injectStylesFromConfig} from './options';
import {Root} from './Root';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/:index?" element={<Root />} />
    </Routes>
  </BrowserRouter>
);

injectStylesFromConfig();
const root = createRoot(document.getElementById('application')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
