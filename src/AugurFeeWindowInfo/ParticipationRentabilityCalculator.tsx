import * as React from 'react';
import BigNumber from 'bignumber.js';
import AugurFeeWindow, {FeeWindow} from 'augur-fee-window-infos';
import {ethToGwei, gweiToEth} from '../Currency';

interface Props<T> {
  test?: any
}

interface State<T> {
  augurFeeWindow: AugurFeeWindow,
  currentFeeWindow?: FeeWindow,

  // These are stored as strings to support trailing decimals (e.g. 1.) in the inputs
  fees?: string,
  gasPrice?: string,
  gasUsed: string,
  numRep: string,
  repEthPrice?: string,
  stake?: string,
}

export class ParticipationRentabilityCalculator<T> extends React.Component<Props<T>, State<T>> {
  public state: State<T>;

  constructor(props: Props<T>) {
    super(props);

    this.state = {
      augurFeeWindow: new AugurFeeWindow(),
      gasUsed: '323848',
      numRep: '1',
    };

    this.state.augurFeeWindow.getCurrentFeeWindow()
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

    this.state.augurFeeWindow.getGasPrice()
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

    this.state.augurFeeWindow.getRepEthPrice()
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

    if (!fees || !gasPrice || !repEthPrice || !stake) {
      return (
        <section className="hero">
          <div className="hero-body">
            <div className="container">
              <h4 className="title is-4">Participation Rentability Calculator</h4>
              <div className="box has-text-centered">
                <i className="fas fa-sync fa-spin fa-2x"/>
              </div>
            </div>
          </div>
        </section>
      );
    }

    const participationRentabilityResult = this.state.augurFeeWindow.calculateParticipationRentability(
      new BigNumber(fees),
      gweiToEth(new BigNumber(gasPrice)),
      new BigNumber(gasUsed),
      new BigNumber(numRep),
      new BigNumber(repEthPrice),
      new BigNumber(stake),
    );

    return (
      <section className="hero">
        <div className="hero-body">
          <div className="container">
            <h4 className="title is-4">Participation Rentability Calculator</h4>
            <div className="box">
              <div className="columns">
                <div className="column">
                  <h6 className="title is-6">Input</h6>
                  <table className="table">
                    <tbody>
                    <tr>
                      <td>
                        <label htmlFor="repEthPrice">REP price (by CryptoCompare)</label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control">
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
                        <label htmlFor="gasPrice">Gas price (by Ξ Gas Station)</label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control">
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
                        <label htmlFor="gasUsed">Gas used (for staking REP and withdrawing the profit => 2
                          transactions)</label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control">
                            <input className="input" id="gasUsed" value={gasUsed} onChange={this.handleInputChange}/>
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
                        <label htmlFor="numRep">Number of REP</label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control">
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
                        <label htmlFor="fees">Fees in Current Fee Window</label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control">
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
                        <label htmlFor="stake">Total Stake in Current Fee Window</label>
                      </td>
                      <td>
                        <div className="field has-addons">
                          <div className="control">
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
                  <h6 className="title is-6">Result</h6>
                  <table className="table">
                    <tbody>
                    <tr>
                      <td>Total gas cost</td>
                      <td>{participationRentabilityResult.gasCost.toString()}Ξ</td>
                    </tr>
                    <tr>
                      <td>Total fee profit</td>
                      <td>{participationRentabilityResult.totalFeeProfit.toString()}Ξ</td>
                    </tr>
                    <tr>
                      <td>Total profit</td>
                      <td>{participationRentabilityResult.totalProfit.toString()}Ξ</td>
                    </tr>
                    <tr>
                      <td>Profit per REP</td>
                      <td>{participationRentabilityResult.profitPerRep.toString()}Ξ</td>
                    </tr>
                    <tr>
                      <td>Profit in %</td>
                      <td>{participationRentabilityResult.profitPercent.multipliedBy(100).toString()}%</td>
                    </tr>
                    <tr>
                      <td>Profit in % p.a.</td>
                      <td>{participationRentabilityResult.profitPercentPA.multipliedBy(100).toString()}%</td>
                    </tr>
                    <tr>
                      <td>Number of REP to break even</td>
                      <td>{participationRentabilityResult.numRepBreakEven.toString()} REP</td>
                    </tr>
                    <tr>
                      <td>Gas price to break even</td>
                      <td>{ethToGwei(participationRentabilityResult.gasPriceBreakEven).toString()} Gwei</td>
                    </tr>
                    <tr>
                      <td>Number of REP for maximizing profit</td>
                      <td>{participationRentabilityResult.numRepMaxProfitPerRep.toString()}% REP</td>
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

  private handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    const nextState = {};
    nextState[id] = e.target.value;

    this.setState(nextState);
  };
}