declare const pairs: any;
declare const initialIdx: any;
declare const HAS_IMAGE_MAGICK: any;

import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

export const App = () => (
  <Router>
    <Switch>
      <Route name="pair" path="/:index?">
        {makeRoot(pairs, initialIdx)}
      </Route>
    </Switch>
  </Router>
);
