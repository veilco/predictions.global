import 'bulma/css/bulma.css';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import './App.css';
import { Currency, renderCurrency } from './Currency';
import Footer from './Footer';
import { Market, MarketsSummary } from './generated/markets_pb';
import Header, { HasMarketsSummary } from './Header';
import { makeObserverOwner, ObserverOwner, Observer } from './observer';
import OneMarketSummary from './OneMarketSummary';
import { Dropdown } from './Dropdown';
import * as classNames from 'classnames';
import { getQueryString, updateQueryString } from "./url";

// example of changing moment language globally to fr; only works since fr was imported.
// import 'moment/locale/fr';
// moment.locale('fr');

interface State {
  currencySelectionObserverOwner: ObserverOwner<Currency> | undefined
}

export class Home extends React.Component<HasMarketsSummary, State> {
  public readonly state: State;

  public constructor(props: HasMarketsSummary) {
    super(props);

    // Cache currency in localStorage as is most likely long term preference
    const localStorageCurrency = localStorage.getItem('currency');
    const currency: Currency = new Set(Object.keys(Currency).map(k => Currency[k])).has(localStorageCurrency) ? (localStorageCurrency as Currency) : Currency.USD;

    const o = makeObserverOwner(currency);
    o.observer.subscribe((newCurrency) => localStorage.setItem('currency', newCurrency));
    this.state = {
      currencySelectionObserverOwner: o,
    };
  }

  public render(): JSX.Element {
    if (this.state.currencySelectionObserverOwner === undefined) {
      // this never occurs because currencySelectionObserverOwner is synchronously constructed in the constructor.
      return <div />;
    }

    const { currencySelectionObserverOwner } = this.state;
    const currencySelectionObserver = this.state.currencySelectionObserverOwner.observer;
    const ms: MarketsSummary = this.props.ms;
    return (
      <div>
        <Header ms={ms} currencySelectionObserver={currencySelectionObserver} />
        <section className="less-padding-bottom section">
          <div className="columns is-centered is-marginless is-paddingless is-vcentered">
            <div className="column is-12-mobile is-5-tablet is-5-desktop">
              {/* NB logo is fixed width and column must be larger than this or logo column will bleed into next column. The fixed width value in App.scss was chosen to make logo look good responsively. */}
              <a href={`${window.location.protocol}//${window.location.host}`}>
                <img className="logo" src="logo.png" />
              </a>
            </div>
            <div className="column is-12-mobile is-5-tablet is-5-desktop has-text-centered content">
              <p><strong>See What the World Thinks.</strong></p>
              <p>
                Prediction Markets powered by Augur. Each market trades on the <a href="https://augur.net"
                target="blank">Augur</a>
                {' decentralized prediction market platform, built on the Ethereum blockchain.'}
              </p>
            </div>
          </div>
        </section>
        <div className="container">
          <MarketList currencySelectionObserverOwner={currencySelectionObserverOwner}
            currencySelectionObserver={currencySelectionObserver} marketList={ms.getMarketsList()} />
        </div>
        {Footer}
      </div>
    );
  }
}

function isFeaturedGoesFirst(a: Market, b: Market): number {
  const af = a.getIsFeatured();
  const bf = b.getIsFeatured();
  if (af && !bf) {
    return -1;
  }
  if (bf && !af) {
    return 1;
  }
  return 0;
}

type sortKey = 'Recently Traded' | 'Money at Stake' | 'New Markets' | 'Ending Soon';

const sortOrders: Map<sortKey, (a: Market, b: Market) => number> = new Map<sortKey, (a: Market, b: Market) => number>([
  ['Recently Traded', (a: Market, b: Market) => {
    const maybeFeatured = isFeaturedGoesFirst(a, b);
    if (maybeFeatured !== 0) {
      return maybeFeatured;
    }
    return b.getLastTradeTime() - a.getLastTradeTime();
  }],
  ['Money at Stake', (a: Market, b: Market) => {
    const maybeFeatured = isFeaturedGoesFirst(a, b);
    if (maybeFeatured !== 0) {
      return maybeFeatured;
    }
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
  ['New Markets', (a: Market, b: Market) => {
    const maybeFeatured = isFeaturedGoesFirst(a, b);
    if (maybeFeatured !== 0) {
      return maybeFeatured;
    }
    return b.getCreationTime() - a.getCreationTime();
  }],
  ['Ending Soon', (a: Market, b: Market) => {
    const maybeFeatured = isFeaturedGoesFirst(a, b);
    if (maybeFeatured !== 0) {
      return maybeFeatured;
    }
    return a.getEndDate() - b.getEndDate();
  }]
]);
const paginationLimits = [10, 20, 50];

// MarketCategory is our own curated category enum based on empirical survey of size of live categories in Augur App.
// Example of strong typed array of MarketCategory: `Object.keys(MarketCategory).map(key => MarketCategory[key]) as MarketCategory[]`
enum MarketCategory {
  All = 'All', // Wildcard category that matches any and all categories
  Sports = 'Sports',
  Cryptocurrency = 'Cryptocurrency',
  Finance = 'Finance',
  Other = 'Other',
}

const cryptocurrencyMarketCategoryRegexp = /ethereum| ether|ether |bitcoin|btc| crypto|crypto |cryptocurrenc|flippening/;
const financeMarketCategoryRegexp = / trade|trade | trading|trading | price|price | credit|credit /;

function getMarketCategory(m: Market): MarketCategory {
  const c = m.getCategory().toLowerCase();
  const n = m.getName().toLowerCase();
  if (c === 'sports' || c === 'sport') {
    return MarketCategory.Sports;
  } else if (c === 'cryptocurrency' || c === 'cryptocurrencies' || n.search(cryptocurrencyMarketCategoryRegexp) > -1) {
    return MarketCategory.Cryptocurrency;
  } else if (c === 'finance' || n.search(financeMarketCategoryRegexp) > -1) {
    // finance must occur after crypto so as to avoid capturing words like "trade"
    return MarketCategory.Finance;
  }
  return MarketCategory.Other;
}

const whitespaceGlobalRegexp = /\s+/g;

interface MarketListProps {
  marketList: Market[],
  currencySelectionObserver: Observer<Currency>,
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

// TODO create a UIMarket type as a wrapper for Market, which constructs stuff like getMarketCategory() and a moment(endDate) once at in MarketList constructor, instead of each re-render. Note that Market.AsObject is provided by protobuf, so we don't necessarily want to create a complete 3rd type. We also don't want to aggressively call Market.AsObject, it is really expensive and Market itself is quite optimized by protobuf. Current preference is UIMarket { m: Market, ... newStuff }, so that only new fields are declared directly in UIMarket.
interface MarketListState {
  category: MarketCategory,
  paginationLimit: number,
  paginationOffset: number,
  searchQuery: string,
  showEnded: boolean,
  sortOrder: sortKey,
  topOfMarketList: React.RefObject<HTMLDivElement>,
}

class MarketList extends React.Component<MarketListProps, MarketListState> {
  public readonly state: MarketListState;

  constructor(props: MarketListProps) {
    super(props);

    const paginationOffsetQuery = parseInt(getQueryString('p'), 10);
    const paginationOffset = isNaN(paginationOffsetQuery) ? 0 : paginationOffsetQuery - 1;
    const paginationLimitQuery = parseInt(localStorage.getItem('paginationLimit') || '', 10);
    const paginationLimit = isNaN(paginationLimitQuery) ? paginationLimits[0] :
      Math.min(Math.max(paginationLimitQuery, paginationLimits[0]), paginationLimits[paginationLimits.length - 1]);

    const categoryQuery = getQueryString('c');
    const category: MarketCategory = new Set(Object.keys(MarketCategory).map(k => MarketCategory[k])).has(categoryQuery) ? (categoryQuery as MarketCategory) : MarketCategory.All;

    const sortOrder: sortKey = (() => {
      const sortOrderQuery = getQueryString('s');
      // TODO should have used an enum for sortKey
      if (sortOrderQuery === 'New Markets') {
        return sortOrderQuery;
      } else if (sortOrderQuery === 'Ending Soon') {
        return sortOrderQuery;
      } else if (sortOrderQuery === 'Money at Stake') {
        return sortOrderQuery;
      }
      return 'Recently Traded';
    })();

    const showEnded = getQueryString('e') === '1';

    this.state = {
      category,
      paginationLimit,
      paginationOffset,
      searchQuery: '',
      showEnded,
      sortOrder,
      topOfMarketList: React.createRef(),
    };
  }

  public componentDidUpdate() {
    // When changing pages, react tooltip needs to be updated with the new data-tip attributes
    ReactTooltip.rebuild();
  }

  public render() {
    const { marketList, currencySelectionObserver } = this.props;
    const { paginationLimit, paginationOffset, showEnded, sortOrder, searchQuery, category } = this.state;

    const filteredMarketList: Market[] = (() => {
      let ms = marketList.filter((m: Market) => category === MarketCategory.All || getMarketCategory(m) === category);
      if (!showEnded) {
        ms = ms.filter((m: Market) => moment.unix(m.getEndDate()).isAfter(now));
      }
      if (searchQuery.length > 0) {
        // Basic fuzzy text search
        ms = ms.filter((m: Market) => m.getName().toLowerCase().replace(whitespaceGlobalRegexp, '').indexOf(searchQuery) !== -1 || m.getId().indexOf(searchQuery) !== -1);
      }
      ms.sort(sortOrders.get(sortOrder))
      return ms;
    })();

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
    if (paginationIndex > 1) {
      paginationIndices.splice(1, 0, -1);
    }

    if (paginationIndex < numberOfPages - 2) {
      paginationIndices.splice(paginationIndices.length - 1, 0, -2);
    }

    const now = moment();

    return (
      <section className="less-padding-top section">
        <ReactTooltip /> {/* <ReactTooltip /> is extremely non-performant and we want only one of these in entire React tree. */}
        <div className="market-list-controls columns is-centered is-vcentered is-mobile is-multiline">
          <div ref={this.state.topOfMarketList}
            className="column is-paddingless has-text-centered-mobile is-6-mobile has-text-left-tablet has-text-left-desktop">
            <p><strong>Prediction Markets</strong></p>
          </div>
          <div className="column is-narrow">
            <Dropdown
              currentValueOrObserver={currencySelectionObserver}
              onChange={this.setCurrency}
              renderValue={renderCurrency}
              values={[Currency.USD, Currency.ETH, Currency.BTC]} />
          </div>
          <div className="column is-narrow">
            <div className="level is-mobile" >
              <div className="level-left" >
                <div className="level-item sort-by-label">
                  Sort By&nbsp;
                </div>
              </div>
              <div className="level-right" >
                <div className="level-item sort-by-box">
                  <Dropdown
                    currentValueOrObserver={sortOrder}
                    onChange={this.setSortOrder}
                    values={Array.from(sortOrders.keys())} />
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="level is-mobile" >
              <div className="level-left" >
                <div className="level-item category-label">
                  Category&nbsp;
                </div>
              </div>
              <div className="level-right" >
                <div className="level-item category-box">
                  <Dropdown
                    currentValueOrObserver={category}
                    onChange={this.setCategory}
                    values={Object.keys(MarketCategory).map(key => MarketCategory[key])} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="market-list-controls columns is-centered is-vcentered">
          {/* this spacer column causes "Show Ended Markets" and Search box to be left and right-aligned, respectively */}
          <div className="column is-hidden-mobile is-3" />
          <div className="column has-text-centered">
            {
              this.state.paginationOffset > 0 && (
                <span className="page-number">
                  Page {this.state.paginationOffset+1}
                </span>
              )
            }
            <span className="reset-filters" onClick={this.resetFilters}>
              <a>Reset</a>
            </span>
            <label className="checkbox">
              Show Ended Markets&nbsp;
              <input type="checkbox" onChange={this.setShowEnded} checked={this.state.showEnded}/>
            </label>
          </div>
          <div className="column has-text-centered">
            <div className="search">
              <input className="input" type="text" placeholder="Search for market name or id" onChange={this.setSearchQuery} />
              <i className="fas fa-search" />
            </div>
          </div>
        </div>
        {
      filteredMarketList.length < 1 ?
        <div className="columns is-vcentered">
          <div className="column content has-text-centered">
            <strong>No Search Results</strong>
            <p>Please search on market name or id.</p>
          </div>
        </div> :
        <div>
          {filteredMarketList
            .slice(paginationStart, paginationEnd)
            .map((m: Market, index: number) => (
              <OneMarketSummary
                key={paginationStart + index}
                now={now}
                currencySelectionObserver={currencySelectionObserver}
                m={m}
                index={paginationStart + index} />)
            )}
          <br/>
          <div className="columns is-vcentered">
            <div className="column is-narrow">
              <div className="columns is-vcentered is-mobile">
                <div className="column is-narrow">
                  <label>
                    Markets Per Page
                  </label>
                </div>
                <div className="column is-narrow is-paddingless">
                  <Dropdown
                    currentValueOrObserver={paginationLimit}
                    onChange={this.setPaginationLimit}
                    values={paginationLimits}
                  />
                </div>
              </div>
            </div>
            <div className="column">
              <nav className="pagination" role="navigation" aria-label="pagination">
                <label>
                  &nbsp;&nbsp;Page&nbsp;
                </label>
                {paginationIndex > 0 && (
                  <a className="pagination-previous" onClick={this.setPaginationOffset.bind(this, paginationIndex - 1)}>Prev</a>)}
                {paginationIndex < numberOfPages - 1 && (
                  <a className="pagination-next"
                     onClick={this.setPaginationOffset.bind(this, paginationIndex + 1)}>Next</a>)}
                <ul className="pagination-list">
                  {paginationIndices.map((page: number) => page < 0 ? (
                    <li key={page}>
                      <span className="pagination-ellipsis">&hellip;</span>
                    </li>
                  ) : (
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
    }
      </section>
    );
  }

  private setSortOrder = (sortOrder: sortKey) => {
    updateQueryString('s', sortOrder);
    this.setState({
      sortOrder,
    });
  };

  private setCategory = (category: MarketCategory) => {
    updateQueryString('c', category);
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
    updateQueryString('p', paginationOffset + 1);
    this.setState({
      paginationOffset,
    });
    if (this.state.topOfMarketList.current !== null) {
      this.state.topOfMarketList.current.scrollIntoView(true);
    }
  };

  private setPaginationLimit = (paginationLimit: number) => {
    localStorage.setItem('paginationLimit', paginationLimit.toString());
    this.setState({
      paginationLimit,
    });
  };

  private setShowEnded = () => {
    const newShowEnded = !this.state.showEnded;
    updateQueryString('e', newShowEnded ? '1' : '0');
    this.setState({
      showEnded: newShowEnded,
    });
  };

  private setSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery: string = e.target.value.toLowerCase().replace(whitespaceGlobalRegexp, '');
    this.setState({
      searchQuery,
    })
  };

  private resetFilters = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    window.history.pushState({}, '', '/'); // remove all query strings, which right now is the same thing as resetting filters.
    this.setState({
      category: MarketCategory.All,
      paginationOffset: 0,
      searchQuery: '',
      showEnded: false,
      sortOrder: 'Money at Stake',
    });
  };
}
