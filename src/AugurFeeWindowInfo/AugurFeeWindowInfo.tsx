import * as React from 'react';
import debounce from 'lodash.debounce';
import {ObserverOwner} from '../Components/observer';
import {Currency} from '../Currency';
import {ParticipationRentabilityCalculator} from "./ParticipationRentabilityCalculator";
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {MarketsSummary} from '../generated/markets_pb';
import {AugurFeeWindows} from "./AugurFeeWindows";
import {getExchangeRatesFromMarketsSummary} from "../ExchangeRates";
import {CurrencyDropdown} from "../Currency/CurrencyDropdown";
import AugurFeeWindow from 'augur-fee-window-infos';
import Web3 from 'web3';
import { Cancelable } from 'lodash';
import { Helmet } from 'react-helmet';

interface State {
  web3HttpEndpoint: string,
  augurFeeWindow: AugurFeeWindow,
}

interface Props {
  ms: MarketsSummary
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

export default class AugurFeeWindowInfo extends React.Component<Props, State> {
  public readonly state: State;
  private updateAugurFeeWindow: (() => void) & Cancelable;

  public constructor(props: Props) {
    super(props);

    const web3HttpEndpoint = getSavedWeb3HttpEndpoint();

    this.state = {
      augurFeeWindow: newAugurFeeWindow(web3HttpEndpoint),
      web3HttpEndpoint,
    };

    this.updateAugurFeeWindow = debounce(() => {
      saveWeb3HttpEndpoint(this.state.web3HttpEndpoint); // save only after using has finished typing (ie debounce fires), to avoid saving partial URL
      this.setState({
        augurFeeWindow: newAugurFeeWindow(this.state.web3HttpEndpoint),
      });
    }, 1000);
  }

  public render() {
    const {
      augurFeeWindow,
      web3HttpEndpoint,
    } = this.state;

    const {
      ms,
      currencySelectionObserverOwner,
    } = this.props;
    const currencySelectionObserver = currencySelectionObserverOwner.observer;

    return (
      <div>
        <Header ms={ms}
                currencySelectionObserver={currencySelectionObserver}
                doesClickingLogoReloadPage={false}
                headerContent={
                  <div className="field is-horizontal">
                    <div className="field-label is-normal">
                      <label className="label">Ethereum&nbsp;HTTP&nbsp;Endpoint</label>
                    </div>
                    <div className="field-body">
                      <div className="field">
                        <div className="control">
                          <input className="input" value={web3HttpEndpoint} onChange={this.handleNetworkChange} placeholder="https://mainnet.infura.io/augur" />
                        </div>
                      </div>
                      <div className="field">
                        <div className="control">
                          <CurrencyDropdown currencySelectionObserver={currencySelectionObserver}
                                            onChange={this.setCurrency}/>
                        </div>
                      </div>
                    </div>
                  </div>
                }
        />
        <AugurFeeWindows
          augurFeeWindow={augurFeeWindow}
          exchangeRates={getExchangeRatesFromMarketsSummary(ms)}
          currencySelectionObserver={currencySelectionObserver}
        />
        <ParticipationRentabilityCalculator
          augurFeeWindow={augurFeeWindow}
          exchangeRates={getExchangeRatesFromMarketsSummary(ms)}
          currencySelectionObserver={currencySelectionObserver}
        />
        {Footer}
        <Helmet>
          <title>Augur Fee Windows &amp; Reporter REP Profit Calculator | Predictions.Global</title>
          <meta name="description" content="Information on Augur's Fee Windows, including Current Fee Window, Next Fee Window, and previous Fee Window. Augur REP token profit calculator, also called a participation rentability calculator." />
        </Helmet>
      </div>
    );
  }

  private setCurrency = (currency: Currency) => {
    if (this.props.currencySelectionObserverOwner) {
      this.props.currencySelectionObserverOwner.setValueAndNotifyObservers(currency);
    }
  };

  private handleNetworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const web3HttpEndpoint = e.target.value;

    this.setState({
      web3HttpEndpoint,
    }, this.updateAugurFeeWindow);
  };
}

function saveWeb3HttpEndpoint(web3HttpEndpoint: string) {
  localStorage.setItem('web3HttpEndpoint', web3HttpEndpoint);
}

function getSavedWeb3HttpEndpoint(): string {
  return localStorage.getItem('web3HttpEndpoint') || '';
}

function newAugurFeeWindow(web3HttpEndpoint: string): AugurFeeWindow {
  return new AugurFeeWindow(web3HttpEndpoint ? new Web3(new Web3.providers.HttpProvider(web3HttpEndpoint)) : undefined);
}
