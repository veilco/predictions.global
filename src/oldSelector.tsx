import * as React from 'react';

interface Props<T> {
  currentValue: T,
  currentRendered: React.ReactNode,
  setValue: (t: T) => void,
  // TODO warning, this values Array<complex type> will allow passing props that aren't actually of that type.
  values: Array<{
    value: T,
    rendered: React.ReactNode,
  }>,
  buttonClassNameSuffix ?: string,
};

interface SelectorState {
  isActive: boolean,
};

const selectorInitialState: SelectorState = {
  isActive: false,
};

// TODO Selector was forked into OldSelector because I added ObserverOwner in a hack. TODO fix all this.
export default class OldSelector<T> extends React.Component<Props<T>, SelectorState> {
  public blurTimerId: NodeJS.Timer | undefined;
  public readonly state: SelectorState = selectorInitialState;
  public constructor(props: Props<T>) {
    super(props);
    this.blurTimerId = undefined;
    this.setNotActiveVerySoon = this.setNotActiveVerySoon.bind(this);
    this.toggleIsActive = this.toggleIsActive.bind(this);
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
      }, 25);
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
          <span>{this.props.currentRendered}</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down" aria-hidden="true" />
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        {this.props.values.map(o => {
          // In list of values to select, skip rendering value which is
          // currently selected, because it's displayed at top of selector.
          if (o.value === this.props.currentValue) { return undefined; }
          else {
            return <div className="dropdown-content" key={o.value.toString()} onClick={this.setValue.bind(this, o.value)}>
              <a href="#" className="dropdown-item">{o.rendered}</a>
            </div>;
          }
        })}
      </div>
    </div>;
  }
}
