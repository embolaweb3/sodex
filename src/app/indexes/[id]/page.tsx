'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency, formatPercent, getCategoryColor, cn } from '@/lib/utils';
import type { CryptoIndex, BacktestDataPoint } from '@/types';

const MOCK_INDEXES: Record<string, Partial<CryptoIndex> & { backtest: BacktestDataPoint[] }> = {
  'ai-momentum': {
    id: 'ai-momentum',
    name: 'AI Momentum Index',
    ticker: 'AIMDX',
    thesis: 'AI & ML tokens with growing institutional ETF inflows and strong developer activity on SoSoValue data',
    description: 'A concentrated index capturing the AI infrastructure megatrend. Tracks tokens powering decentralized AI compute, training, and inference with the highest SoSoValue institutional flow scores.',
    category: 'AI',
    tags: ['AI', 'Infrastructure', 'Growth', 'SoSoValue'],
    followers: 1284,
    creatorName: 'IndexForge AI',
    rebalanceFrequency: 'monthly',
    performance: { day1: 5.1, day7: 22.3, day30: 48.6, day90: 112.4, day180: 198.2, allTime: 312.8, sharpeRatio: 2.14, maxDrawdown: -28.4, volatility: 68.2 },
    constituents: [
      { symbol: 'TAO', weight: 35, name: 'Bittensor', price: 412, change24h: 5.1, marketCap: 3100000000, volume24h: 145000000, rationale: 'Leading decentralized AI training network with strongest developer momentum and unique subnet model.', category: 'AI' },
      { symbol: 'RENDER', weight: 30, name: 'Render', price: 6.20, change24h: 4.2, marketCap: 2600000000, volume24h: 180000000, rationale: 'Dominant GPU rendering network positioned at the intersection of AI compute and Web3 infrastructure.', category: 'AI' },
      { symbol: 'FET', weight: 25, name: 'Fetch.ai', price: 1.68, change24h: 3.8, marketCap: 1420000000, volume24h: 98000000, rationale: 'Multi-agent AI coordination protocol with strong institutional partnerships and growing enterprise adoption.', category: 'AI' },
    ],
    backtest: generateBacktest(90, 0.004),
  },
  'defi-blue-chip': {
    id: 'defi-blue-chip',
    name: 'DeFi Blue Chip',
    ticker: 'DFBC',
    thesis: 'Established DeFi protocols with proven TVL, revenue, and sustained institutional interest',
    description: 'The definitive DeFi blue chip index. Tracks protocols with the highest proven revenue, TVL, and sustainable yield generation, weighted by SoSoValue institutional sentiment.',
    category: 'DeFi',
    tags: ['DeFi', 'Blue Chip', 'Yield', 'Proven'],
    followers: 2891,
    creatorName: 'IndexForge AI',
    rebalanceFrequency: 'monthly',
    performance: { day1: 2.1, day7: 9.3, day30: 18.7, day90: 42.1, day180: 88.3, allTime: 156.4, sharpeRatio: 1.82, maxDrawdown: -22.1, volatility: 48.6 },
    constituents: [
      { symbol: 'UNI', weight: 30, name: 'Uniswap', price: 8.90, change24h: 2.1, marketCap: 5300000000, volume24h: 320000000, rationale: 'Largest DEX by volume with proven fee revenue and strong V4 upgrade catalysts.', category: 'DeFi' },
      { symbol: 'AAVE', weight: 25, name: 'Aave', price: 198, change24h: 3.4, marketCap: 2900000000, volume24h: 210000000, rationale: 'Dominant lending protocol with $18B TVL and expanding to new chains and RWA collateral.', category: 'DeFi' },
      { symbol: 'MKR', weight: 20, name: 'Maker', price: 1820, change24h: 1.9, marketCap: 1650000000, volume24h: 95000000, rationale: 'Gold standard of decentralized stablecoins with highest revenue per token in DeFi.', category: 'DeFi' },
      { symbol: 'PENDLE', weight: 15, name: 'Pendle', price: 4.85, change24h: 6.2, marketCap: 720000000, volume24h: 62000000, rationale: 'Fastest growing yield-trading protocol capturing the institutional fixed-income demand in DeFi.', category: 'DeFi' },
    ],
    backtest: generateBacktest(90, 0.002),
  },
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

export default function IndexDetailPage() {
  const { id } = useParams<{ id: string }>();
  const idx = MOCK_INDEXES[id];

  if (!idx) {
    return (
      <div className="min-h-screen bg-[#030712] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Index not found</h2>
          <Link href="/indexes" className="text-indigo-400 hover:text-indigo-300">← Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const pieData = idx.constituents?.map(c => ({ name: c.symbol, value: c.weight, color: getCategoryColor(c.category) }));

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-16 px-4">
      <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/indexes" className="hover:text-gray-300 transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-gray-300">{idx.ticker}</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white">{idx.name}</h1>
                <span className="font-mono text-sm px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{idx.ticker}</span>
              </div>
              <p className="text-gray-400 mb-4">{idx.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {idx.tags?.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5">{tag}</span>
                ))}
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <span>Creator: <span className="text-gray-300">{idx.creatorName}</span></span>
                <span>Rebalance: <span className="text-gray-300 capitalize">{idx.rebalanceFrequency}</span></span>
                <span>Followers: <span className="text-gray-300">{idx.followers?.toLocaleString()}</span></span>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button className="px-5 py-2.5 rounded-xl glass border border-white/10 hover:border-indigo-500/30 text-sm font-semibold text-gray-300 hover:text-white transition-all">
                + Follow
              </button>
              <Link href="/builder" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500 transition-all">
                Fork Index
              </Link>
            </div>
          </div>

          {/* Perf grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mt-6 pt-5 border-t border-white/5">
            {[
              { label: '1D', value: idx.performance?.day1 },
              { label: '7D', value: idx.performance?.day7 },
              { label: '30D', value: idx.performance?.day30 },
              { label: '90D', value: idx.performance?.day90 },
              { label: 'Sharpe', value: idx.performance?.sharpeRatio, noPercent: true },
              { label: 'Max DD', value: idx.performance?.maxDrawdown },
              { label: 'Volatility', value: idx.performance?.volatility, noPercent: true, suffix: '%' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={cn(
                  'text-lg font-black',
                  m.noPercent ? 'text-gray-300' : (m.value || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {m.noPercent ? m.value?.toFixed(2) + (m.suffix || '') : formatPercent(m.value || 0)}
                </div>
                <div className="text-xs text-gray-600">{m.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Backtest chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-1">90-Day Performance</h3>
            <p className="text-xs text-gray-500 mb-4">Simulated · $1,000 initial · vs BTC & ETH</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={idx.backtest} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} tickFormatter={v => v.slice(5)} interval={14} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#9ca3af' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Area type="monotone" dataKey="indexValue" name={idx.ticker} stroke="#6366f1" fill="url(#ig)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="btcValue" name="BTC" stroke="#f59e0b" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="ethValue" name="ETH" stroke="#06b6d4" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Allocation pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-4">Allocation</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}%`, 'Weight']} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Constituents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Constituents · {idx.constituents?.length} tokens</h3>
          <div className="space-y-3">
            {idx.constituents?.map((token, i) => (
              <div key={token.symbol} className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke={getCategoryColor(token.category)} strokeWidth="2.5"
                      strokeDasharray={`${token.weight * 0.942} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{token.weight}%</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white">{token.symbol}</span>
                    <span className="text-xs text-gray-500">{token.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{token.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{token.rationale}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-white">{formatCurrency(token.price)}</div>
                  <div className={cn('text-xs', token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400')}>{formatPercent(token.change24h)}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
