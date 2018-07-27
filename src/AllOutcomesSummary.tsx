import * as React from 'react';
import Price2, { numberFormat, smartRoundThreeDecimals, usdFormat } from "./Price";
import { Market, MarketInfo, OutcomeInfo } from './generated/markets_pb';
import { renderPrediction } from './OneMarketSummary';

interface Props {
  m: Market;
  mi: MarketInfo;
}

export default class AllOutcomesSummary extends React.Component<Props> {
  public render() {
    const { m, mi } = this.props;
    const bestBidsMap = m.getBestBidsMap();
    const bestAsksMap = m.getBestAsksMap();
    const outcomesById: {[key: number]: OutcomeInfo} = {};
    mi.getOutcomesList().forEach(o => outcomesById[o.getId()] = o);
    return <div>{
      m.getPredictionsList().map((p, index) => {
        const outcomeId = p.getOutcomeId();
        const bestBid = bestBidsMap.get(outcomeId);
        const bestAsk = bestAsksMap.get(outcomeId);
        const oi: OutcomeInfo | undefined = outcomesById[outcomeId];
        const volume: number | undefined = oi && parseVolume(oi);
        const last: number | undefined = oi && parseLast(oi);
        return <div key={index} className="columns is-mobile has-text-centered is-centered">
          {/* name predicted%  bidqty bid ask askqty last volume */}
          {/* <div className="column">
            <strong>Outcome:</strong><br />
            {p.getName()}
          </div> */}
          <div className="column">
            {/* TODO renderPrediction() is tightly coupled to use-case of rendering only top prediction, needs refactoring to render an arbitrary predction. The text surrounding the prediction should be customizable, too, eg. 'No redictions' or 'Augur predicts:'. Perhaps this could be two separate functions, one to produce an opininated prediction for use in OneMarketSummary, and another lower level function to just produce the core "56% Yes | 250 Billions of USD" */}
            <strong>Prediction:</strong><br />
            {renderPrediction(m.getMarketType(), [p], {includePrefixInNode: false}).node}
          </div>
          <div className="column">
            <strong>Qty:</strong><br /> {/* best bid quantity */}
            {bestBid && bestBid.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestBid.getAmount())) : '-'}
          </div>
          <div className="column">
            <strong>Bid:</strong><br />
            {bestBid && bestBid.getPrice() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestBid.getPrice())) : '-'}
          </div>
          <div className="column">
            <strong>Ask:</strong><br />
            {bestAsk && bestAsk.getPrice() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestAsk.getPrice())) : '-'}
          </div>
          <div className="column">
            <strong>Qty:</strong><br /> {/* best ask quantity */}
            {bestAsk && bestAsk.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(bestAsk.getAmount())) : '-'}
          </div>
          <div className="column">
            <strong>Last:</strong><br />
            {last && last !== 0 ? numberFormat.format(smartRoundThreeDecimals(last)) : '-'}
          </div>
          <div className="column">
            <strong>Volume: TODO price</strong><br />
            {volume && volume !== 0 ? numberFormat.format(smartRoundThreeDecimals(volume)) : '-'}
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

// interface BidAskQtyDatumProps {
//
// }
//
// const BidAskQtyDatum: React.SFC<BidAskQtyDatumProps> = (props) => {
//   <strong>Qty:</strong><br /> {/* best bid quantity */}
//   {topOutcomeBestBid && topOutcomeBestBid.getAmount() !== 0 ? numberFormat.format(smartRoundThreeDecimals(topOutcomeBestBid.getAmount())) : '-'}
// }
//
// export BidAskQtyDatum;
