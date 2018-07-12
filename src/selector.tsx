import * as React from 'react';
import { Observer, Unsubscribe } from './observer';

interface Props<T> {
  currentValueObserver: Observer<T>, // TODO drop hack dependency on Observer, see discussion below
  renderValue: (t: T) => React.ReactNode, // pure function to render anonymous T
  setValue: (t: T) => void, // setValue() is expected to feed back into currentValueObserver so that this Selector sets the observed value
  values: T[],
  buttonClassNameSuffix?: string,
};

interface SelectorState<T> {
  isActive: boolean,
  u: Unsubscribe | undefined, // TODO drop hack dependency on Observer
  currentValue: T, // TODO drop hack dependency on Observer
};

// TODO ObserverOwner is designed to eliminate need to pass props/state down to children, to avoid unnecessary rerendering. However Selector was designed to take current selector as a prop, which means parent has to pass it as prop or state. The correct solution is some kind of ObserverOwner high order component which does the automatic sub/unsub and renders its child components. Something like:
/*
  <Observer<T> o={Observer<T>}>
    <Selector<T> ...> // current T value of Observer is automatically passed to Selector as a prop; this works by automatically caching current T in Observer as state.
  </Observer>
*/

export default class Selector<T> extends React.Component<Props<T>, SelectorState<T>> {
  public blurTimerId: NodeJS.Timer | undefined;
  public constructor(props: Props<T>) {
    super(props);
    this.blurTimerId = undefined;
    this.setNotActiveVerySoon = this.setNotActiveVerySoon.bind(this);
    this.toggleIsActive = this.toggleIsActive.bind(this);
    const sub = this.props.currentValueObserver((newValue: T) => this.setState({ currentValue: newValue }));
    this.state = {
      currentValue: sub.initialValue,
      isActive: false,
      u: sub.u,
    };
  }
  public componentWillUnmount() {
    if (this.state.u !== undefined) {
      this.state.u();
    }
  }
  public setNotActiveVerySoon(evt?: React.FocusEvent<HTMLDivElement>): void {
    // We use a timer to set isActive:false (which closes the dropdown), because if we
    // directly set isActive:false, then the Dropdown will be re-rendered and closed
    // before a subsequent click event can select a new value. Ie. when a user clicks a
    // new value, the act of clicking the value triggers a blur event, which closes the
    // dropdown and prevents the click from successfully changing a value. This solution
    // of using a timer seems to work fine; not sure what other solutions may exist.
    if (this.blurTimerId === undefined) {
      this.blurTimerId = setTimeout(() => {
        this.blurTimerId = undefined;
        if (this.state.isActive) {
          this.setState({ isActive: false });
        }
      }, 75); // previously this was 25ms, but users reported currency selector not working on desktop, which I believe is due to this race condition. We might want to move to a different dropdown library in general.
    }
  }
  public toggleIsActive(): void {
    this.setState({ isActive: !this.state.isActive });
  }
  public setValue(t: T, evt?: React.MouseEvent<HTMLDivElement>) {
    if (evt !== undefined) {
      evt.preventDefault();
    }
    this.setState({ isActive: false });
    this.props.setValue(t);
  }
  public render() {
    let className = "dropdown ";
    if (this.state.isActive) {
      className += "is-active";
    }
    return <div onBlur={this.setNotActiveVerySoon} className={className}>
      <div className="dropdown-trigger" onClick={this.toggleIsActive}>
        <button className={"button " + this.props.buttonClassNameSuffix} aria-haspopup="true" aria-controls="dropdown-menu">
          <span>{this.props.renderValue(this.state.currentValue)}</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down" aria-hidden="true" />
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        {this.props.values.map(v => {
          // In list of values to select, skip rendering value which is
          // currently selected, because it's displayed at top of selector.
          if (v === this.state.currentValue) { return undefined; }
          else {
            return <div className="dropdown-content" key={v.toString()} onClick={this.setValue.bind(this, v)}>
              <a href="#" className="dropdown-item">{this.props.renderValue(v)}</a>
            </div>;
          }
        })}
      </div>
    </div>;
  }
}
