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

    return bCapitalization.getUsd() - aCapitalization.getUsd()
  }],
  ['New Markets', (a: Market, b: Market) => b.getCreationTime() - a.getCreationTime()],
  ['Ending Soon', (a: Market, b: Market) => a.getEndDate() - b.getEndDate()]
]);
const paginationLimits = [10, 20, 50];

// Wildcard category that matches any and all categories
const allCategory = 'All';

interface MarketListProps {
  marketList: Market[],
  currencySelectionObserver: Observer<Currency>,
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

interface MarketListState {
  category: string,
  categoryOwner: ObserverOwner<string>,
  paginationLimit: number,
  paginationLimitOwner: ObserverOwner<number>,
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

    const paginationOffsetQuery = parseInt(getQueryString('page'), 10);
    const paginationOffset = isNaN(paginationOffsetQuery) ? 0 : paginationOffsetQuery;
    const paginationLimitQuery = parseInt(getQueryString('limit'), 10);
    const paginationLimit = isNaN(paginationLimitQuery) ? paginationLimits[0] :
      Math.min(Math.max(paginationLimitQuery, paginationLimits[0]), paginationLimits[paginationLimits.length - 1]);

    this.state = {
      category: allCategory,
      categoryOwner: makeObserverOwner(allCategory),
      paginationLimit,
      paginationLimitOwner: makeObserverOwner(10),
      paginationOffset,
      searchQuery: '',
      showEnded: false,
      sortOrder: 'Money at Stake',
      sortOrderOwner: makeObserverOwner(sortOrders.keys().next().value),
    };
  }

  public render() {
    const {marketList, currencySelectionObserver} = this.props;
    const {paginationLimit, paginationLimitOwner, paginationOffset, showEnded, sortOrder, sortOrderOwner, searchQuery, category, categoryOwner} = this.state;

    // Possible to optimize by only updating when props received
    const categories = [allCategory].concat(Array.from(marketList.reduce((acc: Set<string>, market: Market) => acc.add(market.getCategory()), new Set()).values()));

    const filteredMarketList = marketList
      .filter((market: Market) => category === allCategory || market.getCategory() === category)
      .filter((market: Market) => showEnded || moment.unix(market.getEndDate()).isAfter())

      // Basic fuzzy text search
      .filter((market: Market) => market.getName().toLowerCase().replace(' ', '').indexOf(searchQuery) !== -1)
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
        <div className="columns is-centered is-vcentered is-mobile is-multiline">
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
            <Selector
              currentValueObserver={sortOrderOwner.o}
              renderValue={this.renderSortOrder}
              setValue={this.setSortOrder}
              values={Array.from(sortOrders.keys())}/>
          </div>
          <div className="column is-narrow">
            <Selector
              currentValueObserver={categoryOwner.o}
              renderValue={this.renderCategory}
              setValue={this.setCategory}
              values={categories}/>
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
                <a className="pagination-previous" onClick={this.setPaginationOffset.bind(this, paginationIndex - 1)}>Prev
                  Page</a>)}
              {paginationIndex < numberOfPages - 1 && (
                <a className="pagination-next" onClick={this.setPaginationOffset.bind(this, paginationIndex + 1)}>Next
                  Page</a>)}
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
    updateQueryString('page', paginationOffset);
    this.setState({
      paginationOffset,
    });
  };

  private renderPaginationLimit = (paginationLimit: number) => (paginationLimit);

  private setPaginationLimit = (paginationLimit: number) => {
    updateQueryString('limit', paginationLimit);
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
