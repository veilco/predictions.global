import * as React from 'react';
import {Market, MarketsSummary} from "./generated/markets_pb";
import OneMarketSummary from "./OneMarketSummary";
import * as moment from "moment";
import {makeObserverOwner, ObserverOwner} from "./observer";
import {Currency} from "./Currency";

interface EmbeddedMarketCardProps {
  marketsSummary: MarketsSummary,
  match: any,
}

interface EmbeddedMarketCardState {
  currencyObserverOwner: ObserverOwner<Currency>,
}

export class EmbeddedMarketCard extends React.Component<EmbeddedMarketCardProps, EmbeddedMarketCardState> {
  constructor(props: EmbeddedMarketCardProps) {
    super(props);

    this.state = {
      currencyObserverOwner: makeObserverOwner(Currency.USD),
    };
  }

  public render() {
    const {currencyObserverOwner} = this.state;
    const {marketsSummary, match} = this.props;
    const marketsList = marketsSummary.getMarketsList();
    const marketID = match.params.id;
    const market = marketsList.find((m: Market) => m.getId() === marketID);
    if(market == null) {
      return (
        <div>
          No markets found.
        </div>
      );
    }

    return (
      <div>
        <OneMarketSummary
          m={market}
          now={moment()}
          index={0}
          currencySelectionObserver={currencyObserverOwner.o}
        />
      </div>
    );
  }
}