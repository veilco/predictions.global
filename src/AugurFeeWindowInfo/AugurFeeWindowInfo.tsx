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

interface State<t> {
  network: string,
  augurFeeWindow: AugurFeeWindow,
}

interface Props<T> {
  ms: MarketsSummary
  currencySelectionObserverOwner: ObserverOwner<Currency>,
}

export default class AugurFeeWindowInfo<T> extends React.Component<Props<T>, State<T>> {
  public readonly state: State<T>;
  private updateAugurFeeWindow: any;

  public constructor(props: Props<T>) {
    super(props);

    this.state = {
      augurFeeWindow: new AugurFeeWindow(),
      network: '',
    };

    this.updateAugurFeeWindow = debounce(() => {
      const {network} = this.state;

      const web3 = network ? new Web3(new Web3.providers.HttpProvider(network)) : undefined;
      const augurFeeWindow = new AugurFeeWindow(web3);
      this.setState({
        augurFeeWindow,
      });
    }, 1000);
  }

  public render() {
    const {
      augurFeeWindow,
      network,
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
                          <input className="input" value={network} onChange={this.handleNetworkChange} placeholder="https://mainnet.infura.io/augur" />
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
    const network = e.target.value;

    this.setState({
      network,
    }, this.updateAugurFeeWindow);
  };
}
