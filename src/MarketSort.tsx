import { Market, MarketsSummary } from "./generated/markets_pb";
import { getQueryString, updateQueryString } from "./url";

export enum MarketSortOrder {
  LIQUIDITY = 'Liquidity',
  RECENTLY_TRADED = 'Recently Traded',
  VOLUME = 'Volume',
  OPEN_INTEREST = 'Money at Stake',
  NEW_MARKETS = 'New Markets',
  ENDING_SOON = 'Ending Soon',
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

export function getSavedLiquidityTranchePreference(): number | undefined {
  const liquidityTrancheQuery = parseInt(getQueryString('l'), 10);
  return isNaN(liquidityTrancheQuery) ? undefined : liquidityTrancheQuery;
}

export function saveLiquidityTranchePreference(liquidityTranche: number | undefined) {
  updateQueryString('l', liquidityTranche);
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

export type MarketSortFunctions = Map<MarketSortOrder | MarketSortOrderLiquidityKey, (a: Market, b: Market) => number>;

export function makeMarketSortFunctions(ms: MarketsSummary): MarketSortFunctions {
  const fns = new Map<MarketSortOrder | MarketSortOrderLiquidityKey, (a: Market, b: Market) => number>([
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
    [MarketSortOrder.OPEN_INTEREST, composeSortFunctions(sortIsFeaturedGoesFirst, sortByOpenInterestDescending)],
    [MarketSortOrder.NEW_MARKETS, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
      return b.getCreationTime() - a.getCreationTime();
    })],
    [MarketSortOrder.ENDING_SOON, composeSortFunctions(sortIsFeaturedGoesFirst, (a: Market, b: Market) => {
      return a.getEndDate() - b.getEndDate();
    })],
  ]);

  // Liquidity sort functions are dynamically generated; one sort function per millietherTranche passed from back end.
  const lmc = ms.getLiquidityMetricsConfig();
  if (lmc !== undefined) {
    lmc.getMillietherTranchesList().forEach(millietherTranche => fns.set(makeLiquiditySortKey(millietherTranche), sortLiquidityForTranche.bind(null, millietherTranche)));
  }
  return fns;
}

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

// Liquidy sort functions are dynamically generated, one per liquidity tranche sent from backend; MarketSortOrderLiquidityKey is the map key for liquidity sort functions into the map MarketSortFunctions.
type MarketSortOrderLiquidityKey = string;

export function makeLiquiditySortKey(liquidityTranche: number): MarketSortOrderLiquidityKey {
  return `${MarketSortOrder.LIQUIDITY}-${liquidityTranche}`;
}

export function sortByOpenInterestDescending(a: Market, b: Market): number {
  const aCapitalization = a.getMarketCapitalization();
  const bCapitalization = b.getMarketCapitalization();
  if (aCapitalization === undefined) {
    return -1;
  }
  if (bCapitalization === undefined) {
    return 1;
  }
  return bCapitalization.getUsd() - aCapitalization.getUsd();
}

function sortLiquidityForTranche(millietherTranche: number, a: Market, b: Market): number {
  const aR = getLiquidityRetentionRatioForTranche(millietherTranche, a);
  if (aR === undefined) {
    return 1; // if tranche is undefined for a market, then that market should go at end of list
  }
  const bR = getLiquidityRetentionRatioForTranche(millietherTranche, b);
  if (bR === undefined) {
    return -1;
  }
  return bR - aR;
}

export function getLiquidityRetentionRatioForTranche(tranche: number, m: Market): number | undefined {
  const lm = m.getLiquidityMetrics();
  if (lm === undefined) {
    return;
  }
  return lm.getRetentionRatioByMillietherTrancheMap().get(tranche);
}
