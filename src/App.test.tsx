import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Home } from './App';
import { MarketsSummary } from './generated/markets_pb';
import { makeObserverOwner } from './Components/observer';
import { Currency } from './Currency';

const noop = () => undefined;
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Home
    ms={new MarketsSummary()} currencySelectionObserverOwner={makeObserverOwner(Currency.USD)}
  />, div);
  ReactDOM.unmountComponentAtNode(div);
});
