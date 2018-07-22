import * as classNames from "classnames";
import * as React from 'react';
import './Dropdown.css';
import { isObserver, Observer, Unsubscribe } from './observer';

interface Props<T> {
  buttonClassNameSuffix?: string,
  initialValueOrObserver: T | Observer<T>, // if T, state.currentValue will be this initial value, and thereafter currentValue is updated when user changes the dropdown; if Observer<T>, currentValue is initialized and updated from Observer callback.
  onChange: (t: T) => void, // onChange() is called when user selects a value from this dropdown; if initialValueOrObserver is an Observer, then onChange() (within parent) must feed back into the Observer so that state.currentValue is updated by observation callback.
  renderValue?: (t: T) => React.ReactNode, // Render values with custom logic
  values: T[],
}

interface State<T> {
  currentValue: T, // current selected value in this Dropdown
  isActive: boolean, // true iff this dropdown is open/expanded
  unsubscribe?: Unsubscribe, // Observer unsubscribe if props.initialValueOrObserver is an Observer
  renderValue: (t: T) => React.ReactNode, // used to render each value; can be passed with props.renderValue or defaults to value.toString()
}

// WARNING - Dropdown doesn't support modifying `props.initialValueOrObserver` after initial construction. If we wanted to support this, we'll have to handle replacing/removing props.Observer<T>.
export class Dropdown<T> extends React.Component<Props<T>, State<T>> {
  private dropdownContainer: React.RefObject<HTMLDivElement>;
  public constructor(props: Props<T>) {
    super(props);
    this.dropdownContainer = React.createRef();
    const renderValue: (t: T) => React.ReactNode = this.props.renderValue !== undefined ? this.props.renderValue : (t: T) => t.toString();
    if (isObserver(props.initialValueOrObserver)) {
      const sub = props.initialValueOrObserver.subscribe((newValue: T) => this.setState({ currentValue: newValue }));
      this.state = {
        currentValue: sub.initialValue,
        isActive: false,
        renderValue,
        unsubscribe: sub.unsubscribe,
      };
    } else {
      this.state = {
        currentValue: props.initialValueOrObserver,
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
    // If props.initialValueOrObserver is an Observer<T>, then currentValue will be updated by the observer's callback (as setup in this constructor). Otherwise, props.initialValueOrObserver is a T and we'll set currentValue internally. (Ie. if initialValueOrObserver is a T, there is no support to set state.currentValue from outside this component.)
    if (isObserver(this.props.initialValueOrObserver)) {
      this.setState({
        isActive: false,
      });
    } else {
      this.setState({
        currentValue: value, // ie. set currentValue only when initialValueOrObserver is not an Observer<T>
        isActive: false,
      });
    }
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
