'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatPercent, cn } from '@/lib/utils';
import type { CryptoIndex } from '@/types';

const MOCK_INDEXES: Partial<CryptoIndex>[] = [
  {
    id: 'ai-momentum',
    name: 'AI Momentum Index',
    ticker: 'AIMDX',
    thesis: 'AI & ML tokens with growing institutional ETF inflows and strong developer activity on SoSoValue data',
    category: 'AI',
    tags: ['AI', 'Infrastructure', 'Growth'],
    followers: 1284,
    performance: { day1: 5.1, day7: 22.3, day30: 48.6, day90: 112.4, day180: 0, allTime: 0 },
    constituents: [
      { symbol: 'TAO', weight: 35, name: 'Bittensor', price: 412, change24h: 5.1, marketCap: 3100000000, volume24h: 145000000, rationale: '', category: 'AI' },
      { symbol: 'RENDER', weight: 30, name: 'Render', price: 6.20, change24h: 4.2, marketCap: 2600000000, volume24h: 180000000, rationale: '', category: 'AI' },
      { symbol: 'FET', weight: 25, name: 'Fetch.ai', price: 1.68, change24h: 3.8, marketCap: 1420000000, volume24h: 98000000, rationale: '', category: 'AI' },
    ],
  },
  {
    id: 'defi-blue-chip',
    name: 'DeFi Blue Chip',
    ticker: 'DFBC',
    thesis: 'Established DeFi protocols with proven TVL, revenue, and sustained institutional interest',
    category: 'DeFi',
    tags: ['DeFi', 'Blue Chip', 'Yield'],
    followers: 2891,
    performance: { day1: 2.1, day7: 9.3, day30: 18.7, day90: 42.1, day180: 0, allTime: 0 },
    constituents: [
      { symbol: 'UNI', weight: 30, name: 'Uniswap', price: 8.90, change24h: 2.1, marketCap: 5300000000, volume24h: 320000000, rationale: '', category: 'DeFi' },
      { symbol: 'AAVE', weight: 25, name: 'Aave', price: 198, change24h: 3.4, marketCap: 2900000000, volume24h: 210000000, rationale: '', category: 'DeFi' },
      { symbol: 'MKR', weight: 20, name: 'Maker', price: 1820, change24h: 1.9, marketCap: 1650000000, volume24h: 95000000, rationale: '', category: 'DeFi' },
    ],
  },
  {
    id: 'rwa-frontier',
    name: 'RWA Frontier',
    ticker: 'RWAFR',
    thesis: 'Real World Asset tokenization protocols leading the institutional on-chain finance wave',
    category: 'RWA',
    tags: ['RWA', 'Institutional', 'Growth'],
    followers: 743,
    performance: { day1: 2.8, day7: 11.4, day30: 31.2, day90: 89.6, day180: 0, allTime: 0 },
    constituents: [
      { symbol: 'ONDO', weight: 40, name: 'Ondo Finance', price: 1.12, change24h: 2.8, marketCap: 1580000000, volume24h: 87000000, rationale: '', category: 'RWA' },
      { symbol: 'LINK', weight: 35, name: 'Chainlink', price: 18.40, change24h: 1.5, marketCap: 10800000000, volume24h: 520000000, rationale: '', category: 'Infrastructure' },
    ],
  },
  {
    id: 'l2-ecosystem',
    name: 'L2 Ecosystem Fund',
    ticker: 'L2EF',
    thesis: 'Layer 2 scaling solutions leading Ethereum ecosystem growth with strong developer adoption',
    category: 'L2',
    tags: ['L2', 'Scaling', 'Ethereum'],
    followers: 1102,
    performance: { day1: 1.2, day7: 6.8, day30: 22.4, day90: 58.3, day180: 0, allTime: 0 },
    constituents: [
      { symbol: 'ARB', weight: 40, name: 'Arbitrum', price: 0.82, change24h: -1.2, marketCap: 3200000000, volume24h: 280000000, rationale: '', category: 'L2' },
      { symbol: 'OP', weight: 35, name: 'Optimism', price: 1.24, change24h: 0.8, marketCap: 1900000000, volume24h: 190000000, rationale: '', category: 'L2' },
    ],
  },
  {
    id: 'institutional-flow',
    name: 'ETF Flow Tracker',
    ticker: 'ETFFT',
    thesis: 'Tokens with the strongest positive institutional ETF inflows per SoSoValue data',
    category: 'L1',
    tags: ['ETF', 'Institutional', 'BTC', 'ETH'],
    followers: 3456,
    performance: { day1: 2.3, day7: 8.1, day30: 24.5, day90: 67.2, day180: 0, allTime: 0 },
    constituents: [
      { symbol: 'BTC', weight: 55, name: 'Bitcoin', price: 94250, change24h: 2.3, marketCap: 1850000000000, volume24h: 32000000000, rationale: '', category: 'L1' },
      { symbol: 'ETH', weight: 35, name: 'Ethereum', price: 3480, change24h: 1.8, marketCap: 418000000000, volume24h: 18000000000, rationale: '', category: 'L1' },
    ],
  },
  {
    id: 'gaming-metaverse',
    name: 'GameFi & Metaverse',
    ticker: 'GFMV',
    thesis: 'Gaming and metaverse tokens positioned for the next wave of blockchain gaming adoption',
    category: 'Gaming',
    tags: ['Gaming', 'NFT', 'Metaverse'],
    followers: 521,
    performance: { day1: 3.4, day7: 14.8, day30: 38.1, day90: 72.5, day180: 0, allTime: 0 },
    constituents: [
      { symbol: 'IMX', weight: 50, name: 'Immutable X', price: 1.42, change24h: 1.1, marketCap: 2100000000, volume24h: 145000000, rationale: '', category: 'Gaming' },
    ],
  },
];

const CATEGORIES = ['All', 'AI', 'DeFi', 'RWA', 'L1', 'L2', 'Gaming', 'Infrastructure'];
const SORT_OPTIONS = [
  { value: 'followers', label: 'Most Followed' },
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

  const filtered = MOCK_INDEXES
    .filter(idx => {
      if (category !== 'All' && idx.category !== category) return false;
      if (search && !idx.name?.toLowerCase().includes(search.toLowerCase()) &&
        !idx.thesis?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'followers') return (b.followers || 0) - (a.followers || 0);
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
        <div className="flex gap-6 mb-8 text-sm text-gray-500">
          <span><span className="text-white font-semibold">{filtered.length}</span> indexes</span>
          <span><span className="text-white font-semibold">{filtered.reduce((a, b) => a + (b.followers || 0), 0).toLocaleString()}</span> total followers</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            Live SoSoValue data
          </span>
        </div>

        {/* Index grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((idx, i) => {
            const cat = idx.category || 'Other';
            const styles = CATEGORY_STYLES[cat] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' };
            return (
              <motion.div
                key={idx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Link href={`/indexes/${idx.id}`} className="block h-full">
                  <div className="glass rounded-2xl p-5 border border-white/5 hover:border-indigo-500/25 transition-all duration-300 h-full flex flex-col">
                    {/* Top */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', styles.bg, styles.text, styles.border)}>
                          {cat}
                        </span>
                        <h3 className="mt-2 font-bold text-white text-base leading-tight">{idx.name}</h3>
                        <span className="text-xs text-gray-600 font-mono">{idx.ticker}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-black text-emerald-400">+{idx.performance?.day30?.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">30d return</div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 flex-1 mb-4">{idx.thesis}</p>

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
                        <span className="text-gray-500">7d <span className="text-emerald-400 font-semibold">+{idx.performance?.day7?.toFixed(1)}%</span></span>
                        <span className="text-gray-500">90d <span className="text-emerald-400 font-semibold">+{idx.performance?.day90?.toFixed(1)}%</span></span>
                      </div>
                      <span className="text-gray-500">👥 {idx.followers?.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

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
