import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import { MarketsSummary } from './generated/markets_pb';

const noop = () => undefined;
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App ms={new MarketsSummary()}/>, div);
  ReactDOM.unmountComponentAtNode(div);
});
