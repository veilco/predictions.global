import * as classNames from 'classnames';
import * as moment from 'moment';
import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
// @ts-ignore for Dotdotdot
import Dotdotdot from 'react-dotdotdot';
import { Link } from 'react-router-dom';
import { Currency } from './Currency';
import { LiquidityAtPrice, Market, MarketType, Prediction, Price } from './generated/markets_pb';
import './MarketCard.css';
import MarketControls, { getMarketEmbedCode } from './MarketControls';
import { makeMarketDetailPageURL } from './MarketDetailPage';
import { Observer } from './observer';
import Price2, { numberFormat, smartRoundThreeDecimals, usdFormat } from "./Price";

interface HasMarket {
  m: Market
}

interface RenderedPrediction {
  node: React.ReactNode, // prediction node
  text: string, // rendered prediction text, expected to correspond to what human would see when `node` is rendered. Used for tweet generation.
}

interface RenderPredictionOpts {
  includePrefixInNode?: boolean // default true
}

const renderPredictionPrefix = "Augur predicts: ";
const renderPredictionPrefixNode = <span>{renderPredictionPrefix}<br /></span>;

export function renderPrediction(mt: MarketType, ps: Prediction[], opts?: RenderPredictionOpts): RenderedPrediction {
  if (ps.length < 1) {
    return {
      node: <span>No predictions</span>,
      text: 'No predictions',
    };
  }
  let text = renderPredictionPrefix; // see note on RenderedPrediction
  // TODO these locals are never all required
  const p = Math.round(ps[0].getPercent()); // the percent is rounded here, instead of during rendering, so that the red/green color is chosen off the rounded value
  const r = `${Math.round(p)}%`; // assume 0 <= p < 100 (as opposed to p < 1.0)
  const name = ps[0].getName();
  const v = numberFormat.format(ps[0].getValue());
  const includePrefixInNode: boolean = opts && opts.includePrefixInNode !== undefined ? opts.includePrefixInNode : true;
  switch (mt) {
    case MarketType.YESNO:
      text += `${r} Yes`;
      // TODO upgrade this Likely/Unlikely to our proprietary awesome enum.
      return {
        node: <span>
          {includePrefixInNode && renderPredictionPrefixNode}
          <strong
            className={p < 50 ? "red-3" : "green-3"}
            data-tip={`${r} chance to be a Yes. (${p < 50 ? 'Unlikely' : 'Likely'})`}>{r} Yes</strong>
        </span>,
        text,
      };
    case MarketType.CATEGORICAL:
      text += `${r} ${name}`;
      return {
        node: <span>
          {includePrefixInNode && renderPredictionPrefixNode}
          <Dotdotdot clamp={2}>
            <strong className="orange" data-multiline={true}
              data-tip={`${r} chance to be ${name.substring(0, 20)}.<br>This is a multiple-choice market.<br>This is the predicted winning choice.<br>(${p < 50 ? 'Best, but still unlikely' : 'And likely'})`}>
              {r} {name}
            </strong>
          </Dotdotdot>
        </span>,
        text,
      };
    case MarketType.SCALAR:
      text += `${v} ${name}`;
      return {
        node: <span>
          {includePrefixInNode && renderPredictionPrefixNode}
          <Dotdotdot clamp={2}>
            <strong className="orange" data-multiline={true}
              data-tip={`${v} ${name.substring(0, 20)}<br>is the numeric prediction for this market.`}>
              {v} {name}
            </strong>
          </Dotdotdot>
        </span>,
        text,
      };
  }
}

export function getMarketSummaryString(name: string, openInterest: Price | undefined,
  prediction: RenderedPrediction): string {
  if (name.charAt(name.length - 1) !== '?') {
    name += '?';
  }
  const money = openInterest === undefined ? 'no money' : `${usdFormat.format(openInterest.getUsd())}`; // to vary currency, we'd want to use something like Observer<Currency>. For now we use USD.
  return `${name} ${prediction.text}, with ${money} at stake.`;
}

type OneMarketSummaryProps = HasMarket & {
  now: moment.Moment,
  index: number,
  currencySelectionObserver: Observer<Currency>,
  isEmbedded?: boolean,
};

interface OneMarketSummaryState {
  showEmbed: boolean,
}

const oneMarketSummaryInitialState: OneMarketSummaryState = {
  showEmbed: false,
};

function renderBidAsk(m: Market): React.ReactNode {
  let topOutcomeBestBid: LiquidityAtPrice | undefined;
  let topOutcomeBestAsk: LiquidityAtPrice | undefined;
  const predictions = m.getPredictionsList();
  if (predictions.length > 0) {
    topOutcomeBestBid = m.getBestBidsMap().get(predictions[0].getOutcomeId());
    topOutcomeBestAsk = m.getBestAsksMap().get(predictions[0].getOutcomeId());
  }
  return <div className="columns is-mobile has-text-centered is-vcentered is-centered">
    <div className="column">
      <strong>Qty:</strong><br /> {/* best bid quantity */}
      {topOutcomeBestBid && topOutcomeBestBid.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(topOutcomeBestBid.getAmount())) : '-'}
    </div>
    <div className="column">
      <strong>Bid:</strong><br />
      {topOutcomeBestBid && topOutcomeBestBid.getPrice() !== 0 ? numberFormat.format(smartRoundThreeDecimals(topOutcomeBestBid.getPrice())) : '-'}
    </div>
    <div className="column">
      <strong>Ask:</strong><br />
      {topOutcomeBestAsk && topOutcomeBestAsk.getPrice() !== 0 ? numberFormat.format(smartRoundThreeDecimals(topOutcomeBestAsk.getPrice())) : '-'}
    </div>
    <div className="column">
      <strong>Qty:</strong><br /> {/* best ask quantity */}
      {topOutcomeBestAsk && topOutcomeBestAsk.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(topOutcomeBestAsk.getAmount())) : '-'}
    </div>
  </div>;
}

class OneMarketSummary extends React.Component<OneMarketSummaryProps, OneMarketSummaryState> {
  public readonly state: OneMarketSummaryState = oneMarketSummaryInitialState
  public componentDidMount(): void {
    document.addEventListener("keydown", this.handleEscapeKey, false);
  }
  public componentWillUnmount(): void {
    document.removeEventListener("keydown", this.handleEscapeKey, false);
  }
  public render() {
    const props = this.props;
    const { m, isEmbedded } = this.props;
    const { showEmbed } = this.state;

    const marketID = m.getId();
    const name = props.m.getName();
    const ps = props.m.getPredictionsList();
    const mt = props.m.getMarketType();
    const isFeatured = props.m.getIsFeatured();
    const prediction = renderPrediction(mt, ps);
    const openInterest = props.m.getMarketCapitalization();
    const marketDetailPageURL = makeMarketDetailPageURL(m);
    const callToActionURL = marketDetailPageURL.absolute;
    const marketSummary = getMarketSummaryString(name, openInterest, prediction);

    function renderEndDate(): React.ReactNode {
      const endDate = moment.unix(props.m.getEndDate());
      return (<span>{props.now.isBefore(endDate) ? 'Ends' : 'Ended'} <strong>{props.now.to(endDate)}</strong></span>);
    }
    const notMobileControls = <MarketControls type="not-mobile" callToActionURL={callToActionURL} isEmbedded={isEmbedded} marketId={marketID} marketSummary={marketSummary} />;
    const mobileControls = <MarketControls type="mobile" callToActionURL={callToActionURL} isEmbedded={isEmbedded} marketId={marketID} marketSummary={marketSummary} className="column is-paddingless is-12 is-hidden-tablet" />;
    const bidAsk = renderBidAsk(m);
    return <div className="market columns is-centered">
      <div className="column box">
        <div className="columns">
          <div className="column is-1 is-hidden-mobile">
            {notMobileControls}
          </div>
          <div className="column is-12-mobile is-11-tablet is-11-desktop">
            <div className="market-content columns is-mobile is-multiline">
              {isFeatured && !isEmbedded && (
                <div className="column content is-12 is-marginless no-padding-bottom">
                  <strong className="featured green-3-bg badge" key="featured">
                    Featured
                    {' '}<i className="fas fa-star" />
                    <br />
                  </strong>
                </div>
              )}
              <div className="column content is-12-mobile is-4-tablet is-4-desktop is-marginless">
                <div className="columns is-multiline">
                  <div className="column is-12">
                    <Dotdotdot clamp={3}>
                      {!isEmbedded && (
                        <strong className="orange">#{props.index + 1}</strong>
                      )}
                      {" "}<strong>
                        {isEmbedded ?
                          <a href={marketDetailPageURL.absolute} target="_blank">{name}</a> :
                          <Link to={marketDetailPageURL.relative}>{name}</Link>
                        }
                      </strong>
                    </Dotdotdot>
                  </div>
                  <div className="column is-12 is-hidden-mobile">
                    {bidAsk}
                  </div>
                </div>
              </div>
              <div
                className="column is-half-mobile has-text-left-mobile has-text-centered-tablet has-text-centered-desktop">
                <div className="columns is-multiline">
                  <div className="middle-column-left column content is-12 is-marginless">
                    {prediction.node}
                  </div>
                  <div className="middle-column-left column content is-12">
                    {isEmbedded ?
                      <a href={marketDetailPageURL.absolute} target="_blank">{name}</a> :
                      <Link to={marketDetailPageURL.relative}><span className="view-details">View Details</span></Link>
                    }
                  </div>
                </div>
              </div>
              <div className="column is-half-mobile has-text-right">
                <div className="columns is-multiline">
                  <div className="middle-column-right column content is-12 is-marginless is-centered">
                    {/* // TODO consider rendering "at stake" differently if market has ended or resolved; could say "total payout" etc. */}
                    {openInterest === undefined || openInterest.getUsd() === 0 ? "No money"
                      : <strong><Price2
                        p={props.m.getMarketCapitalization()}
                        o={props.currencySelectionObserver} /></strong>
                    }
                    <br />at stake
                  </div>
                  <div className="middle-column-right column content is-12">
                    {renderEndDate()}
                  </div>
                </div>
              </div>
              <div className="column is-12 is-hidden-tablet">
                {bidAsk}
              </div>
              {mobileControls}

              <div className={classNames('modal has-text-left', showEmbed && 'is-active')}>
                <div className="modal-background" />
                <div className="modal-card">
                  <header className="modal-card-head">
                    <p className="modal-card-title">Embed Market</p>
                  </header>
                  <section className="modal-card-body">
                    <p>Embed the following HTML code:</p>
                    <CopyToClipboard text={getMarketEmbedCode(marketID)}>
                      <pre data-tip="Click to copy to your clipboard">
                        {getMarketEmbedCode(marketID)}
                      </pre>
                    </CopyToClipboard>
                  </section>
                  <footer className="modal-card-foot">
                    <button className="button is-success" onClick={this.closeEmbed}>Done</button>
                  </footer>
                </div>
                <button className="modal-close is-large" aria-label="close" onClick={this.closeEmbed} />
              </div>
              {/* for embedded, we show our logo in the same <columns> as other market controls on mobile, however for desktop the logo we show as its own column/block below the main card */}
              {isEmbedded && (
                <div className="column content is-12 is-marginless is-hidden-mobile no-padding-top no-padding-bottom">
                  <a className="is-pulled-right" target="_blank" href={`${window.location.protocol}//${window.location.host}`}>
                    <img style={{ width: '115px' }} className="logo" src="/logo.png" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  private toggleEmbed = () => {
    this.setState(({ showEmbed }) => ({
      showEmbed: !showEmbed,
    }));
  };

  private closeEmbed = () => {
    this.setState({
      showEmbed: false,
    });
  };

  private handleEscapeKey = (e: KeyboardEvent) => {
    // Escape keycode
    if (e.keyCode === 27) {
      this.closeEmbed();
    }
  };
}

export default OneMarketSummary;
