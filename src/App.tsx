import 'bulma/css/bulma.css';
import classNames from 'classnames';
import moment from 'moment';
import * as React from 'react';
// @ts-ignore for HashLink which has no TypeScript types
import { HashLink } from 'react-router-hash-link';
import * as ReactTooltip from 'react-tooltip';
import './App.css';
import { Dropdown } from './Components/Dropdown';
import Footer from './Components/Footer';
import Header, { HasMarketsSummary } from './Components/Header';
import { Observer, ObserverOwner } from './Components/observer';
import { Currency } from './Currency';
import { CurrencyDropdown } from './Currency/CurrencyDropdown';
import { Market, MarketsSummary } from './generated/markets_pb';
import { defaultMarketSortOrder, filterMarketsAboveLiquidityRetentionRatioCutoff, getSavedLiquidityTranchePreference, getSavedMarketSortOrderPreference, makeLiquiditySortKey, MarketSortFunctions, MarketSortOrder, marketSortOrders, saveLiquidityTranchePreference, saveMarketSortOrderPreference } from './MarketSort';
import OneMarketSummary from './OneMarketSummary';
import { smartRoundThreeDecimals } from './Price';
import { getQueryString, updateQueryString } from "./url";

// example of changing moment language globally to fr; only works since fr was imported.
// import 'moment/locale/fr';
// moment.locale('fr');

type Props = HasMarketsSummary & {
  currencySelectionObserverOwner: ObserverOwner<Currency>
  marketSortFunctions: MarketSortFunctions
}

export class Home extends React.Component<Props> {
  public constructor(props: Props) {
    super(props);
  }

  public render(): JSX.Element {
    const { currencySelectionObserverOwner, marketSortFunctions } = this.props;
    const currencySelectionObserver = currencySelectionObserverOwner.observer;
    const ms: MarketsSummary = this.props.ms;
    const lmc = ms.getLiquidityMetricsConfig();
    const liquidityTranches = lmc !== undefined ? lmc.getMillietherTranchesList() : [];
    return (
      <div>
        <Header ms={ms} currencySelectionObserver={currencySelectionObserver}
          doesClickingLogoReloadPage={true}
          headerContent={
          <div className="has-text-centered content">
            <p><strong>See What the World Thinks.</strong></p>
            <p>
              Prediction Markets powered by Augur. Each market trades on the <a href="https://augur.net"
                target="_blank">Augur</a>
              {' decentralized prediction market platform, built on the Ethereum blockchain.'}
            </p>
          </div>
        } />
        <div className="container">
          <MarketList currencySelectionObserverOwner={currencySelectionObserverOwner}
            currencySelectionObserver={currencySelectionObserver}
            liquidityTranches={liquidityTranches}
            marketList={ms.getMarketsList()}
            marketSortFunctions={marketSortFunctions} />
        </div>
        {Footer}
      </div>
    );
  }
}

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
  liquidityTranches: number[],
  marketList: Market[],
  marketSortFunctions: MarketSortFunctions,
  currencySelectionObserver: Observer<Currency>,
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

// TODO create a UIMarket type as a wrapper for Market, which constructs stuff like getMarketCategory() and a moment(endDate) once at in MarketList constructor, instead of each re-render. Note that Market.AsObject is provided by protobuf, so we don't necessarily want to create a complete 3rd type. We also don't want to aggressively call Market.AsObject, it is really expensive and Market itself is quite optimized by protobuf. Current preference is UIMarket { m: Market, ... newStuff }, so that only new fields are declared directly in UIMarket.
interface MarketListState {
  category: MarketCategory,
  liquidityTranche: number,
  paginationLimit: number,
  paginationOffset: number,
  searchQuery: string,
  showEnded: boolean,
  marketSortOrder: MarketSortOrder,
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

    const showEnded = getQueryString('e') === '1';

    this.state = {
      category,
      liquidityTranche: getSavedLiquidityTranchePreference() || props.liquidityTranches[0] || 0,
      marketSortOrder: getSavedMarketSortOrderPreference(),
      paginationLimit,
      paginationOffset,
      searchQuery: '',
      showEnded,
      topOfMarketList: React.createRef(),
    };
  }

  public componentDidUpdate() {
    // When changing pages, react tooltip needs to be updated with the new data-tip attributes
    ReactTooltip.rebuild();
  }

  public render() {
    const { liquidityTranches, marketList, marketSortFunctions, currencySelectionObserver } = this.props;
    const { liquidityTranche, paginationLimit, paginationOffset, showEnded, marketSortOrder, searchQuery, category } = this.state;

    const filteredMarketList: Market[] = (() => {
      let ms = marketList.filter((m: Market) => category === MarketCategory.All || getMarketCategory(m) === category);
      if (!showEnded) {
        ms = ms.filter((m: Market) => moment.unix(m.getEndDate()).isAfter(now));
      }
      if (searchQuery.length > 0) {
        // Basic fuzzy text search
        ms = ms.filter((m: Market) => m.getName().toLowerCase().replace(whitespaceGlobalRegexp, '').indexOf(searchQuery) !== -1 || m.getId().indexOf(searchQuery) !== -1);
      }

      let sortFn: ((a: Market, b: Market) => number) | undefined;
      if (marketSortOrder === MarketSortOrder.LIQUIDITY) {
        // Liquidity sort functions are dynamically generated for each liquidity tranche sent from backend, so we must look up sort function dynamically.
        sortFn = marketSortFunctions.get(makeLiquiditySortKey(liquidityTranche));

        // When sorting by liquidity, we also filter out markets with retention ratios below a threshold
        ms = ms.filter(filterMarketsAboveLiquidityRetentionRatioCutoff.bind(null, liquidityTranche));
      } else {
        sortFn = marketSortFunctions.get(marketSortOrder);
      }
      if (sortFn !== undefined) {
        ms.sort(sortFn);
      }
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
            <CurrencyDropdown currencySelectionObserver={currencySelectionObserver} onChange={this.setCurrency} />
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
                    currentValueOrObserver={marketSortOrder}
                    onChange={this.setMarketSortOrder}
                    values={marketSortOrders} />
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
                  Page {this.state.paginationOffset + 1}
                </span>
              )
            }
            <span className="reset-filters" onClick={this.resetFilters}>
              <a>Reset</a>
            </span>
            <label className="checkbox">
              Show Ended Markets&nbsp;
              <input type="checkbox" onChange={this.setShowEnded} checked={this.state.showEnded} />
            </label>
          </div>
          <div className="column has-text-centered">
            <div className="search">
              <input className="input" type="text" placeholder="Search for market name or id" onChange={this.setSearchQuery} />
              <i className="fas fa-search" />
            </div>
          </div>
        </div>
        { marketSortOrder === MarketSortOrder.LIQUIDITY && <div className="market-list-controls columns is-centered is-vcentered is-mobile is-multiline">
          <div className="column is-12-mobile is-6-tablet is-6-desktop has-text-centered">
            <p>When sorting by liquidity, markets with both depth and a narrow spread rank better. Markets with poor liquidity are not shown. <HashLink to="/faq#sort-by-liquidity">Learn more.</HashLink></p>
          </div>
          <div className="column is-narrow level is-mobile">
            <div className="level-left" >
              <div className="level-item liquidity-tranche-label">
                Target Liquidity&nbsp;
              </div>
            </div>
            <div className="level-right" >
              <div className="level-item liquidity-tranche-box">
                <Dropdown
                  currentValueOrObserver={liquidityTranche}
                  onChange={this.setLiquidityTranche}
                  values={liquidityTranches}
                  renderValue={renderLiquidityTranche}
                />
              </div>
            </div>
          </div>
        </div> }
        {
          filteredMarketList.length < 1 ?
            <div className="columns is-vcentered">
              <div className="column content has-text-centered">
                {/* Currently market list can be empty for two reasons: no search results or liquidity tranche has no markets */}
                { this.state.searchQuery.length > 0 ? <div>
                    <strong>No Search Results</strong>
                    <p>Please search on market name or id.</p>
                  </div> : <div>
                    <strong>No Markets With This Target Liquidity</strong>
                  </div>
                }
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
              <br />
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

  private setMarketSortOrder = (marketSortOrder: MarketSortOrder) => {
    saveMarketSortOrderPreference(marketSortOrder);
    this.setState({
      marketSortOrder,
    });
    this.setPaginationOffset(0, { scrollIntoView: false }); // go back to first page of results when switching sort order
  };

  private setCategory = (category: MarketCategory) => {
    updateQueryString('c', category);
    this.setState({
      category,
    });
    this.setPaginationOffset(0, { scrollIntoView: false }); // go back to first page of results when switching category
  };

  // https://reactjs.org/docs/faq-functions.html
  private setCurrency = (currency: Currency) => {
    if (this.props.currencySelectionObserverOwner) {
      this.props.currencySelectionObserverOwner.setValueAndNotifyObservers(currency);
    }
  };

  private setLiquidityTranche = (liquidityTranche: number) => {
    // if liquidityTranche is first one in props.liquidityTranches, assume it's the default and remove queryString
    saveLiquidityTranchePreference(liquidityTranche === this.props.liquidityTranches[0] ? undefined : liquidityTranche);
    this.setState({
      liquidityTranche,
    });
    this.setPaginationOffset(0, { scrollIntoView: false }); // go back to first page of results when switching liquidity tranche
  };

  private setPaginationOffset = (paginationOffset: number, opts?: { scrollIntoView: boolean }) => {
    updateQueryString('p', paginationOffset === 0 ? undefined : paginationOffset + 1);
    this.setState({
      paginationOffset,
    });
    let scrollIntoView: boolean = true; // ie. by default scroll into view
    // WARNING setPaginationOffset() is used in function.bind(), and bind() causes TypeScript to lose all typing information, so we do an explicit check for opts.
    if (typeof opts === 'object' && typeof opts.scrollIntoView === 'boolean') {
      scrollIntoView = opts.scrollIntoView;
    }
    if (scrollIntoView && this.state.topOfMarketList.current !== null) {
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
      liquidityTranche: this.props.liquidityTranches[0] || 0,
      marketSortOrder: defaultMarketSortOrder,
      paginationOffset: 0,
      searchQuery: '',
      showEnded: false,
    });
  };
}

function renderLiquidityTranche(millietherTranche: number): React.ReactNode {
  // We decided to show this only in ETH (as opposed to in user's currency preference) because liquidity sort is a trader tool, they think in ETH, and at the time of coding there was an extra burden to use Price2 because the exchangeRates weren't immediately accessible.
  return `${smartRoundThreeDecimals(millietherTranche/1000)} Ξ`;
}
