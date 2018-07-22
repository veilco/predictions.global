import * as classNames from "classnames";
import * as React from 'react';
import './Dropdown.css';
import { isObserver, Observer, Unsubscribe } from './observer';

interface Props<T> {
  buttonClassNameSuffix?: string,
  currentValueOrObserver: T | Observer<T>, // currentValue is set either as a (static) prop or via an Observer which allows currentValue to vary without re-rendering ancestor components that don't depend on current value.
  onChange: (t: T) => void, // onChange() is expected to feed back into props.currentValue, such that the dropdown updates the value shown (be that because props.currentValue is a literal T or Observer<T>)
  renderValue?: (t: T) => React.ReactNode, // Render values with custom logic
  values: T[],
}

interface State<T> {
  currentValue: T, // current selected value in this Dropdown
  isActive: boolean, // true iff this dropdown is open/expanded
  unsubscribe?: Unsubscribe, // Observer unsubscribe if props.currentValueOrObserver is an Observer
  renderValue: (t: T) => React.ReactNode, // used to render each value; can be passed with props.renderValue or defaults to value.toString()
}

export class Dropdown<T> extends React.Component<Props<T>, State<T>> {
  private dropdownContainer: React.RefObject<HTMLDivElement>;
  public constructor(props: Props<T>) {
    super(props);
    this.dropdownContainer = React.createRef();
    const renderValue: (t: T) => React.ReactNode = this.props.renderValue !== undefined ? this.props.renderValue : (t: T) => t.toString();
    if (isObserver(props.currentValueOrObserver)) {
      const sub = props.currentValueOrObserver.subscribe((newValue: T) => this.setState({ currentValue: newValue }));
      this.state = {
        currentValue: sub.initialValue,
        isActive: false,
        renderValue,
        unsubscribe: sub.unsubscribe,
      };
    } else {
      this.state = {
        currentValue: props.currentValueOrObserver,
        isActive: false,
        renderValue,
      };
    }
  }
  public componentDidMount(): void {
    document.addEventListener('click', this.handleDocumentClick, false);
  }
  public componentWillUnmount(): void {
    document.removeEventListener('click', this.handleDocumentClick);
    if (this.state.unsubscribe !== undefined) {
      this.state.unsubscribe();
    }
  }
  public render() {
    const {values} = this.props;
    const {isActive, currentValue, renderValue} = this.state;
    return <div className={classNames('dropdown', isActive && 'is-active')} ref={this.dropdownContainer}>
      <div className="dropdown-trigger" onClick={this.toggleIsActive}>
        <button className={classNames('button', this.props.buttonClassNameSuffix)} aria-haspopup="true"
                aria-controls="dropdown-menu">
          <span>{renderValue(currentValue)}</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down" aria-hidden="true"/>
          </span>
        </button>
      </div>
      <div className="dropdown-menu" role="menu">
        {values
          .filter(value => value !== currentValue)
          .map((value, index) => (
            <div className="dropdown-content" key={index} onClick={this.userSelectedDropdownValue.bind(this, value)}>
              <span
                className="dropdown-item">{renderValue(value)}</span>
            </div>
          ))
        }
      </div>
    </div>;
  }
  private userSelectedDropdownValue = (value: T) => {
    this.setState({
      // WARNING - we do not set state.currentValue here because either props.currentValueOrObserver is T and parent will re-render this comp with new T, xor currentValueOrObserver is Observer<T> and currentValue will get updated by observation callback (which is setup in this constructor).
      isActive: false,
    });
    this.props.onChange(value);
  };
  private toggleIsActive = () => {
    this.setState({isActive: !this.state.isActive});
  };
  private handleDocumentClick = (e: MouseEvent) => {
    const dropdownContainer = this.dropdownContainer && this.dropdownContainer.current;
    if (!dropdownContainer) {
      return;
    }
    const target = e.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (target === dropdownContainer || dropdownContainer.contains(target)) {
      return;
    }
    this.setState({isActive: false});
  };
}
