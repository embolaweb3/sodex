'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { formatPercent } from '@/lib/utils';
import type { CryptoIndex } from '@/types';

const FEATURED: Partial<CryptoIndex>[] = [
  {
    id: 'ai-momentum',
    name: 'AI Momentum Index',
    ticker: 'AIMDX',
    thesis: 'AI & ML tokens with growing institutional ETF inflows and strong developer activity',
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
      { symbol: 'PENDLE', weight: 15, name: 'Pendle', price: 4.85, change24h: 6.2, marketCap: 720000000, volume24h: 62000000, rationale: '', category: 'DeFi' },
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
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AI: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  DeFi: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  RWA: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  L1: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  L2: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
};

export function FeaturedIndexes() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-b from-transparent to-indigo-950/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <div className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Featured Indexes</div>
            <h2 className="text-3xl font-black">Community-built indexes</h2>
          </div>
          <Link href="/indexes" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            View all →
          </Link>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED.map((idx, i) => {
            const cat = idx.category || 'Other';
            const colors = CATEGORY_COLORS[cat] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' };
            return (
              <motion.div
                key={idx.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/indexes/${idx.id}`} className="block glass rounded-2xl p-5 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border} font-medium`}>{cat}</span>
                      </div>
                      <h3 className="font-bold text-white">{idx.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">{idx.ticker}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-400">+{idx.performance?.day30?.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">30d</div>
                    </div>
                  </div>

                  {/* Thesis */}
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{idx.thesis}</p>

                  {/* Constituents preview */}
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {idx.constituents?.slice(0, 4).map(c => (
                      <span key={c.symbol} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-300 font-mono">
                        {c.symbol} {c.weight}%
                      </span>
                    ))}
                  </div>

                  {/* Performance row */}
                  <div className="flex justify-between text-xs border-t border-white/5 pt-3">
                    <div>
                      <div className="text-gray-500">7d</div>
                      <div className="text-emerald-400 font-semibold">+{idx.performance?.day7?.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">90d</div>
                      <div className="text-emerald-400 font-semibold">+{idx.performance?.day90?.toFixed(1)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500">Followers</div>
                      <div className="text-gray-300 font-semibold">{idx.followers?.toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
