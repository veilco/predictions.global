import * as React from 'react';
import { Currency } from "./Currency";
import { Price } from './generated/markets_pb';
import { Observer, Unsubscribe } from './Components/observer';

export const numberFormat = new Intl.NumberFormat('en-US');

export const usdFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const cryptocurrencyFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 8 });

// This "smart" rounding function attempts to show useful precision based on magnitude of passed number.
export function smartRound(n: number): number {
  if (n >= 1000) {
    return Math.round(n);
  }
  return Math.round(n * 100) / 100; // ghetto way to round to 2 decimals because toFixed(2) returns a string
}

// TODO better/consolidated number rendering library
export function smartRoundThreeDecimals(n: number): number {
  if (n >= 1000) {
    return Math.round(n);
  }
  return Math.round(n * 1000) / 1000; // ghetto way to round to 3 decimals because toFixed(2) returns a string
}

interface PriceProps {
  p: Price | undefined,
  o: Observer<Currency>, // observe changes in user's selected Currency.
}

interface PriceState {
  u: Unsubscribe | undefined,
  c: Currency, // current Currency; the denomination in which to render price
}

// We just call this Price2 because there's Price from protobuf data structures.
class Price2 extends React.Component<PriceProps, PriceState> {
  public constructor(props: PriceProps) {
    super(props);
    const sub = this.props.o.subscribe(this.setCurrency);
    this.state = {
      c: sub.initialValue,
      u: sub.unsubscribe,
    };
  }
  public componentWillUnmount() {
    if (this.state.u !== undefined) {
      this.state.u();
    }
  }
  public setCurrency = (c: Currency) => this.setState({ c })
  public render() {
    return renderPrice(this.state.c, this.props.p);
  }
}

function renderPrice(c: Currency, p: Price | undefined): React.ReactNode {
  if (p === undefined) {
    return '?';
  }
  switch (c) {
    case Currency.ETH:
      return <span>
        {cryptocurrencyFormat.format(smartRound(p.getEth()))}Ξ
      </span>;
    case Currency.USD:
      return <span>
        {usdFormat.format(p.getUsd())}
      </span>;
    case Currency.BTC:
      return <span>
        {cryptocurrencyFormat.format(smartRound(p.getBtc()))}Ƀ
      </span>;
  }
}

export default Price2;
