import moment from 'moment';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Currency } from '../Currency';
import { MarketsSummary } from '../generated/markets_pb';
import MarketCreatorSignup from '../MarketCreatorSignup';
import { filterMarketsAboveLiquidityRetentionRatioCutoff } from '../MarketSort';
import Price2, { numberFormat } from '../Price';
import { Dropdown } from './Dropdown';
import { Observer } from './observer';

export const feedbackFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSdTCmsQH3EUKOaIeV1ECA124iLZMB5GiHby7XtRj19glqtNRw/viewform";


export interface HasMarketsSummary {
  ms: MarketsSummary
};

type HeaderProps = HasMarketsSummary & {
  currencySelectionObserver: Observer<Currency>,
  headerContent: React.ReactNode,
  doesClickingLogoReloadPage: boolean, // if true, page is reloaded when clicking logo, otherwise it's a react-router transition
};

type Language = "English" |
  "Coming Soon!" |
  "快来了" | // Chinese (Simplified)
  "Próximamente" | // Spanish
  "قريبا" | // Arabic
  "Em breve" | // Portuguese
  "Prossimamente" | // Italian
  "Скоро" | // Russian
  "Demnächst" | // German
  "곧 출시 예정" | // Korean
  "近日公開" | // Japanese
  "Arrive bientôt" | // French
  "Sắp có" | // Vietnamese
  "जल्द आ रहा है" // Hindi
  ;

const languageNoop = () => {/* no-op for now */ };

const Header: React.SFC<HeaderProps> = (props) => {
  const liquidMarketCount = getLiquidMarketCount(props.ms);
  const languageSelector = <Dropdown<Language>
    currentValueOrObserver={'English'}
    buttonClassNameSuffix={'is-small'}
    onChange={languageNoop}
    values={[
      'English',
      'Coming Soon!',
      "快来了",
      "Próximamente",
      "قريبا",
      "Em breve",
      "Prossimamente",
      "Скоро",
      "Demnächst",
      "곧 출시 예정",
      "近日公開",
      "Arrive bientôt",
      "Sắp có",
      "जल्द आ रहा है",
    ]} />;
  return <div>
    <section className="header section">
      <div className="container">
        <div className="columns is-mobile">
          <div className="column is-9-mobile is-8-tablet is-8-desktop">
            <div className="columns is-vcentered">
              <div className="datum column is-narrow">
                <span className="content">
                  <strong>Markets: </strong>
                  {numberFormat.format(props.ms.getTotalMarkets())}
                </span>
              </div>
              <div className="datum column is-narrow">
                <strong>Total Money at Stake: </strong>
                <Price2
                  p={props.ms.getTotalMarketsCapitalization()}
                  o={props.currencySelectionObserver} />
              </div>
              <div className="datum column">
                <span className="content">
                  <strong>Block Number: </strong>
                  {numberFormat.format(props.ms.getBlock())}
                </span>
              </div>
            </div>
            {liquidMarketCount !== undefined && <div className="columns is-vcentered">
              <div className="datum column is-narrow no-padding-top">
                <span className="content">
                  <strong>Liquid Markets: </strong>
                  {liquidMarketCount}
                </span>
              </div>
            </div>}
          </div>
          <div className="column is-3-mobile is-4-tablet is-4-desktop">
            <div className="is-clearfix">
              <div className="is-pulled-left is-hidden-touch">
                <MarketCreatorSignup />
              </div>
              <div className="is-pulled-right">
                {languageSelector}
              </div>
            </div>
            <div style={{ paddingTop: "0.75rem" }} className="is-pulled-right is-hidden-desktop has-text-centered">
              <MarketCreatorSignup />
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="less-padding-bottom section">
      <div className="columns is-centered is-marginless is-paddingless">
        <div className="column is-12-mobile is-5-tablet is-5-desktop">
          {/* NB logo is fixed width and column must be larger than this or logo column will bleed into next column. The fixed width value in App.scss was chosen to make logo look good responsively. */}
          {props.doesClickingLogoReloadPage ?
            <a href="/">
              <img className="logo" src="/logo.png" />
            </a> :
            <Link to="/">
              <img className="logo" src="/logo.png" />
            </Link>
          }
        </div>
        <div className="column is-12-mobile is-5-tablet is-5-desktop">
          {props.headerContent}
        </div>
      </div>
    </section>
  </div>;
}

function getLiquidMarketCount(ms: MarketsSummary): number | undefined {
  const lmc = ms.getLiquidityMetricsConfig();
  if (lmc === undefined) {
    return;
  }
  const tranches = lmc.getMillietherTranchesList();
  if (tranches.length < 1) {
    return;
  }
  // TODO this inefficiently constructs one throw-away moment per market
  const now = moment();
  return ms.getMarketsList()
    .filter(m => moment.unix(m.getEndDate()).isAfter(now))
    .filter(filterMarketsAboveLiquidityRetentionRatioCutoff.bind(null, tranches[0])).length;
}

export default Header
