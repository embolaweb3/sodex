'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatPercent, cn } from '@/lib/utils';
import type { LiveIndex, IndexesApiResponse } from '@/types';
import { useAccount } from 'wagmi';

const ETF_SIGNAL_CHIPS = {
  bullish: { label: '↑ ETF Inflows', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  bearish: { label: '↓ ETF Outflows', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  neutral: { label: '→ Neutral', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

const CATEGORIES = ['All', 'AI', 'DeFi', 'RWA', 'L1', 'L2', 'Gaming', 'Infrastructure'];
const SORT_OPTIONS = [
  { value: 'followers', label: 'Most Followed' },
  { value: 'liveReturn', label: 'Live Return' },
  { value: 'day30', label: '30D Performance' },
  { value: 'day7', label: '7D Performance' },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  AI: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  DeFi: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  RWA: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  L1: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  L2: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  Gaming: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  Infrastructure: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

export default function MarketplacePage() {
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('followers');
  const [search, setSearch] = useState('');
  const [indexes, setIndexes] = useState<LiveIndex[]>([]);
  const [dataSource, setDataSource] = useState<'live' | 'mock' | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [follows, setFollows] = useState<string[]>([]);
  const { address } = useAccount();

  useEffect(() => {
    fetch('/api/indexes')
      .then(r => r.json())
      .then((d: IndexesApiResponse) => {
        setIndexes(d.indexes);
        setDataSource(d.source);
        setFetchedAt(d.fetchedAt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const key = `prism_follows_${address ?? 'anon'}`;
      const stored: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      setFollows(stored);
    } catch { /* ignore */ }
  }, [address]);

  const filtered = indexes
    .filter(idx => {
      if (category !== 'All' && idx.category !== category) return false;
      if (search && !idx.name?.toLowerCase().includes(search.toLowerCase()) &&
        !idx.thesis?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'followers') return (b.followers || 0) - (a.followers || 0);
      if (sort === 'liveReturn') return (b.liveReturn || 0) - (a.liveReturn || 0);
      if (sort === 'day30') return (b.performance?.day30 || 0) - (a.performance?.day30 || 0);
      if (sort === 'day7') return (b.performance?.day7 || 0) - (a.performance?.day7 || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#030712] pt-20 px-4 pb-16">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 pt-8"
        >
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass border border-violet-500/20 text-xs text-violet-400 uppercase tracking-widest">
            🏪 Index Marketplace
          </div>
          <h1 className="text-4xl font-black mb-2">Community <span className="gradient-text">Indexes</span></h1>
          <p className="text-gray-400">Browse, fork, and follow thematic indexes built by the community. Powered by SoSoValue data.</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search indexes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/40"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'glass border border-white/5 text-gray-400 hover:text-white hover:border-white/20'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mb-8 text-sm text-gray-500 items-center">
          <span><span className="text-white font-semibold">{filtered.length}</span> indexes</span>
          <span><span className="text-white font-semibold">{filtered.reduce((a, b) => a + (b.followers || 0), 0).toLocaleString()}</span> total followers</span>
          <span className={cn(
            'flex items-center gap-1.5 font-medium text-xs',
            dataSource === 'live' ? 'text-emerald-400' : dataSource === 'mock' ? 'text-amber-400' : 'text-gray-500'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              dataSource === 'live' ? 'bg-emerald-400 pulse-dot' : dataSource === 'mock' ? 'bg-amber-400' : 'bg-gray-500'
            )} />
            {dataSource === 'live' ? 'LIVE SoSoValue data' : dataSource === 'mock' ? 'DEMO data' : 'Loading...'}
            {fetchedAt && dataSource && (
              <span className="text-gray-600 font-normal ml-1">· {new Date(fetchedAt).toLocaleTimeString()}</span>
            )}
          </span>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/5 h-52 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-16 mb-3" />
                <div className="h-5 bg-white/8 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2 mb-4" />
                <div className="h-12 bg-white/3 rounded mb-4" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Index grid */}
        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((idx, i) => {
              const cat = idx.category || 'Other';
              const styles = CATEGORY_STYLES[cat] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' };
              const returnIsPositive = idx.liveReturn >= 0;
              const isFollowing = follows.includes(idx.id);
              const etfChip = ETF_SIGNAL_CHIPS[idx.etfSignal ?? 'neutral'];
              return (
                <motion.div
                  key={idx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Link href={`/indexes/${idx.id}`} className="block h-full">
                    <div className={cn(
                      'glass rounded-2xl p-5 border transition-all duration-300 h-full flex flex-col',
                      isFollowing ? 'border-indigo-500/30 hover:border-indigo-500/50' : 'border-white/5 hover:border-indigo-500/25'
                    )}>
                      {/* Top */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', styles.bg, styles.text, styles.border)}>
                              {cat}
                            </span>
                            {idx.source === 'live' && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">● LIVE</span>
                            )}
                            {idx.maxDrift > 5 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">⚠ Rebalance</span>
                            )}
                            {isFollowing && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">✓ Following</span>
                            )}
                          </div>
                          <h3 className="mt-2 font-bold text-white text-base leading-tight">{idx.name}</h3>
                          <span className="text-xs text-gray-600 font-mono">{idx.ticker}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={cn('text-xl font-black', returnIsPositive ? 'text-emerald-400' : 'text-red-400')}>
                            {returnIsPositive ? '+' : ''}{idx.liveReturn.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">since launch</div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-2 flex-1 mb-3">{idx.thesis}</p>

                      {/* ETF signal chip */}
                      <div className="mb-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', etfChip.cls)}>
                          {etfChip.label}
                        </span>
                      </div>

                      {/* Token pills */}
                      <div className="flex gap-1.5 flex-wrap mb-4">
                        {idx.constituents?.slice(0, 5).map(c => (
                          <span key={c.symbol} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-300 font-mono border border-white/5">
                            {c.symbol}
                          </span>
                        ))}
                        {(idx.constituents?.length || 0) > 5 && (
                          <span className="text-xs px-2 py-0.5 text-gray-500">+{(idx.constituents?.length || 0) - 5}</span>
                        )}
                      </div>

                      {/* Bottom stats */}
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                        <div className="flex gap-4">
                          <span className="text-gray-500">7d <span className={idx.performance?.day7 >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{idx.performance?.day7 >= 0 ? '+' : ''}{idx.performance?.day7?.toFixed(1)}%</span></span>
                          <span className="text-gray-500">90d <span className={idx.performance?.day90 >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{idx.performance?.day90 >= 0 ? '+' : ''}{idx.performance?.day90?.toFixed(1)}%</span></span>
                        </div>
                        <span className="text-gray-500">👥 {idx.followers?.toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Build CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center glass rounded-2xl p-8 border border-indigo-500/20"
        >
          <div className="text-2xl font-black mb-2">Don&apos;t see your thesis?</div>
          <p className="text-gray-400 mb-6 text-sm">Build a custom index with AI in under 60 seconds using SoSoValue institutional data.</p>
          <Link
            href="/builder"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-white text-sm transition-all glow-indigo"
          >
            Build Custom Index →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
