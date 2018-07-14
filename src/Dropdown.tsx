import * as React from 'react';
import * as classNames from "classnames";
import './Dropdown.css';

interface DropdownProps<T> {
  renderValue?: (t: T) => React.ReactNode, // Render values with custom logic
  onChange: (t: T) => void,
  defaultValue?: T,
  values: T[],
  buttonClassNameSuffix?: string,
}

interface DropdownState<T> {
  isActive: boolean,
  currentValue: T, // TODO drop hack dependency on Observer
  defaultValue: T,
}

interface DropdownDerivedStateProps {
  defaultValue?: any,
}

interface DropdownDerivedStateState {
  currentValue: any,
  defaultValue: any,
}

export class Dropdown<T> extends React.Component<DropdownProps<T>, DropdownState<T>> {
  public static getDerivedStateFromProps(props: DropdownDerivedStateProps, state: DropdownDerivedStateState) {
    // Set the dropdown value to the defaultValue prop if it changes
    if(props.defaultValue != null && props.defaultValue !== state.defaultValue) {
      return {
        currentValue: props.defaultValue,
        defaultValue: props.defaultValue,
      };
    }

    return null;
  }

  private dropdownContainer: React.RefObject<HTMLDivElement>;

  public constructor(props: DropdownProps<T>) {
    super(props);

    const currentValue = props.defaultValue == null ? props.values[0] : props.defaultValue;

    this.dropdownContainer = React.createRef();
    this.state = {
      currentValue,
      defaultValue: currentValue,
      isActive: false,
    };
  }

  public componentDidMount(): void {
    document.addEventListener('click', this.handleDocumentClick.bind(this), false);
  }

  public componentWillUnmount(): void {
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  public render() {
    const {values} = this.props;
    const {isActive, currentValue} = this.state;

    return <div className={classNames('dropdown', isActive && 'is-active')} ref={this.dropdownContainer}>
      <div className="dropdown-trigger" onClick={this.toggleIsActive}>
        <button className={classNames('button', this.props.buttonClassNameSuffix)} aria-haspopup="true"
                aria-controls="dropdown-menu">
          <span>{this.props.renderValue == null ? currentValue.toString() : this.props.renderValue(currentValue)}</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down" aria-hidden="true"/>
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        {values
          .filter(value => value !== currentValue)
          .map(value => (
            <div className="dropdown-content" key={value.toString()} onClick={this.setValue.bind(this, value)}>
              <span
                className="dropdown-item">{this.props.renderValue == null ? value.toString() : this.props.renderValue(value)}</span>
            </div>
          ))
        }
      </div>
    </div>;
  }

  private setValue = (value: T) => {
    this.setState({
      currentValue: value,
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
