import * as React from 'react';
import { Currency, renderCurrency } from '../Currency';
import {Dropdown} from "../Components/Dropdown";
import {Observer} from "../Components/observer";

interface Props {
  onChange: (t: any) => any,
  currencySelectionObserver: Observer<Currency>,
}

export const CurrencyDropdown: React.SFC<Props> = ({ onChange, currencySelectionObserver }: Props) => (
  <Dropdown
    currentValueOrObserver={currencySelectionObserver}
    onChange={onChange}
    renderValue={renderCurrency}
    values={[Currency.USD, Currency.ETH, Currency.BTC]} />
);