import { Currency } from "./Currency";
import { Price, MarketsSummary } from "./generated/markets_pb";

export type ExchangeRates = { [key in Currency]: number };

// getExchangeRatesRelativeToETH uses an existing Price to compute exchange rates because we don't yet have explicit exchange rates in our data model.
export function getExchangeRatesRelativeToETH(p: Price): ExchangeRates | undefined {
  const eth = p.getEth();
  if (eth === 0) {
    return;
  }
  return {
    [Currency.ETH]: 1,
    [Currency.BTC]: p.getBtc() / eth,
    [Currency.USD]: p.getUsd() / eth,
  };
}

// getExchangeRatesFromMarketsSummary returns ETH/USD/BTC exchange rates, so long as at least one market has open interest.
export function getExchangeRatesFromMarketsSummary(ms: MarketsSummary): ExchangeRates | undefined {
  for(const m of ms.getMarketsList()) {
    const p = m.getMarketCapitalization();
    if (p !== undefined && p.getEth() !== 0) {
      return getExchangeRatesRelativeToETH(p);
    }
  }
  return;
}

export function makePriceFromEthAmount(ex: ExchangeRates, ethAmount: number): Price {
  const p = new Price();
  p.setEth(ethAmount);
  p.setBtc(ethAmount * ex[Currency.BTC]);
  p.setUsd(ethAmount * ex[Currency.USD]);
  return p;
}
