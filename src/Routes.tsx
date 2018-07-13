import * as React from 'react';
import {BrowserRouter as Router, Route, Link} from 'react-router-dom';
import { EmbeddedMarketCard } from './EmbeddedMarketCard';

export const Routes = () => (
  <Router>
    <div>
      <Route exact={true} path="/" component={EmbeddedMarketCard} />
      <Route exact={true} path="/e/:id" component={EmbeddedMarketCard} />
    </div>
  </Router>
);