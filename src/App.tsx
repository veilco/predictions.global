import 'bulma/css/bulma.css';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import './App.css';
import {Currency, renderCurrency} from './Currency';
import Footer from './Footer';
import {Market, MarketsSummary} from './generated/markets_pb';
import Header, {HasMarketsSummary} from './Header';
import {makeObserverOwner, ObserverOwner, Observer} from './observer';
import OneMarketSummary from './OneMarketSummary';
import Selector from './selector';
import * as classNames from 'classnames';

// example of changing moment language globally to fr; only works since fr was imported.
// import 'moment/locale/fr';
// moment.locale('fr');

interface State {
  currencySelectionObserverOwner: ObserverOwner<Currency> | undefined
}

class App extends React.Component<HasMarketsSummary, State> {
  public readonly state: State;

  public constructor(props: HasMarketsSummary) {
    super(props);

    this.state = {
      currencySelectionObserverOwner: makeObserverOwner(Currency.USD),
    };
  }

  public render() {
    if (this.state.currencySelectionObserverOwner === undefined) {
      // this never occurs because currencySelectionObserverOwner is synchronously constructed in the constructor.
      return <div/>;
    }

    const {currencySelectionObserverOwner} = this.state;
    const currencySelectionObserver = this.state.currencySelectionObserverOwner.o;
    const ms: MarketsSummary = this.props.ms;
    return (
      <div>
        <ReactTooltip/> {/* <ReactTooltip /> is extremely non-performant and we want only one of these in entire React tree. */}
        <Header ms={ms} currencySelectionObserver={currencySelectionObserver}/>
        <section className="less-padding-bottom section">
          <div className="columns is-centered is-marginless is-paddingless is-vcentered">
            <div className="column is-12-mobile is-5-tablet is-5-desktop">
              {/* NB logo is fixed width and column must be larger than this or logo column will bleed into next column. The fixed width value in App.scss was chosen to make logo look good responsively. */}
              <img className="logo" src="logo.png"/>
            </div>
            <div className="column is-12-mobile is-5-tablet is-5-desktop has-text-centered content">
              <p><strong>See What the World Thinks.</strong></p>
              <p>Prediction Markets powered by Augur. Each market trades on the <a href="https://augur.net"
                                                                                   target="blank">Augur</a>
                decentralized prediction market platform, built on the Ethereum blockchain.</p>
            </div>
          </div>
        </section>
        <div className="container">
          <MarketList currencySelectionObserverOwner={currencySelectionObserverOwner}
                      currencySelectionObserver={currencySelectionObserver} marketList={ms.getMarketsList()}/>
        </div>
        {Footer}
      </div>
    );
  }
}

const sortOrders: Map<string, (a: Market, b: Market) => number> = new Map([
  ['Money at Stake', (a: Market, b: Market) => {
    const aCapitalization = a.getMarketCapitalization();
    const bCapitalization = b.getMarketCapitalization();
    if (aCapitalization == null) {
      return -1;
    }

    if (bCapitalization == null) {
      return 1;
    }

    return aCapitalization.getUsd() - bCapitalization.getUsd()
  }],
  ['New Markets', (a: Market, b: Market) => b.getCreationTime() - a.getCreationTime()],
  ['Ending Soon', (a: Market, b: Market) => a.getEndDate() - b.getEndDate()]
]);
const categories = ['All', 'Sports', 'Cryptocurrency', 'Other'];

interface MarketListProps {
  marketList: Market[],
  currencySelectionObserver: Observer<Currency>,
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

interface MarketListState {
  category: string,
  categoryOwner: ObserverOwner<string>,
  paginationLimit: number,
  paginationOffset: number,
  searchQuery: string,
  showEnded: boolean,
  sortOrder: string,
  sortOrderOwner: ObserverOwner<string>,
}

class MarketList extends React.Component<MarketListProps, MarketListState> {
  public readonly state: MarketListState;

  constructor(props: MarketListProps) {
    super(props);

    this.state = {
      category: 'All',
      categoryOwner: makeObserverOwner(categories[0]),
      paginationLimit: 2,
      paginationOffset: 0,
      searchQuery: '',
      showEnded: false,
      sortOrder: 'Money at Stake',
      sortOrderOwner: makeObserverOwner(sortOrders.keys().next().value),
    };
  }

  public render() {
    const {marketList, currencySelectionObserver} = this.props;
    const {paginationLimit, paginationOffset, showEnded, sortOrder, sortOrderOwner, searchQuery, category, categoryOwner} = this.state;

    const filteredMarketList = marketList
      .filter((market: Market) => category === 'All' || market.getCategory() === category)
      .filter((market: Market) => showEnded || moment.unix(market.getEndDate()).isAfter())
      .filter((market: Market) => market.getName().toLowerCase().replace(' ', '').indexOf(searchQuery) !== -1)
      .sort(sortOrders.get(sortOrder));

    const numberOfPages = Math.ceil(filteredMarketList.length / paginationLimit);
    const paginationStart = paginationLimit * paginationOffset;
    const paginationEnd = paginationLimit * (paginationOffset + 1);

    const paginationIndices = Array.from(new Set([
      1,
      Math.max(paginationOffset, 1),
      paginationOffset + 1,
      Math.min(paginationOffset + 2, numberOfPages),
      numberOfPages]
    ).values());

    const now = moment();

    return (
      <section className="less-padding-top section">
        <div
          className="column no-padding-bottom is-8-mobile is-4-tablet is-4-desktop is-marginless content has-text-centered-mobile has-text-left-tablet has-text-left-desktop">
          <p><strong>Prediction Markets</strong></p>
        </div>
        <div className="columns is-centered is-vcentered is-mobile">
          <div className="column">
            <Selector
              currentValueObserver={currencySelectionObserver}
              renderValue={renderCurrency}
              setValue={this.setCurrency}
              values={[Currency.USD, Currency.ETH, Currency.BTC]}/>
          </div>
          <div className="column">
            <Selector
              currentValueObserver={sortOrderOwner.o}
              renderValue={this.renderSortOrder}
              setValue={this.setSortOrder}
              values={Array.from(sortOrders.keys())}/>
          </div>
          <div className="column">
            <Selector
              currentValueObserver={categoryOwner.o}
              renderValue={this.renderCategory}
              setValue={this.setCategory}
              values={categories}/>
          </div>
          <div className="column">
            <label className="checkbox">
              <input type="checkbox" onChange={this.setShowEnded}/>&nbsp;
              Show Ended Markets
            </label>
          </div>
          <div className="column">
            <div className="search">
              <input className="input" type="text" placeholder="Search" onChange={this.setSearchQuery}/>
              <i className="fas fa-search"/>
            </div>
          </div>
        </div>
        <div>
          {filteredMarketList
            .slice(paginationStart, paginationEnd)
            .map((m: Market, index: number) => (
              <OneMarketSummary
                key={paginationStart + index}
                now={now}
                currencySelectionObserver={currencySelectionObserver}
                m={m}
                index={paginationStart + index}/>)
            )}
          <nav className="pagination is-centered" role="navigation" aria-label="pagination">
            {paginationOffset > 0 && (
              <a className="pagination-previous" onClick={this.setPaginationOffset.bind(this, paginationOffset - 1)}>Prev
                Page</a>)}
            {paginationOffset < numberOfPages - 1 && (
              <a className="pagination-next" onClick={this.setPaginationOffset.bind(this, paginationOffset + 1)}>Next
                Page</a>)}
            <ul className="pagination-list">
              {paginationIndices.map((page: number) => (
                <li key={page}>
                  <a
                    className={classNames('pagination-link', page === (paginationOffset + 1) && 'is-current')}
                    aria-label={`Goto page ${page}`}
                    aria-current="page"
                    onClick={this.setPaginationOffset.bind(this, page - 1)}
                  >
                    {page}
                  </a>
                </li>
              ))
              }
            </ul>
          </nav>
        </div>
      </section>
    );
  }

  private renderSortOrder = (sortOrder: string) => (sortOrder);

  private setSortOrder = (sortOrder: string) => {
    this.setState({
      sortOrder,
    });
  };

  private renderCategory = (category: string) => (category);

  private setCategory = (category: string) => {
    this.setState({
      category,
    });
  };

  // https://reactjs.org/docs/faq-functions.html
  private setCurrency = (currency: Currency) => {
    if (this.props.currencySelectionObserverOwner) {
      this.props.currencySelectionObserverOwner.setValueAndNotifyObservers(currency);
    }
  };

  private setPaginationOffset = (paginationOffset: number) => {
    this.setState({
      paginationOffset,
    });
  };

  private setShowEnded = () => {
    this.setState(prevState => ({
      showEnded: !prevState.showEnded,
    }));
  };

  private setSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery: string = e.target.value.toLowerCase().replace(' ', '');
    console.log(searchQuery) // tslint:disable-line:no-console
    this.setState({
      searchQuery,
    })
  };
}

export default App;
