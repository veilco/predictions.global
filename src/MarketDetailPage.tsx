import * as classNames from 'classnames';
import * as moment from 'moment';
import * as React from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import * as ReactTooltip from "react-tooltip";
import AllOutcomesSummary from './AllOutcomesSummary';
import { Currency, getSavedCurrencyPreference } from "./Currency";
import { ExchangeRates, getExchangeRatesFromMarketsSummary, makePriceFromEthAmount } from './ExchangeRates';
import Footer from './Footer';
import { Market, MarketDetail, MarketInfo, MarketType, ReportingState } from "./generated/markets_pb";
import Header, { HasMarketsSummary } from './Header';
import { LoadingHTML } from './Loading';
import MarketControls from './MarketControls';
import './MarketDetailPage.css';
import { Observer } from './observer';
import { getMarketSummaryString, renderPrediction } from './OneMarketSummary';
import Price2, { smartRoundThreeDecimals } from './Price';
import { Helmet } from 'react-helmet';

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

interface URL {
  relative: string, // relative URL that can be used in a react-router Link or <a>
  absolute: string, // absolute URL useful externally, eg. in a tweet
}

export function makeMarketDetailPageURL(m: Market): URL {
  const urlName = m.getName()
    .replace(whitespaceRegexp, '-')
    .replace(otherCharactersToTurnIntoDashesRegexp, '-')
    .replace(validCharactersRegexp, '')
    .substring(0, 120)
    .toLowerCase();
  const relative = `${marketDetailPageURLPrefix}/${urlName}-${m.getId()}`.replace(collapseDashesRegexp, '-');
  return {
    absolute: `${window.location.protocol}//${window.location.host}${relative}`,
    relative,
  }
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
    const m = md.getMarketSummary();
    if (m === undefined) {
      // unexpected; marketDetail is defined but its marketSummary is undefined.
      return <Redirect to="/" />;
    }
    const mi = md.getMarketInfo();
    if (mi === undefined) {
      // unexpected; marketDetail is defined but its marketInfo is undefined.
      return <Redirect to="/" />;
    }
    const exchangeRates = getExchangeRatesFromMarketsSummary(this.props.ms);
    if (exchangeRates === undefined) {
      // unexpected; exchangeRates will be defined if at least one market has non-zero open interest
      return <Redirect to="/" />;
    }
    const now = moment();
    const name = m.getName();
    const mt = m.getMarketType();
    const openInterest = m.getMarketCapitalization();
    const prediction = renderPrediction(mt, m.getPredictionsList());
    const marketSummary = getMarketSummaryString(name, openInterest, prediction);
    const details = m.getDetails().trim();
    // otherDetails is rendered in two places; one for each of mobile and desktop.
    const otherDetails = <div className="box">
      <div className="columns is-vcentered is-multiline">
        <div className="column is-12">
          <h5 className="title is-5">Other Details</h5>
        </div>
        {renderResolutionSource(m)}
        {renderMarketType(mt)}
        {renderDatum("reporting state", reportingStateToString(mi.getReportingState()))}
        {renderScalarDetail(m, mi)}
        {renderEthereumAddressLink("author", mi.getAuthor())}
        {renderDatum("created", moment.unix(mi.getCreationTime()).format(detailPageDateFormat), { isNotMobile: true })}
        {renderDatum("creation block", ethereumBlockLink(mi.getCreationBlock()))}
        {renderFinalizationBlockNumber(mi)}
        {renderFinalizationTime(mi)}
        {renderEthereumAddressLink("designated reporter", mi.getDesignatedReporter())}
        {renderDesignatedReporterStake(mi)}
        {renderEthereumAddressLink("universe", mi.getUniverse())}
        {renderEthereumAddressLink("creator mailbox", mi.getMarketCreatorMailbox())}
        {renderEthereumAddressLink("creator mailbox owner", mi.getMarketCreatorMailboxOwner())}
        {renderFeeWindow(mi)}
        {renderEthereumAddressLink("market contract", marketId, undefined, { className: "has-padding-bottom" })}
      </div>
    </div>;
    return <div>
      <Header ms={this.props.ms} currencySelectionObserver={this.props.currencyObserver} doesClickingLogoReloadPage={false} headerContent={
        <div className="has-text-centered content">
          <h3 className="title">{name}</h3>
          {renderForking(mi)}
          {renderNeedsMigration(mi)}
          {renderCategoryAndTags(m)}
          <MarketControls type="mobile" callToActionURL={makeMarketDetailPageURL(m).absolute} isEmbedded={false} marketId={marketId} marketSummary={marketSummary} forceAllowLinkToAugurApp={true} />
          <ReactTooltip /> {/* ReactTooltip is extremely non-performant; we try to have at most one of these, but we want Header to be the first child of outermost <div> (for consistency with other pages, since Header isn't yet rendered in one place only), so we'll just have two ReactTooltip on detail page for now. 2 is okay, but eg. O(markets) of ReactTooltip will brick the page. */}
        </div>
      } />
      <section className="detail section">
        <ReactTooltip />
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-7-desktop is-8-tablet is-12-mobile">
              <div className="box">
                <div className="columns is-vcentered is-multiline">
                  <div className="column is-12">
                    <h5 className="title is-5">Activity</h5>
                  </div>
                  {renderVolume(exchangeRates, mi, this.props.currencyObserver)}
                  {renderDatum("open interest", <Price2 p={openInterest} o={this.props.currencyObserver} />)}
                  {renderLastTradedDate(now, m)}
                  {renderMarketFee(mi)}
                  {renderEndDate(now, m)}
                </div>
              </div>
              <AllOutcomesSummary m={m} mi={mi} exchangeRates={exchangeRates} currencyObserver={this.props.currencyObserver} />
              <div className="is-hidden-mobile">
                {otherDetails}
              </div>
            </div>
            <div className="column is-5-desktop is-4-tablet is-12-mobile content">
              <div className="box has-text-centered">
                <h5 className="title is-5">Charts Coming Soon</h5>
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
              </div>
              <div className="box">
                <strong>Details:</strong><br />
                {details.length < 1 ? "none" : details}
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column is-7-desktop is-8-tablet is-12-mobile">
              <div className="is-hidden-tablet">
                {otherDetails}
              </div>
            </div>
          </div>
        </div>
      </section>
      {Footer}
      <Helmet>
        <title>Odds on {m.getName().substring(0,85)}</title>
        <meta name="description" content={`Augur prediction market data and statistics. ${m.getDetails().substring(0, 250)}`} />
      </Helmet>
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

interface RenderDatumOpts {
  className?: string,
  isNotMobile?: true,
  isLabelNotStrong?: true,
  key?: string,
}

function mergeRenderDatumOpts(a: RenderDatumOpts, b: RenderDatumOpts): RenderDatumOpts {
  const c = Object.assign({}, a);
  c.className = classNames(c.className, b.className);
  return c;
}

function renderDatum(label: React.ReactNode, datum?: React.ReactNode, opts?: RenderDatumOpts): React.ReactNode {
  return <div key={opts && opts.key} className={classNames("datum columns column is-narrow is-marginless",
    opts && opts.className,
    (opts && opts.isNotMobile || "is-mobile")
  )}>
    <div className="column is-narrow is-paddingless">
      {
        opts && opts.isLabelNotStrong ?
          <span>{label}{datum !== undefined && datum !== null && <span>:&nbsp;</span>}</span> :
          <strong>{label}{datum !== undefined && datum !== null && <span>:&nbsp;</span>}</strong>
      }
    </div>
    {datum !== undefined && datum !== null &&
      /* as a special case, omit className is-narrow if datum looks like a paragraph of text, because is-narrow causes the data to not wrap */
      <div className={classNames("column is-paddingless", (typeof datum === 'string' && datum.length > 50) || "is-narrow")}>
        {datum}
      </div>
    }
  </div>;
}

function capitalizeNonAcronym(s: string): string {
  if (s.length < 4) { return s };
  return s[0].toUpperCase() + s.substring(1).toLowerCase();
}

function renderCategoryAndTags(ms: Market): React.ReactNode {
  return <span>
    {[ms.getCategory(), ...ms.getTagsList()]
      .map(s => s.trim())
      .map(s => capitalizeNonAcronym(s))
      .filter(s => s.length > 0).join(", ")}
  </span>;
}

function reportingStateToString(rs: ReportingState): React.ReactNode {
  switch (rs) {
    case ReportingState.PRE_REPORTING:
      return "Pre-Reporting";
    case ReportingState.DESIGNATED_REPORTING:
      return "Designated Reporting";
    case ReportingState.OPEN_REPORTING:
      return "Open Reporting";
    case ReportingState.CROWDSOURCING_DISPUTE:
      return "Crowdsourcing Dispute";
    case ReportingState.AWAITING_NEXT_WINDOW:
      return "Awaiting Next Window";
    case ReportingState.AWAITING_FINALIZATION:
      return "Awaiting Finalization";
    case ReportingState.FINALIZED:
      return "Finalized";
    case ReportingState.FORKING:
      return "Forking";
    case ReportingState.AWAITING_NO_REPORT_MIGRATION:
      return "Awaiting No Report Migration";
    case ReportingState.AWAITING_FORK_MIGRATION:
      return "Awaiting Fork Migration";
  }
}

function renderMarketType(mtIn: MarketType): React.ReactNode {
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
  return renderDatum("market type", parse(mtIn));
}

function renderEthereumAddressLink(datumLabel: string | undefined, ethAddress: string, linkText?: string, opts: RenderDatumOpts = {}): [React.ReactNode, React.ReactNode] {
  // TODO we don't need to compute truncatedAddressLink at all if linkText is defined
  // On mobile, display only first N characters of address because it's too long for iPhone5, even on its own row. Perhaps a preferable way to render this is adoption of <MediaQuery> react components which will render correct option, instead of rendering both and relegating visibility to CSS.
  const fullAddressLink = <a target="_blank" href={`https://etherscan.io/address/${ethAddress}`}>{linkText === undefined ? ethAddress : linkText}</a>;
  const truncatedAddressLink = <a target="_blank" href={`https://etherscan.io/address/${ethAddress}`}>{linkText === undefined ? <span>{ethAddress.substring(0, 26)}&hellip;</span> : linkText}</a>;
  if (datumLabel !== undefined) {
    return [
      renderDatum(datumLabel, fullAddressLink, mergeRenderDatumOpts({ className: "is-hidden-mobile", isNotMobile: true, key: "0" }, opts)),
      renderDatum(datumLabel, truncatedAddressLink, mergeRenderDatumOpts({ className: "is-hidden-tablet", isNotMobile: true, key: "1" }, opts)),
    ];
  } else {
    return [
      renderDatum(fullAddressLink, undefined, mergeRenderDatumOpts({ className: "is-hidden-mobile", isNotMobile: true, key: "0", isLabelNotStrong: true, }, opts)),
      renderDatum(truncatedAddressLink, undefined, mergeRenderDatumOpts({ className: "is-hidden-tablet", isNotMobile: true, key: "1", isLabelNotStrong: true, }, opts)),
    ];
  }
}

function ethereumBlockLink(blockNumber: number): React.ReactNode {
  return <a target="_blank" href={`https://etherscan.io/block/${blockNumber}`}>{blockNumber}</a>;
}

function renderEndDate(now: moment.Moment, ms: Market): React.ReactNode {
  const endDate = moment.unix(ms.getEndDate());
  return renderDatum(now.isBefore(endDate) ? 'ends' : 'ended', endDate.format(detailPageDateFormat), { className: "is-12-mobile is-7-desktop is-7-tablet has-padding-bottom", isNotMobile: true });
}

function renderLastTradedDate(now: moment.Moment, ms: Market): React.ReactNode {
  const raw = ms.getLastTradeTime();
  const label = "last traded";
  if (raw === 0) {
    return renderDatum(label, "never");
  }
  const lastTraded = moment.unix(ms.getLastTradeTime());
  return renderDatum(label, now.to(lastTraded));
}

function renderResolutionSource(ms: Market): [React.ReactNode, React.ReactNode] {
  const rs = ms.getResolutionSource().trim();
  return [
    renderDatum("resolution source", rs.length < 1 ? "none" : tryToMakeLink(rs, 48), { className: "is-12 is-hidden-mobile", isNotMobile: true, key: "0" }),
    renderDatum("resolution source", rs.length < 1 ? "none" : tryToMakeLink(rs, 28), { className: "is-12 is-hidden-tablet", isNotMobile: true, key: "1" }),
  ];
}

function renderScalarDetail(ms: Market, mi: MarketInfo): React.ReactNode {
  if (ms.getMarketType() !== MarketType.SCALAR) {
    return;
  }
  return renderDatum('Scalar market scale', `${mi.getMinPrice()} to ${mi.getMaxPrice()} ${mi.getScalarDenomination()} (tick size ${mi.getTickSize()})`);
}

function renderFeeWindow(mi: MarketInfo): React.ReactNode {
  const f = mi.getFeeWindow();
  if (f === '0x0000000000000000000000000000000000000000') {
    return;
  }
  return renderEthereumAddressLink("fee window", f);
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
  return renderDatum(<strong className="red-3">FORKING</strong>, undefined, { className: "is-centered"});
}

function renderNeedsMigration(mi: MarketInfo): React.ReactNode {
  if (!mi.getNeedsMigration()) {
    return;
  }
  return renderDatum(<strong className="orange-3">NEEDS MIGRATION</strong>, undefined, { className: "is-centered"});
}


function renderVolume(ex: ExchangeRates, mi: MarketInfo, o: Observer<Currency>): React.ReactNode {
  const volume = parseFloat(mi.getVolume());
  if (isNaN(volume)) {
    return;
  }
  return renderDatum("volume", <Price2 p={makePriceFromEthAmount(ex, volume)} o={o} />);
}

function renderDesignatedReporterStake(mi: MarketInfo): React.ReactNode {
  const stakeEth = parseFloat(mi.getDesignatedReportStake());
  if (isNaN(stakeEth)) {
    return;
  }
  return renderDatum("designated reporter stake", `${smartRoundThreeDecimals(stakeEth)} REP`);
}

// TODO render dates when marketDetail is fetched and cache the date rendering in state
const detailPageDateFormat = "lll [(UTC]ZZ[)]"; // https://momentjs.com/docs/#/displaying/format/ eg. "Sep 4, 1986 8:30 PM (UTC-700)"

// https://www.regextester.com/93652
const urlRegexp = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}(:[0-9]{1,5})?(\/.*)?$/i;

function tryToMakeLink(s: string, linkTextMaxLen?: number): React.ReactNode {
  if (urlRegexp.test(s)) {
    const href = s.toLowerCase().startsWith('http') ? s : 'http://' + s;
    // TODO a better truncation method is to truncate for mobile and less so for table/desktop, similar to renderEthereumAddressLink.
    return <a target="_blank" href={href}>{linkTextMaxLen !== undefined ? renderCappedLength(linkTextMaxLen, s) : s}</a>;
  }
  return s;
}

function renderCappedLength(l: number, s: string): React.ReactNode {
  if (s.length < l) {
    return s;
  }
  return <span>{s.substring(0, l)}&hellip;</span>;
}

function renderMarketFee(mi: MarketInfo): React.ReactNode {
  const combinedFees = parseFloat(mi.getSettlementFee()); // settlementFee is reportingFeeRatemarketCreatorFeeRate; we'll render it instead of doing addition ourselves just to allow backend to own its definition
  const creatorFee = parseFloat(mi.getMarketCreatorFeeRate());
  const reporterFee = parseFloat(mi.getReportingFeeRate());
  if (isNaN(combinedFees)) {
    return;
  }
  // TODO NaN check for creatorFee / reporterFee
  const fees = <span>
    {smartRoundThreeDecimals(combinedFees*100)}%&nbsp;
    <i className="far fa-question-circle" data-multiline={true} data-tip={`The trading settlement fee<br>is a combination of the<br>Market Creator Fee (${smartRoundThreeDecimals(creatorFee*100)}%)<br>and the Reporting Fee (${smartRoundThreeDecimals(reporterFee*100)}%)`}/>
  </span>;
  return renderDatum("fee", fees, { className: "has-padding-bottom no-padding-bottom-tablet" });
}
