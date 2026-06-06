'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency, formatPercent, getCategoryColor, cn } from '@/lib/utils';
import type { LiveIndex, IndexesApiResponse } from '@/types';

export default function IndexDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [idx, setIdx] = useState<LiveIndex | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/indexes')
      .then(r => r.json())
      .then((d: IndexesApiResponse) => {
        const found = d.indexes.find(i => i.id === id);
        if (found) setIdx(found);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] pt-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading index data...</p>
        </div>
      </div>
    );
  }

  if (notFound || !idx) {
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
  const navReturn = ((idx.liveNAV / 1000) - 1) * 100;

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
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-md border font-semibold',
                  idx.source === 'live'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                )}>
                  {idx.source === 'live' ? '● LIVE' : '○ DEMO'}
                </span>
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
                {idx.updatedAt && (
                  <span>Updated: <span className="text-gray-300">{new Date(idx.updatedAt).toLocaleTimeString()}</span></span>
                )}
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

          {/* Perf grid — includes live NAV */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mt-6 pt-5 border-t border-white/5">
            {/* Live NAV — highlighted as the primary live metric */}
            <div className="col-span-2 sm:col-span-1 text-center rounded-xl bg-indigo-500/5 border border-indigo-500/20 py-2 px-1">
              <div className={cn('text-lg font-black', navReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {navReturn >= 0 ? '+' : ''}{navReturn.toFixed(1)}%
              </div>
              <div className="text-xs text-indigo-400 font-semibold">Live NAV</div>
            </div>
            {[
              { label: '1D', value: idx.performance?.day1 },
              { label: '7D', value: idx.performance?.day7 },
              { label: '30D', value: idx.performance?.day30 },
              { label: '90D', value: idx.performance?.day90 },
              { label: 'Sharpe', value: idx.performance?.sharpeRatio, noPercent: true },
              { label: 'Max DD', value: idx.performance?.maxDrawdown },
              { label: 'Vol', value: idx.performance?.volatility, noPercent: true, suffix: '%' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={cn(
                  'text-lg font-black',
                  m.noPercent ? 'text-gray-300' : (m.value || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {m.noPercent ? (m.value?.toFixed(2) ?? '—') + (m.suffix || '') : formatPercent(m.value || 0)}
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
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(v, name) => [`$${(v as number).toFixed(2)}`, name as string]}
                />
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
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${v}%`, 'Weight']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Constituents with live prices */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Constituents · {idx.constituents?.length} tokens</h3>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                idx.source === 'live' ? 'bg-emerald-400 pulse-dot' : 'bg-amber-400'
              )} />
              <span className={idx.source === 'live' ? 'text-emerald-400' : 'text-amber-400'}>
                {idx.source === 'live' ? 'Live prices' : 'Demo prices'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {idx.constituents?.map(token => {
              const pnl = ((token.price / token.launchPrice) - 1) * 100;
              return (
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
                    <div className={cn('text-xs', token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {formatPercent(token.change24h)} 24h
                    </div>
                    <div className={cn('text-xs font-semibold', pnl >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}% since launch
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
