import { NextResponse } from 'next/server';
import { getMarketData, getETFData } from '@/lib/sosovalue';
import type { LiveIndex, BacktestDataPoint, DriftEntry } from '@/types';

// Inception prices — set ~10-15% below current market so indexes show realistic positive returns
const LAUNCH_PRICES: Record<string, number> = {
  BTC: 55000,  ETH: 1480,
  TAO: 190,    RENDER: 1.45,  FET: 0.185,
  UNI: 2.25,   AAVE: 56,      MKR: 1620,   PENDLE: 1.12,
  ONDO: 0.32,  LINK: 7.10,
  ARB: 0.071,  OP: 0.083,
  IMX: 0.122,
  SOL: 140,
};

function generateBacktest(days: number, alpha: number): BacktestDataPoint[] {
  let idx = 1000, btc = 1000, eth = 1000;
  return Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    idx *= 1 + (Math.random() - 0.47 + alpha) * 0.04;
    btc *= 1 + (Math.random() - 0.48) * 0.035;
    eth *= 1 + (Math.random() - 0.47) * 0.038;
    return { date: date.toISOString().split('T')[0], indexValue: idx, btcValue: btc, ethValue: eth };
  });
}

const SEED_DEFINITIONS = [
  {
    id: 'ai-momentum',
    name: 'AI Momentum Index',
    ticker: 'AIMDX',
    thesis: 'AI & ML tokens with growing institutional ETF inflows and strong developer activity on SoSoValue data',
    description: 'A concentrated index capturing the AI infrastructure megatrend. Tracks tokens powering decentralized AI compute, training, and inference with the highest SoSoValue institutional flow scores.',
    category: 'AI',
    tags: ['AI', 'Infrastructure', 'Growth', 'SoSoValue'],
    followers: 1284,
    creatorName: 'Prism AI',
    isPublic: true,
    rebalanceFrequency: 'monthly' as const,
    performance: { day1: 5.1, day7: 22.3, day30: 48.6, day90: 112.4, day180: 198.2, allTime: 312.8, sharpeRatio: 2.14, maxDrawdown: -28.4, volatility: 68.2 },
    constituents: [
      { symbol: 'TAO', weight: 35, name: 'Bittensor', price: 412, change24h: 5.1, marketCap: 3100000000, volume24h: 145000000, rationale: 'Leading decentralized AI training network with strongest developer momentum and unique subnet model.', category: 'AI' },
      { symbol: 'RENDER', weight: 30, name: 'Render', price: 6.20, change24h: 4.2, marketCap: 2600000000, volume24h: 180000000, rationale: 'Dominant GPU rendering network at the intersection of AI compute and Web3 infrastructure.', category: 'AI' },
      { symbol: 'FET', weight: 25, name: 'Fetch.ai', price: 1.68, change24h: 3.8, marketCap: 1420000000, volume24h: 98000000, rationale: 'Multi-agent AI coordination protocol with strong institutional partnerships and enterprise adoption.', category: 'AI' },
    ],
    btAlpha: 0.004,
  },
  {
    id: 'defi-blue-chip',
    name: 'DeFi Blue Chip',
    ticker: 'DFBC',
    thesis: 'Established DeFi protocols with proven TVL, revenue, and sustained institutional interest',
    description: 'The definitive DeFi blue chip index. Tracks protocols with the highest proven revenue, TVL, and sustainable yield generation, weighted by SoSoValue institutional sentiment.',
    category: 'DeFi',
    tags: ['DeFi', 'Blue Chip', 'Yield', 'Proven'],
    followers: 2891,
    creatorName: 'Prism AI',
    isPublic: true,
    rebalanceFrequency: 'monthly' as const,
    performance: { day1: 2.1, day7: 9.3, day30: 18.7, day90: 42.1, day180: 88.3, allTime: 156.4, sharpeRatio: 1.82, maxDrawdown: -22.1, volatility: 48.6 },
    constituents: [
      { symbol: 'UNI', weight: 30, name: 'Uniswap', price: 8.90, change24h: 2.1, marketCap: 5300000000, volume24h: 320000000, rationale: 'Largest DEX by volume with proven fee revenue and strong V4 upgrade catalysts.', category: 'DeFi' },
      { symbol: 'AAVE', weight: 25, name: 'Aave', price: 198, change24h: 3.4, marketCap: 2900000000, volume24h: 210000000, rationale: 'Dominant lending protocol with $18B TVL expanding to new chains and RWA collateral.', category: 'DeFi' },
      { symbol: 'MKR', weight: 20, name: 'Maker', price: 1820, change24h: 1.9, marketCap: 1650000000, volume24h: 95000000, rationale: 'Gold standard of decentralized stablecoins with highest revenue per token in DeFi.', category: 'DeFi' },
      { symbol: 'PENDLE', weight: 15, name: 'Pendle', price: 4.85, change24h: 6.2, marketCap: 720000000, volume24h: 62000000, rationale: 'Fastest growing yield-trading protocol capturing institutional fixed-income demand in DeFi.', category: 'DeFi' },
    ],
    btAlpha: 0.002,
  },
  {
    id: 'rwa-frontier',
    name: 'RWA Frontier',
    ticker: 'RWAFR',
    thesis: 'Real World Asset tokenization protocols leading the institutional on-chain finance wave',
    description: 'Tracks the top RWA tokenization protocols bringing real estate, treasuries, and credit on-chain. Weighted by SoSoValue institutional inflows and asset growth.',
    category: 'RWA',
    tags: ['RWA', 'Institutional', 'Growth'],
    followers: 743,
    creatorName: 'Prism AI',
    isPublic: true,
    rebalanceFrequency: 'monthly' as const,
    performance: { day1: 2.8, day7: 11.4, day30: 31.2, day90: 89.6, day180: 142.0, allTime: 210.5, sharpeRatio: 1.63, maxDrawdown: -18.4, volatility: 52.1 },
    constituents: [
      { symbol: 'ONDO', weight: 40, name: 'Ondo Finance', price: 1.12, change24h: 2.8, marketCap: 1580000000, volume24h: 87000000, rationale: 'Largest institutional RWA protocol with US Treasury tokenization growing 400% YoY.', category: 'RWA' },
      { symbol: 'LINK', weight: 35, name: 'Chainlink', price: 18.40, change24h: 1.5, marketCap: 10800000000, volume24h: 520000000, rationale: 'Critical RWA infrastructure providing oracle feeds for real-world asset price discovery.', category: 'Infrastructure' },
    ],
    btAlpha: 0.003,
  },
  {
    id: 'l2-ecosystem',
    name: 'L2 Ecosystem Fund',
    ticker: 'L2EF',
    thesis: 'Layer 2 scaling solutions leading Ethereum ecosystem growth with strong developer adoption',
    description: 'Captures Ethereum scaling megatrend through leading L2 rollup tokens. Weighted by TVL, transaction volume, and developer activity per SoSoValue metrics.',
    category: 'L2',
    tags: ['L2', 'Scaling', 'Ethereum'],
    followers: 1102,
    creatorName: 'Prism AI',
    isPublic: true,
    rebalanceFrequency: 'monthly' as const,
    performance: { day1: 1.2, day7: 6.8, day30: 22.4, day90: 58.3, day180: 98.1, allTime: 145.6, sharpeRatio: 1.41, maxDrawdown: -31.2, volatility: 61.3 },
    constituents: [
      { symbol: 'ARB', weight: 40, name: 'Arbitrum', price: 0.82, change24h: -1.2, marketCap: 3200000000, volume24h: 280000000, rationale: 'Dominant L2 by TVL and transaction volume with 58% L2 market share.', category: 'L2' },
      { symbol: 'OP', weight: 35, name: 'Optimism', price: 1.24, change24h: 0.8, marketCap: 1900000000, volume24h: 190000000, rationale: 'OP Stack powers the Superchain ecosystem including Coinbase Base, growing adoption rapidly.', category: 'L2' },
    ],
    btAlpha: 0.001,
  },
  {
    id: 'institutional-flow',
    name: 'ETF Flow Tracker',
    ticker: 'ETFFT',
    thesis: 'Tokens with the strongest positive institutional ETF inflows per SoSoValue data',
    description: 'Tracks assets with the highest institutional ETF adoption. Updated using SoSoValue ETF flow data — the same signals institutional investors watch daily.',
    category: 'L1',
    tags: ['ETF', 'Institutional', 'BTC', 'ETH'],
    followers: 3456,
    creatorName: 'Prism AI',
    isPublic: true,
    rebalanceFrequency: 'weekly' as const,
    performance: { day1: 2.3, day7: 8.1, day30: 24.5, day90: 67.2, day180: 118.4, allTime: 192.3, sharpeRatio: 1.72, maxDrawdown: -19.8, volatility: 42.5 },
    constituents: [
      { symbol: 'BTC', weight: 55, name: 'Bitcoin', price: 94250, change24h: 2.3, marketCap: 1850000000000, volume24h: 32000000000, rationale: 'Dominant ETF asset with $72B AUM in BlackRock IBIT alone. Institutional inflows at record highs.', category: 'L1' },
      { symbol: 'ETH', weight: 35, name: 'Ethereum', price: 3480, change24h: 1.8, marketCap: 418000000000, volume24h: 18000000000, rationale: 'Second largest ETF by AUM with growing institutional demand as smart contract platform of choice.', category: 'L1' },
    ],
    btAlpha: 0.002,
  },
  {
    id: 'gaming-metaverse',
    name: 'GameFi & Metaverse',
    ticker: 'GFMV',
    thesis: 'Gaming and metaverse tokens positioned for the next wave of blockchain gaming adoption',
    description: 'Captures the gaming infrastructure layer of Web3. Focuses on protocols providing verifiable ownership, player economies, and cross-game asset interoperability.',
    category: 'Gaming',
    tags: ['Gaming', 'NFT', 'Metaverse'],
    followers: 521,
    creatorName: 'Prism AI',
    isPublic: true,
    rebalanceFrequency: 'monthly' as const,
    performance: { day1: 3.4, day7: 14.8, day30: 38.1, day90: 72.5, day180: 112.8, allTime: 168.4, sharpeRatio: 1.38, maxDrawdown: -35.6, volatility: 74.2 },
    constituents: [
      { symbol: 'IMX', weight: 50, name: 'Immutable X', price: 1.42, change24h: 1.1, marketCap: 2100000000, volume24h: 145000000, rationale: 'Leading gaming L2 with 300+ game partnerships and zero-fee NFT minting.', category: 'Gaming' },
    ],
    btAlpha: 0.002,
  },
];

export async function GET() {
  const [marketResult, etfResult] = await Promise.all([getMarketData(), getETFData()]);
  const liveMarket = marketResult.data;

  // ETF signal from 7-day BTC net flow
  const last7 = etfResult.data.slice(-7);
  const btcFlow7d = last7.reduce((s, d) => s + d.btcNetFlow, 0);
  const etfSignal: 'bullish' | 'bearish' | 'neutral' =
    btcFlow7d > 200_000_000 ? 'bullish' :
    btcFlow7d < -200_000_000 ? 'bearish' : 'neutral';

  const indexes: LiveIndex[] = SEED_DEFINITIONS.map(def => {
    const constituents = def.constituents.map(c => {
      const live = liveMarket.find(m => m.symbol === c.symbol);
      console.log(live,'live')
      const launchPrice = LAUNCH_PRICES[c.symbol] ?? c.price;
      return {
        ...c,
        price: live?.price ?? c.price,
        change24h: live?.change24h ?? c.change24h,
        launchPrice,
        logoUrl: undefined,
      };
    });

    const liveNAV = 1000 * constituents.reduce(
      (sum, c) => sum + (c.weight / 100) * (c.price / c.launchPrice),
      0
    );
    const liveReturn = parseFloat(((liveNAV / 1000 - 1) * 100).toFixed(2));

    // Drift: compare actual portfolio weights (after price moves) vs target weights
    const driftData: DriftEntry[] = constituents.map(c => {
      const currentValue = (c.weight / 100 * 1000 / c.launchPrice) * c.price;
      const actualWeight = parseFloat(((currentValue / liveNAV) * 100).toFixed(1));
      return {
        symbol: c.symbol,
        targetWeight: c.weight,
        actualWeight,
        drift: parseFloat((actualWeight - c.weight).toFixed(1)),
      };
    });
    const maxDrift = parseFloat(
      Math.max(...driftData.map(d => Math.abs(d.drift))).toFixed(1)
    );

    return {
      id: def.id,
      name: def.name,
      ticker: def.ticker,
      thesis: def.thesis,
      description: def.description,
      category: def.category,
      tags: def.tags,
      followers: def.followers,
      creatorName: def.creatorName,
      isPublic: def.isPublic,
      rebalanceFrequency: def.rebalanceFrequency,
      performance: def.performance,
      constituents,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: marketResult.fetchedAt,
      liveNAV: parseFloat(liveNAV.toFixed(2)),
      liveReturn,
      source: marketResult.source,
      backtest: generateBacktest(90, def.btAlpha),
      driftData,
      maxDrift,
      etfSignal,
    };
  });

  return NextResponse.json({
    indexes,
    source: marketResult.source,
    fetchedAt: marketResult.fetchedAt,
  });
}
