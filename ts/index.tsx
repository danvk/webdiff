import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { Root } from "./Root";

export const App = () => (
  <Router>
    <Switch>
      <Route name="pair" path="/:index?" component={Root} />
    </Switch>
  </Router>
);
