import * as React from 'react';
import * as moment from 'moment';
import { Redirect, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Currency, getSavedCurrencyPreference } from "./Currency";
import { Market, MarketDetail, MarketType, MarketInfo, Price } from "./generated/markets_pb";
import { LoadingHTML } from './Loading';
import Header, { HasMarketsSummary } from './Header';
import { Observer } from './observer';
import Footer from './Footer';
import Price2 from './Price';
import './MarketDetailPage.css';

export interface URLParams {
  url: string // market detail page url
}

type Props = RouteComponentProps<URLParams> & HasMarketsSummary & {
  currencyObserver: Observer<Currency>,
};

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
      return Object.assign({}, state, {
        marketDetail: undefined, // destroy marketDetail when marketId changes; it will be refetched in componentDidUpdate
        marketId: newMarketId,
      });
    }
    return null;
  }
  constructor(props: Props) {
    super(props);
    this.state = {
      currency: getSavedCurrencyPreference(),
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
    const marketId = this.state.marketId;
    if (marketId === undefined) {
      return <Redirect to="/" />;
    }
    const md = this.state.marketDetail;
    if (md === undefined) {
      return LoadingHTML;
    }
    const ms = md.getMarketSummary();
    if (ms === undefined) {
      // unexpected; marketDetail is defined but its marketSummary is undefined.
      return <Redirect to="/" />;
    }
    const mi = md.getMarketInfo();
    if (mi === undefined) {
      // unexpected; marketDetail is defined but its marketInfo is undefined.
      return <Redirect to="/" />;
    }
    const now = moment();
    return <div>
      <Header ms={this.props.ms} currencySelectionObserver={this.props.currencyObserver} doesClickingLogoReloadPage={false} headerContent={
        <div className="has-text-centered content">
          <h3 className="title">{ms.getName()}</h3>
          {renderForking(mi)}
          {renderNeedsMigration(mi)}
          {renderCategoryAndTags(ms)}
        </div>
      } />
      <section className="section">
        <div className="container">
          <div className="columns has-text-centered is-centered is-vcentered is-multiline content">
            <div className="column is-half-desktop is-half-tablet is-12-mobile">
              {renderLastTradedDate(now, ms)}
              {renderEndDate(now, ms)}
              {renderFinalizationBlockNumber(mi)}
              {renderFinalizationTime(mi)}
              {renderDatum(ethereumAddressLink(ms.getId(), "view market contract"))}
              {renderDatum("volume", mi.getVolume())}
              {renderResolutionSource(ms)}
              {renderMarketType(ms)}
              {renderDatum("open interest", <Price2 p={ms.getMarketCapitalization()} o={this.props.currencyObserver} />)}
              {renderDatum("designated reporter", ethereumAddressLink(mi.getDesignatedReporter()))}
              {renderDesignatedReporterStake(ms, mi, this.props.currencyObserver)}
              {renderScalarDetail(ms, mi)}
              {renderDatum("created", moment.unix(mi.getCreationTime()).format(detailPageDateFormat))}
              {renderDatum("creation block", ethereumBlockLink(mi.getCreationBlock()))}
              {renderDatum("author", ethereumAddressLink(mi.getAuthor()))}
              {renderDatum("universe", ethereumAddressLink(mi.getUniverse()))}
              {renderFeeWindow(mi)}
            </div>
            <div className="column is-half-desktop is-half-tablet is-12-mobile content">
              details:
              {ms.getDetails()}
            </div>
            <div className="column is-12 has-text-left">
              <pre>
                {JSON.stringify(md.toObject(), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </section>
      {Footer}
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

function renderDatum(label: React.ReactNode, datum?: React.ReactNode): React.ReactNode {
  return <div className="level is-mobile">
    <div className="level-item has-text-centered">
      <div>
        {label}{datum !== undefined && datum !== null && ": "}
      </div>
    </div>
    {datum !== undefined && datum !== null &&
      <div className="level-item has-text-centered">
        <div>
          {datum}
        </div>
      </div>
    }
  </div>;
}

function capitalizeNonAcronym(s: string): string {
  if (s.length < 4) { return s };
  return s[0].toUpperCase() + s.substring(1).toLowerCase();
}

function renderCategoryAndTags(ms: Market): React.ReactNode {
  return <p>
    {[ms.getCategory(), ...ms.getTagsList()]
      .map(s => s.trim())
      .map(s => capitalizeNonAcronym(s))
      .filter(s => s.length > 0).join(", ")}
  </p>;
}

function renderMarketType(ms: Market): React.ReactNode {
  function parse(mt: MarketType): string {
    switch (mt) {
      case MarketType.YESNO:
        return "Yes/No";
      case MarketType.CATEGORICAL:
        return "Categorical";
      case MarketType.SCALAR:
        return "Scalar";
    }
  }
  return renderDatum("market type", parse(ms.getMarketType()));
}

function ethereumAddressLink(address: string, text?: string): React.ReactNode {
  return <a target="_blank" href={`https://etherscan.io/address/${address}`}>{text === undefined ? address : text}</a>;
}

function ethereumBlockLink(blockNumber: number): React.ReactNode {
  return <a target="_blank" href={`https://etherscan.io/block/${blockNumber}`}>{blockNumber}</a>;
}

function renderEndDate(now: moment.Moment, ms: Market): React.ReactNode {
  const endDate = moment.unix(ms.getEndDate());
  return renderDatum(now.isBefore(endDate) ? 'ends' : 'ended', endDate.format(detailPageDateFormat));
}

function renderLastTradedDate(now: moment.Moment, ms: Market): React.ReactNode {
  const lastTraded = moment.unix(ms.getLastTradeTime());
  return renderDatum("last traded", now.to(lastTraded));
}

function renderResolutionSource(ms: Market): React.ReactNode {
  // ?? TODO make this two columns so that "resolution source" never has a line break
  const rs = ms.getResolutionSource().trim();
  return renderDatum("resolution source", rs.length < 1 ? "none" : tryToMakeLink(rs));
}

function renderScalarDetail(ms: Market, mi: MarketInfo): React.ReactNode {
  if (ms.getMarketType() !== MarketType.SCALAR) {
    return;
  }
  return renderDatum('Scalar market scale', `${mi.getMinPrice()} to ${mi.getMaxPrice()} (tick size ${mi.getTickSize()})`);
}

function renderFeeWindow(mi: MarketInfo): React.ReactNode {
  const f = mi.getFeeWindow();
  if (f === '0x0000000000000000000000000000000000000000') {
    return;
  }
  return renderDatum("fee window", ethereumAddressLink(f));
}

function renderFinalizationBlockNumber(mi: MarketInfo): React.ReactNode {
  const n = mi.getFinalizationBlockNumber();
  if (n === 0) {
    return;
  }
  return renderDatum("finalization block", ethereumBlockLink(n));
}

function renderFinalizationTime(mi: MarketInfo): React.ReactNode {
  const t = mi.getFinalizationTime();
  if (t === 0) {
    return;
  }
 return renderDatum("finalization time", moment.unix(t).format(detailPageDateFormat));
}

function renderForking(mi: MarketInfo): React.ReactNode {
  if (!mi.getForking()) {
    return;
  }
  return renderDatum(<strong className="red-3">FORKING</strong>);
}

function renderNeedsMigration(mi: MarketInfo): React.ReactNode {
  if (!mi.getNeedsMigration()) {
    return;
  }
  return renderDatum(<strong className="orange-3">NEEDS MIGRATION</strong>);
}

// getExchangeRatesRelativeToETH uses an existing Price to compute exchange rates because we don't yet have explicit exchange rates in our data model.
function getExchangeRatesRelativeToETH(p?: Price): {[key in Currency]: number } | undefined {
  if (p === undefined) {
    return;
  }
  const eth = p.getEth();
  if (eth === 0) {
    return;
  }
  return {
    [Currency.ETH]: 1,
    [Currency.BTC]: p.getBtc()/eth,
    [Currency.USD]: p.getUsd()/eth,
  };
}

function renderDesignatedReporterStake(ms: Market, mi: MarketInfo, o: Observer<Currency>): React.ReactNode {
  // TODO can pull this exchange rate stuff out into something like `getPriceFromReferencePrice(eth, price): Price | undefined`
  const stakeETh = parseFloat(mi.getDesignatedReportStake());
  if (isNaN(stakeETh)) {
    return;
  }
  const ex = getExchangeRatesRelativeToETH(ms.getMarketCapitalization());
  if (ex === undefined) {
    return;
  }
  const stakePrice = new Price();
  stakePrice.setEth(stakeETh);
  stakePrice.setBtc(stakeETh * ex[Currency.BTC]);
  stakePrice.setUsd(stakeETh * ex[Currency.USD]);
  return renderDatum("designated reporter stake", <Price2 p={stakePrice} o={o} />);
}

// TODO render dates when marketDetail is fetched and cache the date rendering in state
const detailPageDateFormat = "LLL [(UTC]ZZ[)]"; // https://momentjs.com/docs/#/displaying/format/ eg. "Sep 4, 1986 8:30 PM (UTC-700)"

// https://www.regextester.com/93652
const urlRegexp = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/i;

function tryToMakeLink(s: string): React.ReactNode {
  if (urlRegexp.test(s)) {
    return <a target="_blank" href={s}>{s}</a>;
  }
  return s;
}
