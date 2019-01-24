import classNames from 'classnames';
import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
import { TwitterIcon, TwitterShareButton } from 'react-share';
import VeilMarketsContext from "./VeilMarketsContext";
import './MarketControls.css';

interface Props {
  callToActionURL: string,
  className?: string,
  forceAllowLinkToAugurApp?: true, // if passed, the link to view market in local augur app will be generated. Otherwise it'll be generated iff type === 'mobile'
  isEmbedded?: boolean,
  marketId: string,
  marketSummary: string, // textual summary of market, eg. to include in a tweet
  type: "mobile" | "not-mobile",
}

interface State {
  // used to show visual feedback that user copied to clipboard
  isEmbedHTMLCopiedToClipboard: boolean,
  isMarketIdCopiedToClipboard: boolean,
  isMarketSummaryCopiedToClipboard: boolean,
}

const initialState: State = {
  isEmbedHTMLCopiedToClipboard: false,
  isMarketIdCopiedToClipboard: false,
  isMarketSummaryCopiedToClipboard: false,
}

function find<T>(array: T[], predicate: (t: T) => boolean) {
  for (const element of array) {
    if (predicate(element)) {
      return element;
    }
  }
  return undefined;
}

export default class MarketControls extends React.Component<Props, State> {
  public readonly state: State = initialState
  public copiedToClipboard = (type: "isMarketIdCopiedToClipboard" | "isMarketSummaryCopiedToClipboard" | "isEmbedHTMLCopiedToClipboard") => {
    // weird if statement required for typescript to recognize type is valid key of state
    if (type === "isMarketIdCopiedToClipboard") {
      this.setState({ [type]: true });
    } else if (type === "isMarketSummaryCopiedToClipboard") {
      this.setState({ [type]: true });
    } else {
      this.setState({ [type]: true });
    }
    setTimeout(() => {
      if (this.state[type]) {
        if (type === "isMarketIdCopiedToClipboard") {
          this.setState({ [type]: false });
        } else if (type === "isMarketSummaryCopiedToClipboard") {
          this.setState({ [type]: false });
        } else {
          this.setState({ [type]: false });
        }
      }
    }, 100);
  }
  // tslint:disable-next-line
  public embedHTMLCopiedToClipboard = this.copiedToClipboard.bind(this, "isEmbedHTMLCopiedToClipboard")
  // tslint:disable-next-line
  public marketIdCopiedToClipboard = this.copiedToClipboard.bind(this, "isMarketIdCopiedToClipboard")
  // tslint:disable-next-line
  public marketSummaryCopiedToClipboard = this.copiedToClipboard.bind(this, "isMarketSummaryCopiedToClipboard")
  public render() {
    const { type, callToActionURL, className, marketId, marketSummary, isEmbedded } = this.props;
    return <div
      className={classNames(
        "columns market-controls has-text-centered is-centered",
        type === "mobile" ? "mobile is-mobile" : "not-mobile is-multiline",
        className,
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
            data-place={isEmbedded ? 'right' : 'top' /* while embedded, the market controls are pushed to left due to our logo, so this tooltip needs to be right or it's off the side of iframe. data-place='top' is default */}
            data-tip={
              /* mobile tooltips don't display until clicked, but embedded is mobile view by default, so we'll show desktop tooltip */
              type === 'mobile' && !isEmbedded ? "Copied market summary to clipboard" : "Copy market summary to clipboard"
            } />
        </CopyToClipboard>
      </div>
      <div className={"column content is-marginless " + (type === "mobile" ? "is-narrow" : "is-12")}>
        <CopyToClipboard text={marketId}
          onCopy={this.marketIdCopiedToClipboard}>
          <div data-tip={
            /* mobile tooltips don't display until clicked, but embedded is mobile view by default, so we'll show desktop tooltip */
            type === 'mobile' && !isEmbedded ? "Copied Augur market ID to clipboard" : "Copy Augur market ID to clipboard"
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
          type === 'mobile' && this.props.forceAllowLinkToAugurApp === undefined ?
            <img className="augur-logo"
              src="/augur-logo.svg"
              data-multiline={true}
              data-tip={`View market in Augur App.<br>NOTE: Desktop only.<br>To get started,<br>click "Download Augur App"<br>at the bottom of ${isEmbedded ? 'Predictions.Global' : 'this page'}.`} />
            : <a target="_blank"
              href={"http://localhost:8080/#/market?id=" + marketId}>
              <img className="augur-logo"
                src="/augur-logo.svg"
                data-multiline={true}
                data-tip={`View market in Augur App.<br>NOTE: You must run Augur App yourself.<br>To get started, click "Download Augur App"<br>at the bottom of ${isEmbedded ? 'Predictions.Global' : 'this page'}.`} />
            </a>
        }
      </div>
      <VeilMarketsContext.Consumer>
        {marketIds => {
          const ids = marketIds.find(([address, _]) => address === marketId);
          if (!ids) {
            return null;
          }
          return (
            <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
              <a
                target="_blank"
                href={`${process.env.REACT_APP_VEIL_URL ||
                  "https://app.veil.co"}/market/${ids[1]}`}
              >
                <img
                  className="veil-logo"
                  src="/veil-logo-v.png"
                  data-multiline={true}
                  data-tip={`View market in Veil`}
                />
              </a>
            </div>
          );
        }}
      </VeilMarketsContext.Consumer>
      {/* for embedded, we show our logo in the same <columns> as other market controls on mobile, however for desktop the logo we show as its own column/block below the main card */}
      {isEmbedded && type === 'mobile' && (
        <div className={"column is-narrow"}>
          <a target="_blank" href={`${window.location.protocol}//${window.location.host}`}>
            {/* paddingTop: 5px is because we want this logo to be vertically centered, but if we add is-vcentered to these columns, then the augur-logo.svg is positioned awkwardly relative to twitter icon. */}
            <img style={{ width: '115px', paddingTop: '5px' }} className="logo" src="/logo.png" />
          </a>
        </div>
      )}
      {!isEmbedded && (
        <div className={"column " + (type === "mobile" ? "is-narrow" : "is-12")}>
          <CopyToClipboard text={getMarketEmbedCode(marketId)} onCopy={this.embedHTMLCopiedToClipboard}>
            <span className={this.state.isEmbedHTMLCopiedToClipboard ? "embed-copied" : ""}>
              <i className="fas fa-code is-hidden-mobile"
                data-multiline={true} data-tip='Copy HTML to embed market<br>summary in your webpage.<br>Please use default dimensions<br>or width="800" height="192".' />
              <i className="fas fa-code is-hidden-tablet"
                data-multiline={true} data-tip='Copied HTML to embed market<br>summary in your webpage.<br>Please use default dimensions<br>or width="800" height="192".' />
            </span>
          </CopyToClipboard>
        </div>
      )}
    </div>;
  }
}

export function getMarketEmbedCode(marketID: string): string {
  const width = 320;
  const height = 340;
  return `<iframe width="${width}" height="${height}" src="${window.location.protocol}//${window.location.host}/e/v1/${marketID}" frameborder="0"></iframe>`;
};
