import * as React from 'react';
import moment from 'moment';
import AugurFeeWindow, {FeeWindow} from 'augur-fee-window-infos';
import './AugurFeeWindows.css';
import Price2 from "../Price";
import {ExchangeRates, makePriceFromEthAmount} from "../ExchangeRates";
import {Observer} from "../Components/observer";
import {Currency} from "../Currency";

interface Props<T> {
  augurFeeWindow: AugurFeeWindow,
  currencySelectionObserver: Observer<Currency>,
  exchangeRates?: ExchangeRates,
}

interface State<T> {
  currentFeeWindow?: FeeWindow,
  currentTime?: Date,
  nextFeeWindow?: FeeWindow,
  previousFeeWindow?: FeeWindow,
}

export class AugurFeeWindows<T> extends React.Component<Props<T>, State<T>> {
  public readonly state: State<T>;

  public constructor(props: Props<T>) {
    super(props);

    // tslint:disable:no-console
    console.log(props);

    this.state = {};
    this.updateAugurFeeWindow();
  }

  public componentDidUpdate(prevProps: Props<T>) {
    if(prevProps.augurFeeWindow === this.props.augurFeeWindow) {
      return;
    }

    // tslint:disable:no-console
    console.log(this.props);
    this.updateAugurFeeWindow();
  }

  public render() {
    const {
      exchangeRates,
      currencySelectionObserver,
    } = this.props;

    const {
      currentFeeWindow,
      currentTime,
      nextFeeWindow,
      previousFeeWindow,
    } = this.state;

    return (
      <section className="hero augur-fee-windows" style={{background: '#fafafa'}}>
        <div className="hero-body">
          <div className="container">
            <h4 className="title is-4">Augur Fee Windows</h4>

            <div className="columns">
              <div className="column">
                <div className="card">
                  <header className="card-header">
                    <p className="card-header-title">
                      Current Fee Window
                    </p>
                  </header>
                  {(currentFeeWindow && currentTime && exchangeRates) ? (
                    <div className="card-content">
                      <div className="columns is-multiline">
                        <div className="column is-11"><strong>Address</strong><p><a target="_blank"
                                                                                    href={`https://etherscan.io/address/${currentFeeWindow.address}`}>{currentFeeWindow.address}</a>
                        </p></div>
                        <div className="column is-11"><strong>Fees</strong><p><Price2
                          p={makePriceFromEthAmount(exchangeRates, currentFeeWindow.balance.toNumber())}
                          o={currencySelectionObserver}/></p>
                        </div>
                        <div className="column is-11"><strong>Total Stake</strong>
                          <p>{currentFeeWindow.totalFeeStake.toString()} REP</p></div>
                        <div className="column is-11">
                          <strong>Ends </strong>{moment(currentFeeWindow.endTime).fromNow()}{' on '}
                          {currentFeeWindow.endTime.toLocaleString()}

                          {/* This causes React to re-render the component so that the time until the end updates */}
                          <div style={{display: 'none'}}>{currentTime.valueOf()}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-content has-text-centered">
                      <i className="fas fa-sync fa-spin fa-2x"/>
                    </div>
                  )}
                </div>
              </div>

              <div className="column">
                <div className="card">
                  <header className="card-header">
                    <p className="card-header-title">
                      Next Fee Window
                    </p>
                  </header>
                  {nextFeeWindow ? (
                    <div className="card-content">
                      <div className="columns is-multiline">
                        <div className="column is-11"><strong>Address</strong><p><a target="_blank"
                                                                                    href={`https://etherscan.io/address/${nextFeeWindow.address}`}>{nextFeeWindow.address}</a>
                        </p></div>
                        <div className="column is-11"><strong>Fees</strong><p>{nextFeeWindow.balance.toString()}Ξ</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-content has-text-centered">
                      <i className="fas fa-sync fa-spin fa-2x"/>
                    </div>
                  )}
                </div>
              </div>

              <div className="column">
                <div className="card">
                  <header className="card-header">
                    <p className="card-header-title">
                      Previous Fee Window
                    </p>
                  </header>
                  {previousFeeWindow ? (
                    <div className="card-content">
                      <div className="columns is-multiline">
                        <div className="column is-11"><strong>Address</strong><p><a target="_blank"
                                                                                    href={`https://etherscan.io/address/${previousFeeWindow.address}`}>{previousFeeWindow.address}</a>
                        </p></div>
                        <div className="column is-11"><strong>Fees</strong>
                          <p>{previousFeeWindow.balance.toString()}Ξ</p></div>
                        <div className="column is-11"><strong>Total Stake</strong>
                          <p>{previousFeeWindow.totalFeeStake.toString()} REP</p></div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-content has-text-centered">
                      <i className="fas fa-sync fa-spin fa-2x"/>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  private updateAugurFeeWindow = () => {
    const {augurFeeWindow} = this.props;

    augurFeeWindow.getCurrentFeeWindow()
      .then(currentFeeWindow => {
        this.setState({
          currentFeeWindow,
          currentTime: new Date(),
        }, () => {
          setInterval(() => {
            this.setState({currentTime: new Date()});
          }, 1000);
        });
      })
      // tslint:disable-next-line
      .catch(console.error);

    augurFeeWindow.getNextFeeWindow()
      .then(nextFeeWindow => {
        this.setState({
          nextFeeWindow,
        });
      })
      // tslint:disable-next-line
      .catch(console.error);

    augurFeeWindow.getPreviousFeeWindow()
      .then(previousFeeWindow => {
        this.setState({
          previousFeeWindow,
        });
      })
      // tslint:disable-next-line
      .catch(console.error);
  }
}