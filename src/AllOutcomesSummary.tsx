import * as React from 'react';
import { ExchangeRates, makePriceFromEthAmount } from './ExchangeRates';
import { Market, MarketInfo, OutcomeInfo } from './generated/markets_pb';
import { renderPrediction } from './OneMarketSummary';
import Price2, { numberFormat, smartRoundThreeDecimals } from "./Price";
import { Observer } from './Components/observer';
import { Currency } from './Currency';
import './AllOutcomesSummary.css';

interface Props {
  currencyObserver: Observer<Currency>;
  exchangeRates: ExchangeRates;
  m: Market;
  mi: MarketInfo;
}

export default class AllOutcomesSummary extends React.Component<Props> {
  public render() {
    const { m, mi } = this.props;
    const bestBidsMap = m.getBestBidsMap();
    const bestAsksMap = m.getBestAsksMap();
    const outcomesById: { [key: number]: OutcomeInfo } = {};
    mi.getOutcomesList().forEach(o => outcomesById[o.getId()] = o);
    const ps = m.getPredictionsList().slice().sort((p1, p2) => p1.getOutcomeId() - p2.getOutcomeId()); // traders prefer to see outcomes sorted statically by outcome ID. slice() clones the array because sort() occurs in place.
    return <div className="all-outcomes-summary box content">
      <div>
        <h5 className="title is-5">Outcomes</h5>
      </div>
      {ps.length < 1 && "Outcomes will show once there is volume or liquidity."}
      {ps.map((p, index) => {
        const outcomeId = p.getOutcomeId();
        const bestBid = bestBidsMap.get(outcomeId);
        const bestAsk = bestAsksMap.get(outcomeId);
        const oi: OutcomeInfo | undefined = outcomesById[outcomeId];
        const volume: number | undefined = oi && parseVolume(oi);
        const last: number | undefined = oi && parseLast(oi);
        return <div key={index} className="columns is-mobile has-text-centered is-centered is-multiline">
          <div className="prediction column is-7-mobile is-2-desktop">
            {/* TODO renderPrediction() is tightly coupled to use-case of rendering only top prediction, needs refactoring to render an arbitrary predction. The text surrounding the prediction should be customizable, too, eg. 'No redictions' or 'Augur predicts:'. Perhaps this could be two separate functions, one to produce an opininated prediction for use in OneMarketSummary, and another lower level function to just produce the core "56% Yes | 250 Billions of USD" */}
            <strong>Prediction:</strong><br />
            {renderPrediction(m.getMarketType(), [p], {includePrefixInNode: false}).node}
          </div>
          <div className="volume column is-5-mobile is-2-desktop">
            <strong>Volume:</strong><br />
            {volume && volume !== 0 ?
              <Price2 p={makePriceFromEthAmount(this.props.exchangeRates, volume)} o={this.props.currencyObserver}/> : '-'}
          </div>
          <div className="column no-padding-right">
            <strong>Qty:</strong><br /> {/* best bid quantity */}
            {bestBid && bestBid.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestBid.getAmount())) : '-'}
          </div>
          <div className="column no-padding-right">
            <strong>Bid:</strong><br />
            {bestBid && bestBid.getPrice() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestBid.getPrice())) : '-'}
          </div>
          <div className="column no-padding-right">
            <strong>Ask:</strong><br />
            {bestAsk && bestAsk.getPrice() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestAsk.getPrice())) : '-'}
          </div>
          <div className="column no-padding-right">
            <strong>Qty:</strong><br /> {/* best ask quantity */}
            {bestAsk && bestAsk.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestAsk.getAmount())) : '-'}
          </div>
          <div className="column">
            <strong>Last:</strong><br />
            {last && last !== 0 ? numberFormat.format(smartRoundThreeDecimals(last)) : '-'}
          </div>
        </div>;
      })
    }</div>;
  }
}

function parseLast(oi: OutcomeInfo): number | undefined {
  const last = parseFloat(oi.getPrice()); // an outcome price is defined as its last trade price in augur-node
  if (isNaN(last)) {
    return;
  }
  return last;
}

function parseVolume(oi: OutcomeInfo): number | undefined {
  const volume = parseFloat(oi.getVolume());
  if (isNaN(volume)) {
    return;
  }
  return volume;
}
