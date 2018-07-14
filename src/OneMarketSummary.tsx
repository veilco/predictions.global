import * as moment from 'moment';
import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
// @ts-ignore for Dotdotdot
import Dotdotdot from 'react-dotdotdot';
import {TwitterIcon, TwitterShareButton} from 'react-share';
import {Currency} from './Currency';
import {Market, MarketType, Prediction, Price} from './generated/markets_pb';
import {Observer} from './observer';
import Price2, {usdFormat, numberFormat} from "./Price";
import * as classNames from 'classnames';
import * as ReactTooltip from "react-tooltip";
import './MarketCard.css';

interface HasMarket {
  m: Market
}

interface RenderedPrediction {
  node: React.ReactNode, // prediction node
  text: string, // rendered prediction text, expected to correspond to what human would see when `node` is rendered. Used for tweet generation.
}

function renderPrediction(mt: MarketType, ps: Prediction[]): RenderedPrediction {
  if (ps.length < 1) {
    return {
      node: <span>No predictions</span>,
      text: 'No predictions',
    };
  }
  const prefix = "Augur predicts ";
  let text = prefix; // see note on RenderedPrediction
  // TODO these locals are never all required
  const p = Math.round(ps[0].getPercent()); // the percent is rounded here, instead of during rendering, so that the red/green color is chosen off the rounded value
  const r = `${Math.round(p)}%`; // assume 0 <= p < 100 (as opposed to p < 1.0)
  const name = ps[0].getName();
  const v = numberFormat.format(ps[0].getValue());
  switch (mt) {
    case MarketType.YESNO:
      text += `${r} Yes`;
      // TODO upgrade this Likely/Unlikely to our proprietary awesome enum.
      return {
        node: <span>
          {prefix}
          <strong
            className={p < 50 ? "red-3" : "green-3"}
            data-tip={`${r} chance to be a Yes. (${p < 50 ? 'Unlikely' : 'Likely'})`}>{r} Yes</strong>
        </span>,
        text,
      };
    case MarketType.CATEGORICAL:
      text += `${r} ${name}`;
      return {
        node: <Dotdotdot clamp={2}>
          {prefix}
          <strong className="orange" data-multiline={true}
                  data-tip={`${r} chance to be ${name.substring(0, 20)}.<br>This is a multiple-choice market.<br>This is the predicted winning choice.<br>(${p < 50 ? 'Best, but still unlikely' : 'And likely'})`}>
            {r} {name}
          </strong>
        </Dotdotdot>,
        text,
      };
    case MarketType.SCALAR:
      text += `${v} ${name}`;
      return {
        node: <Dotdotdot clamp={2}>
          {prefix}
          <strong className="orange" data-multiline={true}
                  data-tip={`${v} ${name.substring(0, 20)}<br>is the numeric prediction for this market.`}>
            {v} {name}
          </strong>
        </Dotdotdot>,
        text,
      };
  }
}

function renderCappedLength(l: number, s: string): React.ReactNode {
  if (s.length < l) {
    return s;
  }
  return <span>{s.substring(0, l)}&hellip;</span>;
}

function getMarketSummaryString(name: string, openInterest: Price | undefined,
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
  // used to show visual feedback that user copied to clipboard
  isMarketIdCopiedToClipboard: boolean,
  isMarketSummaryCopiedToClipboard: boolean,
  showEmbed: boolean,
}

const oneMarketSummaryInitialState: OneMarketSummaryState = {
  isMarketIdCopiedToClipboard: false,
  isMarketSummaryCopiedToClipboard: false,
  showEmbed: false,
};

class OneMarketSummary extends React.Component<OneMarketSummaryProps, OneMarketSummaryState> {
  public readonly state: OneMarketSummaryState = oneMarketSummaryInitialState

  public componentDidMount(): void {
    document.addEventListener("keydown", this.handleEscapeKey, false);
  }

  public componentWillUnmount(): void {
    document.removeEventListener("keydown", this.handleEscapeKey, false);
  }

  public copiedToClipboard = (type: "isMarketIdCopiedToClipboard" | "isMarketSummaryCopiedToClipboard") => {
    // weird if statement required for typescript to recognize type is valid key of state
    if (type === "isMarketIdCopiedToClipboard") {
      this.setState({[type]: true});
    } else {
      this.setState({[type]: true});
    }
    setTimeout(() => {
      if (this.state[type]) {
        if (type === "isMarketIdCopiedToClipboard") {
          this.setState({[type]: false});
        } else {
          this.setState({[type]: false});
        }
      }
    }, 100);
  }

  // tslint:disable-next-line
  public marketIdCopiedToClipboard = this.copiedToClipboard.bind(this, "isMarketIdCopiedToClipboard")

  // tslint:disable-next-line
  public marketSummaryCopiedToClipboard = this.copiedToClipboard.bind(this, "isMarketSummaryCopiedToClipboard")

  public render() {
    const props = this.props;
    const {m, isEmbedded} = this.props;
    const {showEmbed} = this.state;

    const marketID = m.getId();
    const name = props.m.getName();
    const ps = props.m.getPredictionsList();
    const mt = props.m.getMarketType();
    const resolutionSource = props.m.getResolutionSource();
    const isFeatured = props.m.getIsFeatured();
    const prediction = renderPrediction(mt, ps);
    const openInterest = props.m.getMarketCapitalization();
    const callToActionURL = "https://predictions.global" // TODO link to this market directly once that's possible
    const marketSummary = getMarketSummaryString(name, openInterest, prediction);

    function renderEndDate(): React.ReactNode {
      const endDate = moment.unix(props.m.getEndDate());
      return (<span>{props.now.isBefore(endDate) ? 'Ends' : 'Ended'} <strong>{props.now.to(endDate)}</strong></span>);
    }

    const controls = (type: "mobile" | "not-mobile") => <div
      className={"columns market-controls has-text-centered is-centered " + (
        type === "mobile" ? "mobile is-mobile" : "not-mobile is-multiline"
      )}>
      <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
        <TwitterShareButton url={callToActionURL} title={marketSummary}>
          <TwitterIcon
            size={
              /* Size 25 produces a twitter bird the same size as the official twitter bird in the official (but shitty) tweet generator https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview */
              25}
            round={true}
          />
        </TwitterShareButton>
      </div>
      <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
        <CopyToClipboard text={`${marketSummary} ${callToActionURL}`}
                         onCopy={this.marketSummaryCopiedToClipboard}>
          <i className={
            (this.state.isMarketSummaryCopiedToClipboard ? 'fas' : 'far') + ' fa-copy'}
             data-tip={
               /* mobile tooltips don't display until clicked */
               type === 'mobile' ? "Copied market summary to clipboard" : "Copy market summary to clipboard"
             }/>
        </CopyToClipboard>
      </div>
      <div className={"column content is-marginless " + (type === "mobile" ? "is-narrow" : "is-12")}>
        <CopyToClipboard text={props.m.getId()}
                         onCopy={this.marketIdCopiedToClipboard}>
          <div data-tip={
            /* mobile tooltips don't display until clicked */
            type === 'mobile' ? "Copied Augur market ID to clipboard" : "Copy Augur market ID to clipboard"
          }>
            {
              /* idea here is we just want <span> to become <strong> during isMarketIdCopiedToClipboard==true, not sure how to do this without copypasta */
              this.state.isMarketIdCopiedToClipboard ?
                <strong className="is-unselectable">id</strong>
                : <span className="is-unselectable">id</span>
            }
          </div>
        </CopyToClipboard>
      </div>
      <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
        {/* for link href, the &description on querystring must be non-empty for Augur UI to correctly load the market, and the market does load correctly even with a bogus description */}
        {
          type === 'mobile' ?
            <img className="augur-logo"
                 src="/augur-logo.svg"
                 data-multiline={true}
                 data-tip='View market in Augur App.<br>NOTE: Desktop only.<br>To get started,<br>click "Download Augur App"<br>at the bottom of this page.'/>
            : <a target="blank"
                 href={"http://localhost:8080/#/market?augur_node=ws%3A%2F%2Flocalhost%3A9001&ethereum_node_http=https%3A%2F%2Fmainnet.infura.io%2Faugur&ethereum_node_ws=wss%3A%2F%2Fmainnet.infura.io%2Fws&description=d&id=" + props.m.getId()}>
              <img className="augur-logo"
                   src="/augur-logo.svg"
                   data-multiline={true}
                   data-tip='View market in Augur App.<br>NOTE: You must run Augur App yourself.<br>To get started, click "Download Augur App"<br>at the bottom of this page.'/>
            </a>
        }
      </div>
      { isEmbedded && (
        <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
          <img style={{width: '25px', display: 'inline-block' }} src="/logo-globe.png"/>
        </div>
      )}
      {!isEmbedded && (
        <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
          <CopyToClipboard text={this.getMarketEmbedCode(marketID)}>
            <i className="fas fa-code" data-tip="Copy HTML to embed market summary"/>
          </CopyToClipboard>
        </div>
      )}
    </div>;
    const notMobileControls = controls("not-mobile");
    const mobileControls = controls("mobile");
    return <div className="market columns is-centered">
      <div className="column box">
        <div className="columns">
          <div className="column is-1 is-hidden-mobile">
            {notMobileControls}
          </div>
          <div className="column is-12-mobile is-11-tablet is-11-desktop">
            <div className="columns is-mobile is-multiline">
                {isFeatured && !isEmbedded && (
              <div className="column content is-12 is-marginless no-padding-bottom">
                  <strong className="featured green-3-bg badge" key="featured">
                    Featured
                    {' '}<i className="fas fa-star"/>
                    <br/>
                  </strong>
              </div>
                )}
              <div className="column content is-12-mobile is-4-tablet is-4-desktop is-marginless">
                <Dotdotdot clamp={4}>
                  {!isEmbedded && (
                    <strong className="orange">#{props.index + 1}</strong>
                  )}
                  {" "}<strong>{name}</strong>
                  {/*{*/}
                  {/*resolutionSource.length > 0 && (*/}
                  {/*<span data-multiline={true}*/}
                  {/*data-tip="Used by Augur Reporters<br>to determine market outcome"><br/>source: {renderCappedLength(28, resolutionSource)}</span>*/}
                  {/*)*/}
                  {/*}*/}
                </Dotdotdot>
              </div>
              <div
                className="column is-half-mobile has-text-left-mobile has-text-centered-tablet has-text-centered-desktop">
                <div className="columns is-multiline">
                  <div className="column content is-12 is-marginless">
                    {prediction.node}
                  </div>
                  <div className="column content is-12">
                    <p className="is-italic comment-link is-marginless"
                       data-tip="Coming Soon!"><strong>{props.m.getCommentCount()}</strong> comments</p>
                  </div>
                </div>
              </div>
              <div className="column is-half-mobile has-text-right">
                <div className="columns is-multiline">
                  <div className="column content is-12 is-marginless is-centered">
                    {/* // TODO consider rendering "at stake" differently if market has ended or resolved; could say "total payout" etc. */}
                    {openInterest === undefined || openInterest.getUsd() === 0 ? "No money"
                      : <strong><Price2
                        p={props.m.getMarketCapitalization()}
                        o={props.currencySelectionObserver}/></strong>
                    }
                    <br/>at stake
                  </div>
                  <div className="column content is-12">
                    {renderEndDate()}
                  </div>
                </div>
              </div>
              <div className="column is-12 is-hidden-tablet">
                {mobileControls}
              </div>

              <div className={classNames('modal has-text-left', showEmbed && 'is-active')}>
                <div className="modal-background"/>
                <div className="modal-card">
                  <header className="modal-card-head">
                    <p className="modal-card-title">Embed Market</p>
                  </header>
                  <section className="modal-card-body">
                    <p>Embed the following HTML code:</p>
                    <CopyToClipboard text={this.getMarketEmbedCode(marketID)}>
                      <pre data-tip="Click to copy to your clipboard">
                        {this.getMarketEmbedCode(marketID)}
                      </pre>
                    </CopyToClipboard>
                  </section>
                  <footer className="modal-card-foot">
                    <button className="button is-success" onClick={this.closeEmbed}>Done</button>
                  </footer>
                </div>
                <button className="modal-close is-large" aria-label="close" onClick={this.closeEmbed}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  private toggleEmbed = () => {
    this.setState(({showEmbed}) => ({
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

  private getMarketEmbedCode = (marketID: string) => {
    const width = 320;
    const height = 270;
    return `<iframe width="${width}" height="${height}" src="${window.location.protocol}//${window.location.host}/e/${marketID}" frameborder="0"></iframe>`;
  };
}

export default OneMarketSummary;
