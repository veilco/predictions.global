import * as React from 'react';
import {RouteComponentProps} from "react-router";
import {BrowserRouter as Router, Link, Route, Switch} from 'react-router-dom';
import {Home} from './App';
import {Currency, getSavedCurrencyPreference, saveCurrencyPreference} from './Currency';
import {EmbeddedMarketCard} from './EmbeddedMarketCard';
import {MarketsSummary} from "./generated/markets_pb";
import {LoadingHTML} from './Loading';
import {MarketDetailPage, marketDetailPageURLPrefix, URLParams} from './MarketDetailPage';
import {makeObserverOwner, ObserverOwner, Observer} from './observer';
import PublicEthereumNodes from './PublicEthereumNodes';
import ScrollToTop from './ScrollToTop';
import {AugurFeeWindowInfo} from './AugurFeeWindowInfo/AugurFeeWindowInfo';

const marketsSummaryIntervalDelay = 1000;

function fetchMarketsSummary(dataURI: string): Promise<MarketsSummary> {
  // fetch polyfill provided by create-react-app
  return fetch(new Request(dataURI, {
    mode: "cors", // mode cors assumes dataURI has a different origin; once dataURI is served from CDN (instead of directly from google storage bucket) we'll want to update this code.
  })).then(resp => {
    if (!resp.ok) {
      throw Error(resp.statusText);
    }

    return resp.arrayBuffer();
  }).then(ab => {
    return MarketsSummary.deserializeBinary(new Uint8Array(ab));
  }).catch(console.error.bind(console));
}

function periodic<T>(func: () => Promise<T>, callback: (data: T) => void, interval: number = 1000): () => void {
  let periodicFuncTimeout: number | undefined;
  let isCancelled = false;

  const periodicFunc = () => {
    func().then((data) => {
      if (isCancelled) {
        return;
      }

      callback(data);
      periodicFuncTimeout = window.setTimeout(periodicFunc, interval);
    }).catch(console.error);
  };

  periodicFunc();

  return () => {
    isCancelled = true;

    if (periodicFuncTimeout) {
      clearTimeout(periodicFuncTimeout);
    }
  };
}

let marketsSummaryCallback: (m: MarketsSummary) => void;
const cancelFetchMarketsSummary = periodic(fetchMarketsSummary.bind(null, (window as any).DATA_URI), (m: MarketsSummary) => marketsSummaryCallback(m), marketsSummaryIntervalDelay);

interface RoutesState {
  marketsSummary?: MarketsSummary,
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

export class Routes extends React.Component<any, RoutesState> {
  public readonly state: RoutesState;
  private cancelFetchMarketsSummary?: () => void;

  constructor(props: any) {
    super(props);

    const o = makeObserverOwner(getSavedCurrencyPreference());
    o.observer.subscribe((newCurrency) => saveCurrencyPreference(newCurrency));

    this.cancelFetchMarketsSummary = cancelFetchMarketsSummary;
    marketsSummaryCallback = (marketsSummary: MarketsSummary) => this.setMarketsSummary(marketsSummary);

    this.state = {
      currencySelectionObserverOwner: o,
      marketsSummary: undefined,
    };
  }

  public componentWillUnmount() {
    if (this.cancelFetchMarketsSummary) {
      this.cancelFetchMarketsSummary();
    }
  }

  public render(): JSX.Element {
    const {marketsSummary} = this.state;
    if (marketsSummary == null) {
      return LoadingHTML;
    }

    const renderHome = (props: object) => (
      <Home currencySelectionObserverOwner={this.state.currencySelectionObserverOwner}
            ms={marketsSummary} {...(props as RouteComponentProps<any>)} />);
    const renderEmbeddedMarketCard = (props: object) => (
      <EmbeddedMarketCard marketsSummary={marketsSummary} {...(props as RouteComponentProps<any>)} />);
    const renderPublicEthereumNodes = () => <PublicEthereumNodes
      ms={marketsSummary}
      currencySelectionObserver={this.state.currencySelectionObserverOwner.observer}
    />;
    const renderMarketDetailPage = (props: RouteComponentProps<URLParams>) => <MarketDetailPage
      ms={marketsSummary}
      currencyObserver={this.state.currencySelectionObserverOwner.observer}
      {...props}
    />;
    const renderAugurFeeWindows = () => <AugurFeeWindowInfo ms={marketsSummary}
                                                            currencySelectionObserver={this.state.currencySelectionObserverOwner.observer}
    />;

    return (
      <Router>
        <div>
          <ScrollToTop>
            <Switch>
              <Route exact={true} path="/e/v1/:id" render={renderEmbeddedMarketCard}/>
              <Route exact={true} path="/e/:id" render={renderEmbeddedMarketCard}/>
              <Route exact={true} path={`${marketDetailPageURLPrefix}/:url`} render={renderMarketDetailPage}/>
              <Route exact={true} path="/augur-public-ethereum-nodes" render={renderPublicEthereumNodes}/>
              <Route exact={true} path="/augur-fee-window" render={renderAugurFeeWindows}/>
              <Route exact={true} path="/" render={renderHome}/>
            </Switch>
          </ScrollToTop>
        </div>
      </Router>
    );
  }

  private setMarketsSummary = (marketsSummary: MarketsSummary) => {
    // Disable automatic reloads
    if (this.cancelFetchMarketsSummary) {
      this.cancelFetchMarketsSummary();
    }

    this.setState({
      marketsSummary,
    });
  };
}
