import * as React from 'react';
import * as ReactTooltip from "react-tooltip";
import BigNumber from 'bignumber.js';
import AugurFeeWindow, {FeeWindow} from 'augur-fee-window-infos';
import {Currency, ethToGwei, gweiToEth} from '../Currency';
import {ExchangeRates, makePriceFromEthAmount} from '../ExchangeRates';
import {Observer} from "../Components/observer";
import Price2 from "../Price";

interface Props {
  augurFeeWindow: AugurFeeWindow,
  currencySelectionObserver: Observer<Currency>,
  exchangeRates?: ExchangeRates,
}

interface State {
  currentFeeWindow?: FeeWindow,

  // These are stored as strings to support trailing decimals (e.g. 1.) in the inputs
  fees?: string,
  gasPrice?: string,
  gasUsed: string,
  numRep: string,
  repEthPrice?: string,
  stake?: string,
}

const blurb = "This participation rentability calculator helps an Augur Reporter determine how participation in a Fee Window may yield a profit on the Reporter's REP tokens.";

export class ParticipationRentabilityCalculator extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // TODO explain in comment: why this initial state?
    this.state = {
      gasUsed: '323848',
      numRep: '1',
    };

    this.updateAugurFeeWindow();
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.augurFeeWindow === this.props.augurFeeWindow) {
      return;
    }
    // augurFeeWindow changes, so clear state until new fee window is loaded
    this.setState({
      // The state cleared here is expected to be exactly the state set after successful network fetch in updateAugurFeeWindow().
      fees: undefined,
      gasPrice: undefined,
      repEthPrice: undefined,
      stake: undefined,
    });

    this.updateAugurFeeWindow();
  }

  public render() {
    const {
      fees,
      gasPrice,
      gasUsed,
      numRep,
      repEthPrice,
      stake,
    } = this.state;

    const {
      currencySelectionObserver,
      exchangeRates,
    } = this.props;

    // Check undefined (as opposed to falsy) so that empty values don't trigger the loading screen. Empty values happen normally as user is erasing/typing new values into calculator.
    if (fees === undefined || gasPrice === undefined || repEthPrice === undefined || stake === undefined || exchangeRates === undefined) {
      return (
        <section className="hero">
          <div className="hero-body">
            <div className="container">
              <h4 className="title is-4">REP Profit Calculator</h4>
              <p className="content">{blurb}</p>
              <div className="box has-text-centered">
                <i className="fas fa-sync fa-spin fa-2x"/>
              </div>
            </div>
          </div>
        </section>
      );
    }

    const participationRentabilityResult = this.props.augurFeeWindow.calculateParticipationRentability(
      new BigNumber(fees),
      gweiToEth(new BigNumber(gasPrice)),
      new BigNumber(gasUsed),
      new BigNumber(numRep),
      new BigNumber(repEthPrice),
      new BigNumber(stake),
    );

    return (
      <section className="hero">
        <ReactTooltip/>
        <div className="hero-body">
          <div className="container">
            <h4 className="title is-4">REP Profit Calculator</h4>
            <p className="content">{blurb}</p>
            <div className="box">
              <div className="columns">
                <div className="column">
                  <h6 className="title is-5">Input</h6>
                  <table className="table">
                    <tbody>
                    <tr>
                      <td>
                        <label htmlFor="repEthPrice">
                          <strong>
                            {'REP Price '}
                            <i className="far fa-question-circle" data-multiline={true} data-tip="By CryptoCompare"/>
                          </strong>
                        </label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input className="input" id="repEthPrice" value={repEthPrice}
                                   onChange={this.handleInputChange}/>
                          </div>
                          <div className="control">
                            <div className="button is-static">
                              Ξ
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="gasPrice">
                          <strong>
                            {'Gas Price '}
                            <i className="far fa-question-circle" data-multiline={true} data-tip="By Ξ Gas Station"/>
                          </strong>
                        </label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input className="input" id="gasPrice" value={gasPrice} onChange={this.handleInputChange}/>
                          </div>
                          <div className="control">
                            <div className="button is-static">
                              Gwei
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="gasUsed"><strong>
                          {'Gas Used '}
                          <i className="far fa-question-circle" data-multiline={true} data-tip="For staking REP and withdrawing the profit greater than or equal to two
                          transactions"/>
                        </strong></label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input className="input" id="gasUsed" value={gasUsed} onChange={this.handleInputChange}/>
                          </div>
                          <div className="control">
                            <div className="button is-static">
                              Gas
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="numRep"><strong>Number of REP</strong></label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input className="input" id="numRep" value={numRep} onChange={this.handleInputChange}/>
                          </div>
                          <div className="control">
                            <div className="button is-static">
                              REP
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="fees"><strong>Fees in Current Fee Window</strong></label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input className="input" id="fees" value={fees} onChange={this.handleInputChange}/>
                          </div>
                          <div className="control">
                            <div className="button is-static">
                              Ξ
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label htmlFor="stake"><strong>Total Stake in Current Fee Window</strong></label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input className="input" id="stake" value={stake} onChange={this.handleInputChange}/>
                          </div>
                          <div className="control">
                            <div className="button is-static">
                              REP
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>

                <div className="column">
                  <h6 className="title is-5">Results</h6>
                  <table className="table">
                    <tbody>
                    <tr>
                      <td><strong>Total Gas Cost</strong></td>
                      <td>
                        <Price2
                          p={makePriceFromEthAmount(exchangeRates, participationRentabilityResult.gasCost.toNumber())}
                          o={currencySelectionObserver}/>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Total Fee Profit</strong></td>
                      <td>
                        <Price2
                          p={makePriceFromEthAmount(exchangeRates, participationRentabilityResult.totalFeeProfit.toNumber())}
                          o={currencySelectionObserver}/>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Total Profit</strong></td>
                      <td>
                        <Price2
                          p={makePriceFromEthAmount(exchangeRates, participationRentabilityResult.totalProfit.toNumber())}
                          o={currencySelectionObserver}/>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Profit per REP</strong></td>
                      <td>
                        <Price2
                          p={makePriceFromEthAmount(exchangeRates, participationRentabilityResult.profitPerRep.toNumber())}
                          o={currencySelectionObserver}/>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Profit in %</strong></td>
                      <td>{participationRentabilityResult.profitPercent.multipliedBy(100).toFormat(5)}%</td>
                    </tr>
                    <tr>
                      <td><strong>Profit in % P.A.</strong></td>
                      <td>{participationRentabilityResult.profitPercentPA.multipliedBy(100).toFormat(5)}%</td>
                    </tr>
                    <tr>
                      <td><strong>Number of REP to Break Even</strong></td>
                      <td>{participationRentabilityResult.numRepBreakEven.toFormat(5)} REP</td>
                    </tr>
                    <tr>
                      <td><strong>Gas Price to Break Even</strong></td>
                      <td>{ethToGwei(participationRentabilityResult.gasPriceBreakEven).toFormat(5)} Gwei</td>
                    </tr>
                    </tbody>
                  </table>
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

    // TODO both ParticipationRentabilityCalculator and AugurFeeWindows calls augurFeeWindow.getCurrentFeeWindow() and we should collapse this into a single network call to reduce load on Ethereum servers.
    augurFeeWindow.getCurrentFeeWindow()
      .then(currentFeeWindow => {
        this.setState({
          fees: currentFeeWindow.balance.toFixed(),
          stake: currentFeeWindow.totalFeeStake.toFixed(),
        });
      })
      .catch((err) => {
        this.setState({
          fees: '0',
          stake: '0',
        });

        // tslint:disable-next-line
        console.error(err);
      });

    augurFeeWindow.getGasPrice()
      .then(gasPrice => {
        this.setState({
          gasPrice: ethToGwei(gasPrice).toFixed(),
        });
      })
      .catch((err) => {
        this.setState({
          gasPrice: '0',
        });

        // tslint:disable-next-line
        console.error(err);
      });

    augurFeeWindow.getRepEthPrice()
      .then(repEthPrice => {
        this.setState({
          repEthPrice: repEthPrice.toFixed(),
        });
      })
      .catch((err) => {
        this.setState({
          repEthPrice: '0',
        });

        // tslint:disable-next-line
        console.error(err);
      });
  };

  private handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    const nextState = {};

    nextState[id] = e.target.value;

    this.setState(nextState);
  };
}
