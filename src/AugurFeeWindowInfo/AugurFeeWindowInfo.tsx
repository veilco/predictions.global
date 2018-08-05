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
import { Cancelable } from '../../node_modules/@types/lodash';

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

    this.state = {
      augurFeeWindow: new AugurFeeWindow(),
      web3HttpEndpoint: '',
    };

    this.updateAugurFeeWindow = debounce(() => {
      const {web3HttpEndpoint} = this.state;

      const web3 = web3HttpEndpoint ? new Web3(new Web3.providers.HttpProvider(web3HttpEndpoint)) : undefined;
      const augurFeeWindow = new AugurFeeWindow(web3);
      this.setState({
        augurFeeWindow,
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
                      <label className="label">Web3&nbsp;Network</label>
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
