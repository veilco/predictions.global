import 'bulma/css/bulma.css';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import './App.css';
import { Currency, renderCurrency } from './Currency';
import Footer from './Footer';
import { Market, MarketsSummary } from './generated/markets_pb';
import Header, { HasMarketsSummary } from './Header';
import { makeObserverOwner, ObserverOwner } from './observer';
import OneMarketSummary from './OneMarketSummary';
import Selector from './selector';

// example of changing moment language globally to fr; only works since fr was imported.
// import 'moment/locale/fr';
// moment.locale('fr');

interface State {
  currencySelectionObserverOwner: ObserverOwner<Currency> | undefined
}

const initialState: State = {
  currencySelectionObserverOwner: undefined,
}

class App extends React.Component<HasMarketsSummary, State> {
  public readonly state: State = initialState;
  public constructor(props: HasMarketsSummary) {
    super(props);
    this.state = Object.assign({}, this.state, {
      currencySelectionObserverOwner: makeObserverOwner(Currency.USD),
    });
  }
  // https://reactjs.org/docs/faq-functions.html
  public setCurrency = (currency: Currency) => {
    if (this.state.currencySelectionObserverOwner !== undefined) {
      this.state.currencySelectionObserverOwner.setValueAndNotifyObservers(currency);
    }
  }
  public render() {
    if (this.state.currencySelectionObserverOwner === undefined) {
      // this never occurs because currencySelectionObserverOwner is synchronously constructed in the constructor.
      return <div />;
    }
    const currencySelectionObserver = this.state.currencySelectionObserverOwner.o;
    const ms: MarketsSummary = this.props.ms;
    const now = moment();
    return (
      <div>
        <ReactTooltip /> {/* <ReactTooltip /> is extremely non-performant and we want only one of these in entire React tree. */}
        <Header ms={ms} currencySelectionObserver={currencySelectionObserver} />
        <section className="less-padding-bottom section">
          <div className="columns is-centered is-marginless is-paddingless is-vcentered">
            <div className="column is-12-mobile is-5-tablet is-5-desktop">
              {/* NB logo is fixed width and column must be larger than this or logo column will bleed into next column. The fixed width value in App.scss was chosen to make logo look good responsively. */}
              <img className="logo" src="logo.png" />
            </div>
            <div className="column is-12-mobile is-5-tablet is-5-desktop has-text-centered content">
              <p><strong>See What the World Thinks.</strong></p>
              <p>Prediction Markets powered by Augur. Each market trades on the <a href="https://augur.net" target="blank">Augur</a> decentralized prediction market platform, built on the Ethereum blockchain.</p>
            </div>
          </div>
        </section>
        <section className="less-padding-top section">
          <div className="columns is-centered is-vcentered is-mobile is-marginless is-paddingless is-multiline is-8 is-variable">
            <div className="column no-padding-bottom is-8-mobile is-4-tablet is-4-desktop is-marginless content has-text-centered-mobile has-text-left-tablet has-text-left-desktop">
              <p><strong>Top Prediction Markets</strong></p>
            </div>
            <div className="column no-padding-bottom is-marginless is-narrow is-4-mobile">
              <Selector<Currency>
                currentValueObserver={currencySelectionObserver}
                renderValue={renderCurrency}
                setValue={this.setCurrency}
                values={[Currency.USD, Currency.ETH, Currency.BTC]} />
            </div>
            <div className="column no-padding-bottom is-marginless is-narrow">
              <div className="search">
                <input className="input" type="text" placeholder="Search Coming Soon!" />
                <i className="fas fa-search" />
              </div>
            </div>
          </div>
          {ms.getMarketsList().map((m: Market, index: number) => <OneMarketSummary
            key={index}
            now={now}
            currencySelectionObserver={currencySelectionObserver}
            m={m}
            index={index} />)}
        </section>
        {Footer}
      </div>
    );
  }
}

export default App;
