import * as React from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Currency } from "./Currency";
import { Market, MarketDetail } from "./generated/markets_pb";
import { LoadingHTML } from './Loading';
// import './MarketDetailPage.css';

interface URLParams {
  url: string // market detail page url
}

type Props = RouteComponentProps<URLParams>;

interface State {
  currency: Currency,
  marketDetail: MarketDetail | undefined,
  marketId: string | undefined,
}

// TODO unify fetchMarketDetail with other fetch into a cohesive data layer/fetch library.
function fetchMarketDetail(dataURI: string): Promise<MarketDetail> {
  // fetch polyfill provided by create-react-app
  return fetch(new Request(dataURI, {
    mode: "cors", // mode cors assumes dataURI has a different origin; once dataURI is served from CDN (instead of directly from google storage bucket) we'll want to update this code.
  })).then(resp => {
    if (!resp.ok) {
      throw Error(resp.statusText);
    }
    return resp.arrayBuffer();
  }).then(ab => {
    return MarketDetail.deserializeBinary(new Uint8Array(ab));
  }).catch(console.error.bind(console));
}

export const marketDetailPageURLPrefix = '/augur-markets';

const otherCharactersToTurnIntoDashesRegexp = /\\+|\/+|[.]+|:+/g;
const whitespaceRegexp = /\s+/g;
const validCharactersRegexp = /[^-0-9a-zA-Z]/g;
const collapseDashesRegexp = /-+/g;

export function makeMarketDetailPageURL(m: Market): string {
  const urlName = m.getName()
    .replace(whitespaceRegexp, '-')
    .replace(otherCharactersToTurnIntoDashesRegexp, '-')
    .replace(validCharactersRegexp, '')
    .replace(collapseDashesRegexp, '-')
    .substring(0, 120)
    .toLowerCase();
  return `${marketDetailPageURLPrefix}/${urlName}-${m.getId()}`;
}

function getMarketIdFromDetailPageURL(url: string): string | undefined {
  // We expect market ID URLs of the form "market-name-:id"
  const parts = url.split('-');
  if (parts.length < 1) {
    return undefined;
  }
  return parts[parts.length - 1].toLowerCase();
}

export class MarketDetailPage extends React.Component<Props, State> {
  public static getDerivedStateFromProps(props: Props, state: State): State | null {
    const newMarketId = getMarketIdFromDetailPageURL(props.match.params.url);
    if (newMarketId !== state.marketId) {
      return Object.assign({}, state, { marketId: newMarketId });
    }
    return null;
  }
  constructor(props: Props) {
    super(props);
    this.state = {
      currency: Currency.USD, // TODO from localStorage
      marketDetail: undefined,
      marketId: undefined,
    };
  }
  public componentDidMount() {
    this.doFetchMarketDetail();
  }
  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.marketId !== prevState.marketId) {
      this.doFetchMarketDetail();
    }
  }
  public render() {
    if (this.state.marketId === undefined) {
      return <Redirect to="/" />;
    }
    if (this.state.marketDetail === undefined) {
      return LoadingHTML;
    }
    return <div className="container">
      <Link to="/">Back to Homepage</Link>
      <div className="content">
        <pre>
          {JSON.stringify(this.state.marketDetail.toObject(), null, 2)}
        </pre>
      </div>
    </div>;
  }
  private doFetchMarketDetail() {
    if (this.state.marketId === undefined) {
      return;
    }
    // TODO retries/fallback; right now we'll show loading forever if load fails and then user can just refresh page
    fetchMarketDetail(`${(window as any).MARKET_DETAIL_URI}/${this.state.marketId}`)
      .then(marketDetail => {
        if (this.state.marketId === marketDetail.getMarketId()) {
          // if the current state.marketId is not equal to marketDetail.marketId, thn this may indicate that marketId changed during fetch and that this marketDetail is no longer valid. (In this case, presumably the new marketId will trigger its own fetch, which may be inflight or even already completed.)
          this.setState({ marketDetail })
        }
      }).catch(console.error.bind(console));
  }
}
