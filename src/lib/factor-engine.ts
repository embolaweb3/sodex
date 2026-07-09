import type { FactorScores, FactorVector } from '@/types';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  category: string;
}

interface ETFItem {
  date: string;
  btcNetFlow: number;
  ethNetFlow: number;
  totalAum: number;
  btcAum: number;
  ethAum: number;
}

export interface ScoredToken extends MarketItem {
  factorScore: number;
  factorBreakdown: FactorScores;
  weight: number;
  rationale: string;
}

function normalizeArray(arr: number[]): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 50);
  return arr.map(v => ((v - min) / (max - min)) * 100);
}

function softmaxWithCap(scores: number[], cap: number, temperature = 20): number[] {
  const expScores = scores.map(s => Math.exp(s / temperature));
  const total = expScores.reduce((a, b) => a + b, 0);
  let weights = expScores.map(e => e / total);

  // Iterative renormalisation to enforce per-token concentration cap
  for (let iter = 0; iter < 20; iter++) {
    if (!weights.some(w => w > cap)) break;
    weights = weights.map(w => Math.min(w, cap));
    const s = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / s);
  }

  // Convert to percentage with 1 decimal, fix floating-point drift
  const pcts = weights.map(w => Math.round(w * 1000) / 10);
  const diff = parseFloat((100 - pcts.reduce((a, b) => a + b, 0)).toFixed(1));
  if (Math.abs(diff) >= 0.1) {
    const maxIdx = pcts.indexOf(Math.max(...pcts));
    pcts[maxIdx] = parseFloat((pcts[maxIdx] + diff).toFixed(1));
  }
  return pcts;
}

// Sector institutional-flow proxies (correlation with BTC/ETH ETF flows)
const SECTOR_FLOW_WEIGHT: Record<string, { btc: number; eth: number }> = {
  L1:             { btc: 0.70, eth: 0.30 },
  L2:             { btc: 0.10, eth: 0.75 },
  DeFi:           { btc: 0.05, eth: 0.80 },
  AI:             { btc: 0.20, eth: 0.55 },
  RWA:            { btc: 0.15, eth: 0.50 },
  Gaming:         { btc: 0.10, eth: 0.40 },
  Infrastructure: { btc: 0.20, eth: 0.65 },
  Other:          { btc: 0.15, eth: 0.45 },
};

export function computeFactorScores(
  market: MarketItem[],
  etf: ETFItem[],
  news: { categories: string[] }[],
): Map<string, FactorScores> {
  const valid = market.filter(t => t.price > 0 && t.marketCap > 0);
  if (valid.length === 0) return new Map();

  // --- FACTOR 1: Institutional Flow ---
  const last7 = etf.slice(-7);
  const btcFlow7d = last7.reduce((s, d) => s + d.btcNetFlow, 0);
  const btcAum = etf[etf.length - 1]?.btcAum || 1e10;
  const ethFlow7d = last7.reduce((s, d) => s + d.ethNetFlow, 0);
  const ethAum = etf[etf.length - 1]?.ethAum || 1e9;

  const btcRatio = btcFlow7d / btcAum;
  const ethRatio = ethFlow7d / Math.max(ethAum, 1);

  const instFlowRaw = valid.map(t => {
    if (t.symbol === 'BTC') return btcRatio;
    if (t.symbol === 'ETH') return ethRatio;
    const w = SECTOR_FLOW_WEIGHT[t.category] ?? SECTOR_FLOW_WEIGHT.Other;
    return w.btc * btcRatio + w.eth * ethRatio;
  });
  const instFlowNorm = normalizeArray(instFlowRaw);

  // --- FACTOR 2: Relative Momentum (vs sector median) ---
  const sectors = [...new Set(valid.map(t => t.category))];
  const sectorMedian: Record<string, number> = {};
  for (const sec of sectors) {
    const returns = valid.filter(t => t.category === sec).map(t => t.change7d || 0).sort((a, b) => a - b);
    sectorMedian[sec] = returns[Math.floor(returns.length / 2)] ?? 0;
  }
  const momentumRaw = valid.map(t => (t.change7d || 0) - (sectorMedian[t.category] ?? 0));
  const momentumNorm = normalizeArray(momentumRaw);

  // --- FACTOR 3: Liquidity Quality (turnover rate) ---
  const liquidityRaw = valid.map(t =>
    t.volume24h > 0 && t.marketCap > 0 ? Math.log(t.volume24h / t.marketCap) : -10
  );
  const liquidityNorm = normalizeArray(liquidityRaw);

  // --- FACTOR 4: News Sentiment Density ---
  const newsCounts: Record<string, number> = {};
  for (const item of news) {
    for (const cat of item.categories) newsCounts[cat] = (newsCounts[cat] || 0) + 1;
  }
  const sentimentRaw = valid.map(t => (newsCounts[t.symbol] || 0) / (t.marketCap / 1e9 || 1));
  const sentimentNorm = normalizeArray(sentimentRaw);

  // --- FACTOR 5: Within-Sector Size Rank (smaller = higher growth potential) ---
  const sizeRankRaw = valid.map(t => {
    const peers = valid.filter(u => u.category === t.category);
    if (peers.length <= 1) return 0.5;
    const sorted = [...peers].sort((a, b) => a.marketCap - b.marketCap); // ascending = smallest first
    const rank = sorted.findIndex(u => u.symbol === t.symbol); // 0 = smallest
    return 1 - rank / (peers.length - 1); // smallest gets 1.0
  });
  const sizeRankNorm = normalizeArray(sizeRankRaw);

  const result = new Map<string, FactorScores>();
  valid.forEach((t, i) => {
    result.set(t.symbol, {
      instFlow: parseFloat(instFlowNorm[i].toFixed(1)),
      momentum: parseFloat(momentumNorm[i].toFixed(1)),
      liquidity: parseFloat(liquidityNorm[i].toFixed(1)),
      sentiment: parseFloat(sentimentNorm[i].toFixed(1)),
      sizeRank: parseFloat(sizeRankNorm[i].toFixed(1)),
    });
  });
  return result;
}

const FACTOR_LABELS: Record<string, string> = {
  instFlow: 'institutional flow',
  momentum: 'sector momentum',
  liquidity: 'liquidity quality',
  sentiment: 'market attention',
  sizeRank: 'growth potential',
};

function buildRationale(symbol: string, category: string, f: FactorScores, fv: FactorVector): string {
  const contributions = (Object.keys(fv) as (keyof FactorVector)[])
    .map(k => ({ key: k, val: fv[k] * f[k] }))
    .sort((a, b) => b.val - a.val);
  const top1 = FACTOR_LABELS[contributions[0].key];
  const top2 = FACTOR_LABELS[contributions[1].key];
  const composite = contributions.reduce((s, c) => s + c.val, 0);
  return `Top-quintile ${top1} (${f[contributions[0].key as keyof FactorScores]}/100) and ${top2} in ${category} sector. Factor composite: ${composite.toFixed(0)}/100.`;
}

export function constructFromFactors(
  factorVector: FactorVector,
  factorScores: Map<string, FactorScores>,
  universe: MarketItem[],
  riskLevel: 'conservative' | 'balanced' | 'aggressive',
  maxN: number,
  sectorFilter: string | null,
): ScoredToken[] {
  let candidates = universe.filter(t => t.price > 0 && factorScores.has(t.symbol));

  // Apply sector filter only if it yields at least 2 candidates
  if (sectorFilter) {
    const filtered = candidates.filter(t => t.category === sectorFilter);
    if (filtered.length >= 2) candidates = filtered;
  }

  // Compute composite score per token
  const scored = candidates.map(t => {
    const f = factorScores.get(t.symbol)!;
    const composite =
      factorVector.instFlow * f.instFlow +
      factorVector.momentum * f.momentum +
      factorVector.liquidity * f.liquidity +
      factorVector.sentiment * f.sentiment +
      factorVector.sizeRank * f.sizeRank;
    return { ...t, factorScore: parseFloat(composite.toFixed(1)), factorBreakdown: f };
  }).sort((a, b) => b.factorScore - a.factorScore);

  // Select top N with soft sector diversification (no sector > 60% of slots)
  const maxPerSector = sectorFilter ? maxN : Math.max(2, Math.ceil(maxN * 0.6));
  const sectorCount: Record<string, number> = {};
  const selected: typeof scored = [];

  for (const token of scored) {
    if (selected.length >= maxN) break;
    const used = sectorCount[token.category] || 0;
    if (used >= maxPerSector && !sectorFilter) continue;
    selected.push(token);
    sectorCount[token.category] = used + 1;
  }

  // Fallback if diversification is too aggressive
  if (selected.length < 2) {
    const extra = scored.filter(t => !selected.some(s => s.symbol === t.symbol));
    selected.push(...extra.slice(0, maxN - selected.length));
  }

  if (selected.length === 0) return [];

  const cap = riskLevel === 'conservative' ? 0.30 : riskLevel === 'balanced' ? 0.35 : 0.40;
  const weights = softmaxWithCap(selected.map(t => t.factorScore), cap);

  return selected.map((t, i) => ({
    ...t,
    weight: weights[i],
    rationale: buildRationale(t.symbol, t.category, t.factorBreakdown, factorVector),
  }));
}
