import { Market } from "./generated/markets_pb";
import { getQueryString, updateQueryString } from "./url";

export enum MarketSortOrder {
  RECENTLY_TRADED = 'Recently Traded',
  VOLUME = 'Volume',
  OPEN_INTEREST = 'Money at Stake',
  NEW_MARKETS = 'New Markets',
  ENDING_SOON = 'Ending Soon',
  // TODO LIQUIDITY = 'Liquidity',
}

export const defaultMarketSortOrder = MarketSortOrder.RECENTLY_TRADED;

export const marketSortOrders: MarketSortOrder[] = Object.keys(MarketSortOrder).map(key => MarketSortOrder[key]);

export const marketSortOrderSet: Set<MarketSortOrder> = new Set(Object.keys(MarketSortOrder).map(key => MarketSortOrder[key]));

export function getSavedMarketSortOrderPreference(): MarketSortOrder {
  return parseMarketSortOrder(getQueryString('s')) || defaultMarketSortOrder;
}

export function saveMarketSortOrderPreference(mso: MarketSortOrder) {
  updateQueryString('s', mso);
}

export function renderMarketSortOrder(mso: MarketSortOrder): string {
  return mso;
}

export function parseMarketSortOrder(rawMarketSortOrder: string): MarketSortOrder | undefined {
  if (marketSortOrderSet.has(rawMarketSortOrder as MarketSortOrder)) {
    return rawMarketSortOrder as MarketSortOrder;
  }
  return;
}

// TODO move these inline sort functions to their own static functions

export const marketSortFunctions: Map<MarketSortOrder, (a: Market, b: Market) => number> = new Map<MarketSortOrder, (a: Market, b: Market) => number>([
  [MarketSortOrder.RECENTLY_TRADED, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
    return b.getLastTradeTime() - a.getLastTradeTime();
  })],
  [MarketSortOrder.VOLUME, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
    const aVolume = a.getVolume();
    const bVolume = b.getVolume();
    if (aVolume === undefined) {
      return -1;
    }
    if (bVolume === undefined) {
      return 1;
    }
    return bVolume.getUsd() - aVolume.getUsd();
  })],
  [MarketSortOrder.OPEN_INTEREST, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
    const aCapitalization = a.getMarketCapitalization();
    const bCapitalization = b.getMarketCapitalization();
    if (aCapitalization === undefined) {
      return -1;
    }
    if (bCapitalization === undefined) {
      return 1;
    }
    return bCapitalization.getUsd() - aCapitalization.getUsd();
  })],
  [MarketSortOrder.NEW_MARKETS, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
    return b.getCreationTime() - a.getCreationTime();
  })],
  [MarketSortOrder.ENDING_SOON, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
    return a.getEndDate() - b.getEndDate();
  })],
]);

// Compose functions sortA and sortB, such that the elements are sorted by sortB if they are equal for sortA.
function composeSortFunctions<T>(sortA: (a: T, b: T) => number, sortB: (a: T, b: T) => number): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const sortAValue = sortA(a, b);
    if (sortAValue !== 0) {
      return sortAValue;
    }
    return sortB(a, b);
  };
}

function sortIsFeaturedGoesFirst(a: Market, b: Market): number {
  const af = a.getIsFeatured();
  const bf = b.getIsFeatured();
  if (af && !bf) {
    return -1;
  }
  if (bf && !af) {
    return 1;
  }
  return 0;
}




function getRetentionRatioForTranche(millietherTranche: number, m: Market): number | undefined {
  const lm = m.getLiquidityMetrics()
  if (lm === undefined) {
    return;
  }
  const rByT = lm.getRetentionRatioByMillietherTrancheMap();
  return rByT.get(millietherTranche);
}


const tt = (millietherTranche: number, a: Market, b: Market) => {
  const maybeFeatured = sortIsFeaturedGoesFirst(a, b);
  if (maybeFeatured !== 0) {
    return maybeFeatured;
  }
  const aR = getRetentionRatioForTranche(millietherTranche, a);
  if (aR === undefined) {
    return -1;
  }
  const bR = getRetentionRatioForTranche(millietherTranche, b);
  if (bR === undefined) {
    return 1;
  }
  return bR - aR;
};
