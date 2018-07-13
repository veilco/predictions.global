import * as React from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import {Home} from './App';
import {EmbeddedMarketCard} from './EmbeddedMarketCard';
import {MarketsSummary} from "./generated/markets_pb";
import {RouteComponentProps} from "react-router";

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
}

export class Routes extends React.Component<any, RoutesState> {
  public readonly state: RoutesState;
  private cancelFetchMarketsSummary?: () => void;

  constructor(props: any) {
    super(props);

    this.cancelFetchMarketsSummary = cancelFetchMarketsSummary;
    marketsSummaryCallback = (marketsSummary: MarketsSummary) => this.setMarketsSummary(marketsSummary);

    this.state = {
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
      return (
        <div>
          <img style={{width: '230px', display: 'block', margin: 'auto', marginTop: '40px'}} className="logo"
               src="/logo.png"/>
          <div style={{textAlign: 'center', marginTop: '40px'}}>
            <div style={{display: 'inline-block'}}>
              <i className="fas fa-sync fa-spin fa-2x"/>
            </div>
          </div>
        </div>
      );
    }

    const renderHome = (props: object) => (<Home ms={marketsSummary} {...(props as RouteComponentProps<any>)} />);
    const renderEmbeddedMarketCard = (props: object) => (
      <EmbeddedMarketCard marketsSummary={marketsSummary} {...(props as RouteComponentProps<any>)} />);
    return (
      <Router>
        <div>
          <Route exact={true} path="/" render={renderHome}/>
          <Route exact={true} path="/e/:id" render={renderEmbeddedMarketCard}/>
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