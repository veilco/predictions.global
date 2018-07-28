import BigNumber from 'bignumber.js';

export enum Currency {
  ETH = "ETH Ξ",
  USD = "USD $",
  BTC = "BTC Ƀ",
}

const currencySet: Set<any> = new Set(Object.keys(Currency).map(k => Currency[k]));

const defaultCurrency = Currency.USD;

export function renderCurrency(c: Currency): string {
  return c;
}

export function getSavedCurrencyPreference(): Currency {
  const localStorageCurrency = localStorage.getItem('currency');
  return currencySet.has(localStorageCurrency) ? localStorageCurrency as Currency : defaultCurrency;
}

export function saveCurrencyPreference(c: Currency) {
  localStorage.setItem('currency', c);
}

export function ethToGwei(eth: BigNumber) {
  return eth.shiftedBy(9);
}

export function gweiToEth(gwei: BigNumber) {
  return gwei.shiftedBy(-9);
}