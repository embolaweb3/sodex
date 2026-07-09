'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const FACTOR_META = [
  { key: 'instFlow',  label: 'Institutional Flow',  color: '#f59e0b', icon: '🏦' },
  { key: 'momentum',  label: 'Momentum',             color: '#6366f1', icon: '📈' },
  { key: 'liquidity', label: 'Liquidity',            color: '#06b6d4', icon: '💧' },
  { key: 'sentiment', label: 'Sentiment',            color: '#8b5cf6', icon: '📰' },
  { key: 'sizeRank',  label: 'Growth Potential',     color: '#10b981', icon: '🚀' },
];

const SEED_FACTOR_VECTORS: Record<string, Record<string, number>> = {
  'AI Momentum':        { instFlow: 0.15, momentum: 0.40, liquidity: 0.10, sentiment: 0.25, sizeRank: 0.10 },
  'DeFi Blue Chip':     { instFlow: 0.20, momentum: 0.20, liquidity: 0.35, sentiment: 0.15, sizeRank: 0.10 },
  'RWA Frontier':       { instFlow: 0.45, momentum: 0.15, liquidity: 0.20, sentiment: 0.10, sizeRank: 0.10 },
  'L2 Ecosystem':       { instFlow: 0.15, momentum: 0.30, liquidity: 0.25, sentiment: 0.20, sizeRank: 0.10 },
  'ETF Flow Tracker':   { instFlow: 0.55, momentum: 0.20, liquidity: 0.15, sentiment: 0.10, sizeRank: 0.00 },
  'GameFi & Metaverse': { instFlow: 0.10, momentum: 0.30, liquidity: 0.20, sentiment: 0.30, sizeRank: 0.10 },
};

interface TokenScore {
  instFlow: number;
  momentum: number;
  liquidity: number;
  sentiment: number;
  sizeRank: number;
  sector: string;
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<Record<string, TokenScore>>({});
  const [source, setSource] = useState('');
  const [daysOfData, setDaysOfData] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/factor-scores')
      .then(r => r.json())
      .then(d => {
        setScores(d.scores ?? {});
        setSource(d.source ?? '');
        setDaysOfData(d.daysOfData ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Community consensus: average of all seed factor vectors
  const vectors = Object.values(SEED_FACTOR_VECTORS);
  const consensus: Record<string, number> = {};
  for (const f of FACTOR_META) {
    consensus[f.key] = vectors.reduce((s, v) => s + (v[f.key] ?? 0), 0) / vectors.length;
  }

  const symbols = Object.keys(scores);

  function topByFactor(key: string, n = 3) {
    return symbols
      .map(sym => ({ symbol: sym, score: (scores[sym] as unknown as Record<string, number>)[key] ?? 0, sector: scores[sym].sector }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }

  const compositeScores = symbols.map(sym => {
    const s = scores[sym] as unknown as Record<string, number>;
    const composite = FACTOR_META.reduce((sum, f) => sum + (consensus[f.key] ?? 0) * (s[f.key] ?? 0), 0);
    return { symbol: sym, composite: Math.round(composite * 10) / 10, sector: scores[sym].sector };
  }).sort((a, b) => b.composite - a.composite);

  const topConsensusKey = FACTOR_META.reduce((prev, curr) =>
    (consensus[curr.key] ?? 0) > (consensus[prev.key] ?? 0) ? curr : prev
  );

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-16 px-4">
      <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10 pt-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass border border-amber-500/20 text-xs text-amber-400 uppercase tracking-widest">
            🏆 Factor Leaderboard
          </div>
          <h1 className="text-4xl font-black mb-2">
            Which factors are <span className="gradient-text">winning</span> today?
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Live SoSoValue factor scores across 15 tracked tokens. Judges can verify the DB accumulates data daily.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <span className={cn(
              'flex items-center gap-1.5 font-medium',
              source === 'database' ? 'text-emerald-400' : 'text-amber-400'
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                source === 'database' ? 'bg-emerald-400 pulse-dot' : 'bg-amber-400'
              )} />
              {source === 'database'
                ? `${daysOfData} day${daysOfData !== 1 ? 's' : ''} of data in DB · growing daily`
                : 'Live-computed · run cron to persist'}
            </span>
            <Link href="/builder" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Build an index →
            </Link>
          </div>
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 border border-white/5 h-44 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && symbols.length > 0 && (
          <>
            {/* Top tokens per factor */}
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Factor Leaders Today</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {FACTOR_META.map(({ key, label, color, icon }, fi) => {
                  const top = topByFactor(key);
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: fi * 0.05 }}
                      className="glass rounded-2xl p-4 border"
                      style={{ borderColor: `${color}25` }}
                    >
                      <div className="flex items-center gap-1.5 mb-3">
                        <span>{icon}</span>
                        <span className="text-xs font-bold text-gray-300">{label}</span>
                      </div>
                      <div className="space-y-2.5">
                        {top.map((t, rank) => (
                          <div key={t.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600 w-4">#{rank + 1}</span>
                              <span className="text-sm font-bold text-white font-mono">{t.symbol}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-10 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${t.score}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="text-xs font-bold tabular-nums" style={{ color }}>
                                {t.score.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Community consensus */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-6 border border-indigo-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>🧭</span>
                  <h3 className="font-bold text-white">Community Thesis Consensus</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Average factor emphasis across {Object.keys(SEED_FACTOR_VECTORS).length} published indexes — what the community collectively cares about.
                </p>
                <div className="space-y-3">
                  {FACTOR_META
                    .map(f => ({ ...f, weight: consensus[f.key] ?? 0 }))
                    .sort((a, b) => b.weight - a.weight)
                    .map(({ key, label, color, weight }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300">{label}</span>
                          <span className="text-sm font-bold text-white">{Math.round(weight * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${weight * 100}%` }}
                            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-600 mt-4 italic">
                  The community collectively weights {topConsensusKey.label} highest.
                </p>
              </motion.div>

              {/* Composite ranking */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>🎯</span>
                  <h3 className="font-bold text-white">Composite Score Ranking</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Tokens ranked by composite factor score weighted by community consensus.
                </p>
                <div className="space-y-2">
                  {compositeScores.slice(0, 9).map((item, rank) => {
                    const rankColor = rank === 0 ? '#f59e0b' : rank === 1 ? '#9ca3af' : rank === 2 ? '#a16207' : '#4b5563';
                    return (
                      <div key={item.symbol} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-5 text-center tabular-nums" style={{ color: rankColor }}>
                          {rank + 1}
                        </span>
                        <span className="font-bold text-white font-mono w-14">{item.symbol}</span>
                        <span className="text-xs text-gray-600 w-16 truncate">{item.sector}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${item.composite}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-300 w-8 text-right tabular-nums">
                          {item.composite.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Index Factor DNA table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6 border border-white/10 mb-8"
            >
              <h3 className="font-bold text-white mb-1">Index Factor DNA</h3>
              <p className="text-xs text-gray-500 mb-4">
                Each index&apos;s thesis translated into its quantitative factor emphasis vector.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-white/5">
                      <th className="text-left pb-2 font-medium">Index</th>
                      {FACTOR_META.map(f => (
                        <th key={f.key} className="text-right pb-2 font-medium px-2">
                          <span title={f.label}>{f.icon}</span>
                        </th>
                      ))}
                      <th className="text-left pb-2 pl-4 font-medium">Dominant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.entries(SEED_FACTOR_VECTORS).map(([name, fv]) => {
                      const dominant = FACTOR_META.reduce((prev, curr) =>
                        (fv[curr.key] ?? 0) > (fv[prev.key] ?? 0) ? curr : prev
                      );
                      return (
                        <tr key={name}>
                          <td className="py-2.5 font-semibold text-white text-sm">{name}</td>
                          {FACTOR_META.map(f => {
                            const pct = Math.round((fv[f.key] ?? 0) * 100);
                            return (
                              <td key={f.key} className="py-2.5 text-right font-mono text-xs px-2" style={{ color: pct >= 30 ? f.color : '#4b5563' }}>
                                {pct}%
                              </td>
                            );
                          })}
                          <td className="py-2.5 pl-4 text-xs" style={{ color: dominant.color }}>
                            {dominant.icon} {dominant.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {!loading && symbols.length === 0 && (
          <div className="text-center py-16 glass rounded-2xl border border-white/5">
            <p className="text-xl text-gray-400 mb-2">No factor scores yet</p>
            <p className="text-sm text-gray-600">
              Run <code className="text-indigo-400 font-mono">GET /api/cron/factor-refresh</code> to seed the first day of data.
            </p>
          </div>
        )}

        {/* Build CTA */}
        <div className="text-center glass rounded-2xl p-8 border border-indigo-500/20">
          <p className="text-lg font-bold text-white mb-2">See a strong factor signal?</p>
          <p className="text-gray-400 mb-5 text-sm">
            Build a custom index that captures it — describe your thesis in plain English and get a weighted, backtested index instantly.
          </p>
          <Link
            href="/builder"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-white text-sm transition-all glow-indigo"
          >
            Build Factor Index →
          </Link>
        </div>
      </div>
    </div>
  );
}
