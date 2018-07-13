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
import {getQueryString, updateQueryString} from "./url";

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
        <Header ms={ms} currencySelectionObserver={currencySelectionObserver}/>
        <section className="less-padding-bottom section">
          <div className="columns is-centered is-marginless is-paddingless is-vcentered">
            <div className="column is-12-mobile is-5-tablet is-5-desktop">
              {/* NB logo is fixed width and column must be larger than this or logo column will bleed into next column. The fixed width value in App.scss was chosen to make logo look good responsively. */}
              <img className="logo" src="logo.png"/>
            </div>
            <div className="column is-12-mobile is-5-tablet is-5-desktop has-text-centered content">
              <p><strong>See What the World Thinks.</strong></p>
              <p>
                Prediction Markets powered by Augur. Each market trades on the <a href="https://augur.net" target="blank">Augur</a>
                {' decentralized prediction market platform, built on the Ethereum blockchain.'}
              </p>
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

type sortKey = 'Money at Stake' | 'New Markets' | 'Ending Soon';

const sortOrders: Map<sortKey, (a: Market, b: Market) => number> = new Map<sortKey, (a: Market, b: Market) => number> ([
  ['Money at Stake', (a: Market, b: Market) => {
    const aCapitalization = a.getMarketCapitalization();
    const bCapitalization = b.getMarketCapitalization();
    if (aCapitalization == null) {
      return -1;
    }

    if (bCapitalization == null) {
      return 1;
    }

    return bCapitalization.getUsd() - aCapitalization.getUsd()
  }],
  ['New Markets', (a: Market, b: Market) => b.getCreationTime() - a.getCreationTime()],
  ['Ending Soon', (a: Market, b: Market) => a.getEndDate() - b.getEndDate()]
]);
const paginationLimits = [10, 20, 50];

// MarketCategory is our own curated category enum based on empirical survey of size of live categories in Augur App.
enum MarketCategory {
  All = 'All', // Wildcard category that matches any and all categories
  WorldCup = 'World Cup',
  Sports = 'Sports',
  Cryptocurrency = 'Cryptocurrency',
  Finance = 'Finance',
  Other = 'Other',
}

const cryptocurrencyMarketCategoryRegexp = /ethereum| ether|ether |bitcoin|btc| crypto|crypto |cryptocurrenc|flippening/;
const financeMarketCategoryRegexp = / trade|trade | trading|trading | price|price | credit|credit /;
const fifaRegexp = / fifa|fifa |world cup/;

function getMarketCategory(m: Market): MarketCategory {
  const c = m.getCategory().toLowerCase();
  const n = m.getName().toLowerCase();
  if (c === 'world cup' || n.search(fifaRegexp) > -1) {
    return MarketCategory.WorldCup;
  } else if (c === 'sports' || c === 'sport') {
    return MarketCategory.Sports;
  } else if (c === 'cryptocurrency' || c === 'cryptocurrencies' || n.search(cryptocurrencyMarketCategoryRegexp) > -1) {
    return MarketCategory.Cryptocurrency;
  } else if (c === 'finance' || n.search(financeMarketCategoryRegexp) > -1) {
    // finance must occur after crypto so as to avoid capturing words like "trade"
    return MarketCategory.Finance;
  }
  return MarketCategory.Other;
}

interface MarketListProps {
  marketList: Market[],
  currencySelectionObserver: Observer<Currency>,
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

// TODO create a UIMarket type as a wrapper for Market, which constructs stuff like getMarketCategory() and a moment(endDate) once at in MarketList constructor, instead of each re-render. Note that Market.AsObject is provided by protobuf, so we don't necessarily want to create a complete 3rd type. We also don't want to aggressively call Market.AsObject, it is really expensive and Market itself is quite optimized by protobuf. Current preference is UIMarket { m: Market, ... newStuff }, so that only new fields are declared directly in UIMarket.
interface MarketListState {
  category: MarketCategory,
  categoryOwner: ObserverOwner<MarketCategory>,
  paginationLimit: number,
  paginationLimitOwner: ObserverOwner<number>,
  paginationOffset: number,
  searchQuery: string,
  showEnded: boolean,
  sortOrder: sortKey,
  sortOrderOwner: ObserverOwner<sortKey>,
}

class MarketList extends React.Component<MarketListProps, MarketListState> {
  public readonly state: MarketListState;

  constructor(props: MarketListProps) {
    super(props);

    const paginationOffsetQuery = parseInt(getQueryString('page'), 10);
    const paginationOffset = isNaN(paginationOffsetQuery) ? 0 : paginationOffsetQuery - 1;
    const paginationLimitQuery = parseInt(localStorage.getItem('paginationLimit') || '', 10);
    const paginationLimit = isNaN(paginationLimitQuery) ? paginationLimits[0] :
      Math.min(Math.max(paginationLimitQuery, paginationLimits[0]), paginationLimits[paginationLimits.length - 1]);

    this.state = {
      category: MarketCategory.All,
      categoryOwner: makeObserverOwner(MarketCategory.All),
      paginationLimit,
      paginationLimitOwner: makeObserverOwner(10),
      paginationOffset,
      searchQuery: '',
      showEnded: false,
      sortOrder: 'Money at Stake',
      sortOrderOwner: makeObserverOwner(sortOrders.keys().next().value),
    };
  }

  public componentDidUpdate() {
    // When changing pages, react tooltip needs to be updated with the new data-tip attributes
    ReactTooltip.rebuild();
  }

  public render() {
    const {marketList, currencySelectionObserver} = this.props;
    const {paginationLimit, paginationLimitOwner, paginationOffset, showEnded, sortOrder, sortOrderOwner, searchQuery, category, categoryOwner} = this.state;

    const filteredMarketList = marketList
      .filter((m: Market) => category === MarketCategory.All || getMarketCategory(m) === category)
      .filter((m: Market) => showEnded || moment.unix(m.getEndDate()).isAfter())
      // Basic fuzzy text search
      .filter((m: Market) => m.getName().toLowerCase().replace(' ', '').indexOf(searchQuery) !== -1)
      .sort(sortOrders.get(sortOrder));

    const numberOfPages = Math.ceil(filteredMarketList.length / paginationLimit);

    // Index may be out of bounds if user changes query parameter
    const paginationIndex = Math.min(Math.max(paginationOffset, 0), numberOfPages - 1);
    const paginationStart = paginationLimit * paginationIndex;
    const paginationEnd = paginationLimit * (paginationIndex + 1);

    // Show the following pages unless they overlap: first, previous, current, next, last
    const paginationIndices = Array.from(new Set([
      1,
      Math.max(paginationIndex, 1),
      paginationIndex + 1,
      Math.min(paginationIndex + 2, numberOfPages),
      numberOfPages]
    ).values());

    // Negative page indices represents ellipses
    if(paginationIndex > 1) {
      paginationIndices.splice(1, 0, -1);
    }

    if(paginationIndex < numberOfPages - 2) {
      paginationIndices.splice(paginationIndices.length - 1, 0, -2);
    }

    const now = moment();

    return (
      <section className="less-padding-top section">
        <ReactTooltip /> {/* <ReactTooltip /> is extremely non-performant and we want only one of these in entire React tree. */}
        <div className="columns is-centered is-vcentered is-mobile is-multiline is-variable is-1">
          <div
            className="column is-paddingless has-text-centered-mobile has-text-left-tablet has-text-left-desktop">
            <p><strong>Prediction Markets</strong></p>
          </div>
          <div className="column is-narrow">
            <Selector
              currentValueObserver={currencySelectionObserver}
              renderValue={renderCurrency}
              setValue={this.setCurrency}
              values={[Currency.USD, Currency.ETH, Currency.BTC]}/>
          </div>
          <div className="column is-narrow">
            Sort By
          </div>
          <div className="column is-narrow">
            <Selector<sortKey>
              currentValueObserver={sortOrderOwner.o}
              renderValue={this.renderSortOrder}
              setValue={this.setSortOrder}
              values={Array.from(sortOrders.keys())}/>
          </div>
          <div className="column is-narrow">
            Category
          </div>
          <div className="column is-narrow">
            <Selector
              currentValueObserver={categoryOwner.o}
              renderValue={this.renderCategory}
              setValue={this.setCategory}
              values={Object.keys(MarketCategory).map(k => MarketCategory[k])}/>
          </div>
          <div className="column is-narrow">
            <label className="checkbox">
              <input type="checkbox" onChange={this.setShowEnded}/>&nbsp;
              Show Ended Markets
            </label>
          </div>
          <div className="column is-narrow">
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
        <div className="columns is-vcentered">
          <div className="column is-narrow is-paddingless">
            <label>
              Markets Per Page
            </label>
          </div>
          <div className="column is-narrow">
            <Selector
              currentValueObserver={paginationLimitOwner.o}
              renderValue={this.renderPaginationLimit}
              setValue={this.setPaginationLimit}
              values={paginationLimits}
            />
          </div>
          <div className="column">
            <nav className="pagination" role="navigation" aria-label="pagination">
              <label>
                &nbsp;&nbsp;Page&nbsp;
              </label>
              {paginationIndex > 0 && (
                <a className="pagination-previous" onClick={this.setPaginationOffset.bind(this, paginationIndex - 1)}>Prev</a>)}
              {paginationIndex < numberOfPages - 1 && (
                <a className="pagination-next" onClick={this.setPaginationOffset.bind(this, paginationIndex + 1)}>Next Page</a>)}
              <ul className="pagination-list">
                { paginationIndices.map((page: number) => page < 0 ? (
                  <li key={page}>
                    <span className="pagination-ellipsis">&hellip;</span>
                  </li>
                ) :(
                  <li key={page}>
                    <a
                      className={classNames('pagination-link', page === (paginationIndex + 1) && 'is-current')}
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
        </div>
        </div>
      </section>
    );
  }

  private renderSortOrder = (sortOrder: sortKey) => (sortOrder);

  private setSortOrder = (sortOrder: sortKey) => {
    this.setState({
      sortOrder,
    });
  };

  private renderCategory = (category: string) => (category);

  private setCategory = (category: MarketCategory) => {
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
    updateQueryString('page', paginationOffset + 1);
    this.setState({
      paginationOffset,
    });
  };

  private renderPaginationLimit = (paginationLimit: number) => (paginationLimit);

  private setPaginationLimit = (paginationLimit: number) => {
    localStorage.setItem('paginationLimit', paginationLimit.toString());
    this.setState({
      paginationLimit,
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
