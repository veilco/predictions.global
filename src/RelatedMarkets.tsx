import * as React from 'react';
import * as moment from 'moment';
import { Market, MarketsSummary } from "./generated/markets_pb";
import { HasMarketsSummary } from "./Header";
import OneMarketSummary from './OneMarketSummary';
import { Observer } from './observer';
import { Currency } from './Currency';

export interface RelatedMarketsIndex {
  marketsByAuthor: { [key: string]: Market[] };
  marketsByCategory: { [key: string]: Market[] };
  marketsByTag: { [key: string]: Market[] };
}

export interface MarketsRelatedToOneMarket {
  byAuthor: Market[],
  byCategory: Market[],
  byCategoryAndAtLeastOneTag: Market[],
}

export function indexRelatedMarkets(ms: MarketsSummary): RelatedMarketsIndex {
  const index: RelatedMarketsIndex = {
    marketsByAuthor: {},
    marketsByCategory: {},
    marketsByTag: {},
  };
  ms.getMarketsList().forEach(m => {
    const a = m.getAuthor();
    if (index.marketsByAuthor[a] === undefined) {
      index.marketsByAuthor[a] = [];
    }
    index.marketsByAuthor[a].push(m);
    const c = m.getCategory();
    if (index.marketsByCategory[c] === undefined) {
      index.marketsByCategory[c] = [];
    }
    index.marketsByCategory[c].push(m);
    m.getTagsList().forEach(t => {
      if (index.marketsByTag[t] === undefined) {
        index.marketsByTag[t] = [];
      }
      index.marketsByTag[t].push(m);
    });
  });
  return index;
}

// WARNING getRelatedMarkets may include the passed market in collection and it should be filtered out during rendering
export function getRelatedMarkets(rmi: RelatedMarketsIndex, m: Market): MarketsRelatedToOneMarket {
  const category = m.getCategory();
  const id = m.getId();
  const byCatAndTag = new Set<Market>();
  m.getTagsList().forEach(tag => {
    rmi.marketsByTag[tag].forEach(m2 => {
      if (m2.getId() !== id && m2.getCategory() === category) {
        byCatAndTag.add(m2);
      }
    });
  });
  return {
    byAuthor: rmi.marketsByAuthor[m.getAuthor()].filter(m2 => m2.getId() !== id),
    byCategory: rmi.marketsByCategory[m.getCategory()].filter(m2 => m2.getId() !== id),
    byCategoryAndAtLeastOneTag: Array.from(byCatAndTag),
  };
}

interface Props {
  relatedMarkets: MarketsRelatedToOneMarket
  now: moment.Moment,
  currencyObserver: Observer<Currency>,
}

export class RelatedMarkets extends React.Component<Props> {
  public render() {
    const r = this.props.relatedMarkets;
    const now = this.props.now;
    const o = this.props.currencyObserver;
    return <div>
      {r.byCategoryAndAtLeastOneTag.length > 0 && <div style={{ paddingBottom: "2rem" }}>
        <div className="content">
          <h5 className="title is-5">Related Markets</h5>
        </div>
        {r.byCategoryAndAtLeastOneTag.slice(0, 10).map((m, index) =>
          <OneMarketSummary
            key={index}
            index={index}
            now={now}
            currencySelectionObserver={o}
            m={m}
          />
        )}
      </div>}
      {r.byCategoryAndAtLeastOneTag.length < 1 && r.byCategory.length > 0 && <div style={{ paddingBottom: "2rem" }}>
        <div className="content">
          <h5 className="title is-5">Related Markets</h5>
        </div>
        {r.byCategory.slice(0, 3).map((m, index) =>
          <OneMarketSummary
            key={index}
            index={index}
            now={now}
            currencySelectionObserver={o}
            m={m}
          />
        )}
      </div>}
      {r.byAuthor.length > 0 && <div>
        <div className="content">
          <h5 className="title is-5">Other Markets By This Author</h5>
        </div>
        {r.byAuthor.map((m, index) =>
          <OneMarketSummary
            key={index}
            index={index}
            now={now}
            currencySelectionObserver={o}
            m={m}
          />
        )}
      </div>}
    </div>;
  }
}
