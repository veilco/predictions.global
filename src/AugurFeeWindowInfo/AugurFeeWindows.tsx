import * as React from 'react';
import moment from 'moment';
import AugurFeeWindow, {FeeWindow} from 'augur-fee-window-infos';

interface Props<T> {
  test?: any
}

interface State<T> {
  augurFeeWindow: AugurFeeWindow,
  currentFeeWindow?: FeeWindow,
  currentTime?: Date,
  nextFeeWindow?: FeeWindow,
  previousFeeWindow?: FeeWindow,
}

export class AugurFeeWindows<T> extends React.Component<Props<T>, State<T>> {
  public readonly state: State<T>;

  public constructor(props: Props<T>) {
    super(props);

    this.state = {
      augurFeeWindow: new AugurFeeWindow(),
    };

    this.state.augurFeeWindow.getCurrentFeeWindow()
      .then(currentFeeWindow => {
        this.setState({
          currentFeeWindow,
          currentTime: new Date(),
        }, () => {
          setInterval(() => {
            this.setState({ currentTime: new Date() });
          }, 1000);
        });
      })
      // tslint:disable-next-line
      .catch(console.error);

    this.state.augurFeeWindow.getNextFeeWindow()
      .then(nextFeeWindow => {
        this.setState({
          nextFeeWindow,
        });
      })
      // tslint:disable-next-line
      .catch(console.error);

    this.state.augurFeeWindow.getPreviousFeeWindow()
      .then(previousFeeWindow => {
        this.setState({
          previousFeeWindow,
        });
      })
      // tslint:disable-next-line
      .catch(console.error);
  }

  public render() {
    const {
      currentFeeWindow,
      currentTime,
      nextFeeWindow,
      previousFeeWindow,
    } = this.state;

    return (
      <section className="hero is-primary">
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
                  {(currentFeeWindow && currentTime) ? (
                    <div className="card-content">
                      <div><strong>Address</strong><p>{currentFeeWindow.address}</p></div>
                      <div><strong>Fees</strong><p>{currentFeeWindow.balance.toString()}Ξ</p></div>
                      <div><strong>Total Stake</strong><p>{currentFeeWindow.totalFeeStake.toString()}Ξ</p></div>
                      <div>
                        <strong>Ends </strong>{moment(currentFeeWindow.endTime).fromNow()}{' on '}
                        {currentFeeWindow.endTime.toLocaleString()}

                        {/* This causes React to re-render the component so that the time until the end updates */}
                        <div style={{display: 'none'}}>{ currentTime.valueOf() }</div>
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
                      <div><strong>Address</strong><p>{nextFeeWindow.address}</p></div>
                      <div><strong>Fees</strong><p>{nextFeeWindow.balance.toString()}Ξ</p></div>
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
                      <div><strong>Address</strong><p>{previousFeeWindow.address}</p></div>
                      <div><strong>Fees</strong><p>{previousFeeWindow.balance.toString()}Ξ</p></div>
                      <div><strong>Total Stake</strong><p>{previousFeeWindow.totalFeeStake.toString()} REP</p></div>
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
}