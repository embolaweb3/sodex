'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency, formatPercent, formatNumber, getChangeColor, cn } from '@/lib/utils';
import { MOCK_MARKET_DATA } from '@/lib/sosovalue';
import Link from 'next/link';

interface ETFData {
  date: string;
  btcNetFlow: number;
  ethNetFlow: number;
  totalAum: number;
  btcAum: number;
  ethAum: number;
}

interface NewsItem {
  newsId: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  categories: string[];
}

function timeSince(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    market: typeof MOCK_MARKET_DATA;
    etf: ETFData[];
    news: NewsItem[];
    source: 'live' | 'mock';
    fetchedAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const market = data?.market || MOCK_MARKET_DATA;
  const etf = data?.etf || [];
  const news = data?.news || [];

  const lastEtf = etf[etf.length - 1];
  const totalBtcFlow = etf.slice(-7).reduce((a, b) => a + b.btcNetFlow, 0);
  const totalEthFlow = etf.slice(-7).reduce((a, b) => a + b.ethNetFlow, 0);

  const topGainers = [...market].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const topLosers = [...market].sort((a, b) => a.change24h - b.change24h).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#030712] pt-20 px-4 pb-16">
      <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Market <span className="gradient-text">Dashboard</span></h1>
            <p className="text-gray-500 text-sm mt-1">
              Powered by SoSoValue API ·{' '}
              {data?.fetchedAt
                ? `Updated ${new Date(data.fetchedAt).toLocaleTimeString()}`
                : 'Loading...'}
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-2 text-xs font-semibold',
            data?.source === 'live' ? 'text-emerald-400' : 'text-amber-400'
          )}>
            <span className={cn(
              'w-2 h-2 rounded-full',
              data?.source === 'live' ? 'bg-emerald-400 pulse-dot' : 'bg-amber-400'
            )} />
            {data?.source === 'live' ? 'LIVE' : loading ? '···' : 'DEMO'}
          </div>
        </div>

        {/* Top KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'BTC ETF AUM',
              value: lastEtf ? `$${(lastEtf.btcAum / 1e9).toFixed(1)}B` : '$72.4B',
              sub: `7d flow: ${totalBtcFlow >= 0 ? '+' : ''}${(totalBtcFlow / 1e6).toFixed(0)}M`,
              color: 'text-amber-400',
              icon: '₿',
            },
            {
              label: 'ETH ETF AUM',
              value: lastEtf ? `$${(lastEtf.ethAum / 1e9).toFixed(1)}B` : '$12.8B',
              sub: `7d flow: ${totalEthFlow >= 0 ? '+' : ''}${(totalEthFlow / 1e6).toFixed(0)}M`,
              color: 'text-indigo-400',
              icon: 'Ξ',
            },
            {
              label: 'BTC Price',
              value: formatCurrency(market.find(m => m.symbol === 'BTC')?.price || 94250),
              sub: formatPercent(market.find(m => m.symbol === 'BTC')?.change24h || 2.3) + ' 24h',
              color: 'text-amber-400',
              icon: '📈',
            },
            {
              label: 'Top Gainer 24h',
              value: topGainers[0]?.symbol || 'TAO',
              sub: formatPercent(topGainers[0]?.change24h || 5.1) + ' · ' + (topGainers[0]?.category || 'AI'),
              color: 'text-emerald-400',
              icon: '🚀',
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">{kpi.label}</span>
                <span className="text-lg">{kpi.icon}</span>
              </div>
              <div className={cn('text-2xl font-black', kpi.color)}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ETF Flow Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white">BTC ETF Net Flows</h3>
                <p className="text-xs text-gray-500">30-day SoSoValue institutional flow data</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">SoSoValue API</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={etf.slice(-20)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} tickFormatter={v => v.slice(5)} interval={4} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`$${((v as number) / 1e6).toFixed(1)}M`, 'Net Flow']}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="btcNetFlow" radius={[3, 3, 0, 0]}>
                  {etf.slice(-20).map((entry, i) => (
                    <Cell key={i} fill={entry.btcNetFlow >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top movers */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4">Top Movers</h3>
            <div className="space-y-2">
              {topGainers.map(token => (
                <div key={token.symbol} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/3 transition-colors">
                  <div>
                    <div className="font-semibold text-white text-sm">{token.symbol}</div>
                    <div className="text-xs text-gray-500">{token.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{formatCurrency(token.price)}</div>
                    <div className="text-xs text-emerald-400 font-semibold">{formatPercent(token.change24h)}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/5 pt-2 mt-2">
                <div className="text-xs text-gray-600 mb-1.5">Lagging</div>
                {topLosers.map(token => (
                  <div key={token.symbol} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/3 transition-colors">
                    <div>
                      <div className="font-semibold text-white text-sm">{token.symbol}</div>
                      <div className="text-xs text-gray-500">{token.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{formatCurrency(token.price)}</div>
                      <div className="text-xs text-red-400 font-semibold">{formatPercent(token.change24h)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Market table */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">All Markets</h3>
              <span className="text-xs text-gray-500">{market.length} tokens · SoSoValue data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-2">Token</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">24h</th>
                    <th className="text-right py-2">MCap</th>
                  </tr>
                </thead>
                <tbody>
                  {market.map((token, i) => (
                    <motion.tr
                      key={token.symbol}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/3 hover:bg-white/2 transition-colors"
                    >
                      <td className="py-2.5">
                        <div className="font-semibold text-white">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.category}</div>
                      </td>
                      <td className="py-2.5 text-right text-white font-mono">{formatCurrency(token.price)}</td>
                      <td className={cn('py-2.5 text-right font-semibold', getChangeColor(token.change24h))}>
                        {formatPercent(token.change24h)}
                      </td>
                      <td className="py-2.5 text-right text-gray-400">{formatNumber(token.marketCap, true)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* News feed */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Market Intelligence</h3>
              <span className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">SoSoValue News</span>
            </div>
            <div className="space-y-4">
              {(news.length > 0 ? news : MOCK_NEWS_ITEMS).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-300 leading-snug line-clamp-2 font-medium">
                        {(item as NewsItem).title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {((item as NewsItem).categories || []).slice(0, 2).map(cat => (
                        <span key={cat} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{cat}</span>
                      ))}
                      <span className="text-xs text-gray-600">{timeSince((item as NewsItem).publishedAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <Link href="/builder" className="w-full block text-center py-3 rounded-xl bg-gradient-to-r from-indigo-600/50 to-violet-600/50 hover:from-indigo-600 hover:to-violet-600 text-sm font-semibold text-indigo-200 transition-all">
                Build index from these signals →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_NEWS_ITEMS = [
  { title: 'BlackRock Bitcoin ETF records largest single-day inflow of $820M amid BTC rally above $94K', categories: ['BTC', 'ETF'], publishedAt: new Date().toISOString() },
  { title: 'AI tokens surge 25% as Bittensor launches new subnet for financial intelligence on SoSoValue', categories: ['AI'], publishedAt: new Date(Date.now() - 3600000).toISOString() },
  { title: 'DeFi TVL hits $180B as Aave and Pendle see record deposits from institutional players', categories: ['DeFi'], publishedAt: new Date(Date.now() - 7200000).toISOString() },
  { title: 'RWA tokenization market crosses $15B as Ondo Finance expands to new EVM chains', categories: ['RWA'], publishedAt: new Date(Date.now() - 10800000).toISOString() },
  { title: 'Ethereum L2 ecosystem sees $2.4B in weekly volume as Arbitrum leads with 58% market share', categories: ['L2', 'ETH'], publishedAt: new Date(Date.now() - 18000000).toISOString() },
];
