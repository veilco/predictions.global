import * as React from 'react';
import { Currency } from './Currency';
import { MarketsSummary } from './generated/markets_pb';
import { Observer } from './observer';
import OldSelector from './oldSelector';
import Price2, { numberFormat } from './Price';
import MarketCreatorSignup from './MarketCreatorSignup';

export const feedbackFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSdTCmsQH3EUKOaIeV1ECA124iLZMB5GiHby7XtRj19glqtNRw/viewform";


export interface HasMarketsSummary {
  ms: MarketsSummary
};

type HeaderProps = HasMarketsSummary & {
  currencySelectionObserver: Observer<Currency>,
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
  const languageSelector = <OldSelector<Language>
    currentValue={'English'}
    currentRendered={'English'}
    buttonClassNameSuffix={'is-small'}
    setValue={languageNoop}
    values={[
      { value: 'English', rendered: 'English' },
      { value: 'Coming Soon!', rendered: 'Coming Soon!' },
      { value: "快来了", rendered: '快来了"' },
      { value: "Próximamente", rendered: 'Próximamente' },
      { value: "قريبا", rendered: "قريبا" },
      { value: "Em breve", rendered: 'Em breve' },
      { value: "Prossimamente", rendered: 'Prossimamente' },
      { value: "Скоро", rendered: 'Скоро' },
      { value: "Demnächst", rendered: 'Demnächst' },
      { value: "곧 출시 예정", rendered: '곧 출시 예정' },
      { value: "近日公開", rendered: '近日公開' },
      { value: "Arrive bientôt", rendered: 'Arrive bientôt' },
      { value: "Sắp có", rendered: 'Sắp có' },
      { value: "जल्द आ रहा है", rendered: 'जल्द आ रहा है' },
    ]} />;
  return <section className="header section">
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
  </section>;
}

export default Header
