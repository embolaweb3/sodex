'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency, formatPercent, getCategoryColor, cn } from '@/lib/utils';
import type { LiveIndex, IndexesApiResponse } from '@/types';
import { useAccount } from 'wagmi';

// --- Factor Health types ---
interface FactorHealth {
  key: string;
  name: string;
  thesisWeight: number;
  currentScore: number;
  level: 'strong' | 'moderate' | 'weak';
}

interface HealthData {
  status: 'healthy' | 'warning' | 'degraded';
  factors: FactorHealth[];
  alerts: string[];
  doctorNote: string | null;
  constituents: string[];
  generatedAt: string;
}

const FACTOR_COLORS: Record<string, string> = {
  instFlow:  '#f59e0b',
  momentum:  '#6366f1',
  liquidity: '#06b6d4',
  sentiment: '#8b5cf6',
  sizeRank:  '#10b981',
};

const STATUS_STYLES = {
  healthy:  { label: '✓ Thesis Healthy',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  warning:  { label: '⚠ Factor Warning',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  degraded: { label: '✗ Thesis Degraded',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function FactorHealthPanel({ health, loading }: { health: HealthData | null; loading: boolean }) {
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6 border border-white/10 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span>🩺</span>
          <h3 className="font-bold text-white">Index Doctor</h3>
          <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-500 border border-white/5 animate-pulse">Analysing...</span>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!health) return null;

  const ss = STATUS_STYLES[health.status];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="glass rounded-2xl p-6 border border-white/10 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span>🩺</span>
          <h3 className="font-bold text-white">Index Doctor</h3>
          <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-500 border border-white/5">Live Factor Health</span>
        </div>
        <span className={cn('text-xs px-2.5 py-1 rounded-lg border font-semibold', ss.cls)}>
          {ss.label}
        </span>
      </div>

      {/* Per-factor bars */}
      <div className="space-y-3 mb-5">
        {health.factors.map(f => {
          const color = FACTOR_COLORS[f.key] ?? '#6b7280';
          const scoreColor = f.currentScore >= 60 ? '#10b981' : f.currentScore >= 40 ? '#d97706' : '#ef4444';
          const isHighEmphasis = f.thesisWeight >= 0.20;
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{f.name}</span>
                  {isHighEmphasis && (
                    <span className="text-xs px-1 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                      {Math.round(f.thesisWeight * 100)}% thesis wt
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor }}>
                  {f.currentScore}/100
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Thesis weight indicator */}
                <div className="w-1 rounded-full" style={{ height: 6, backgroundColor: color, opacity: 0.4 + f.thesisWeight * 1.2 }} />
                {/* Current score bar */}
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.currentScore}%` }}
                    transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: scoreColor }}
                  />
                </div>
                <span className="text-xs capitalize" style={{ color: scoreColor }}>{f.level}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Doctor note */}
      {health.doctorNote && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 mb-4">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">🩺</span>
            <div>
              <div className="text-xs font-semibold text-amber-400 mb-1.5">Index Doctor Diagnosis</div>
              <p className="text-sm text-gray-300 leading-relaxed">{health.doctorNote}</p>
            </div>
          </div>
        </div>
      )}

      {health.alerts.length > 0 && !health.doctorNote && (
        <div className="space-y-2 mb-4">
          {health.alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
              <span className="flex-shrink-0">⚠</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {health.alerts.length === 0 && (
        <p className="text-xs text-emerald-400">
          All emphasized factors are performing within healthy ranges. Thesis premises remain intact.
        </p>
      )}

      <p className="text-xs text-gray-600 mt-3">
        Checked {health.constituents.join(', ')} · {new Date(health.generatedAt).toLocaleTimeString()}
      </p>
    </motion.div>
  );
}

const ETF_SIGNAL_STYLES = {
  bullish: { label: '↑ ETF Inflows', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  bearish: { label: '↓ ETF Outflows', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  neutral: { label: '→ ETF Neutral', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

function useFollow(id: string, walletAddress: string | undefined) {
  const key = `prism_follows_${walletAddress ?? 'anon'}`;
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      setFollowing(stored.includes(id));
    } catch { /* ignore */ }
  }, [id, key]);

  const toggle = useCallback(() => {
    setFollowing(prev => {
      const next = !prev;
      try {
        const stored: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
        const updated = next ? [...stored, id] : stored.filter(x => x !== id);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch { /* ignore */ }
      return next;
    });
  }, [id, key]);

  return { following, toggle };
}

export default function IndexDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [idx, setIdx] = useState<LiveIndex | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const { address } = useAccount();
  const { following, toggle: toggleFollow } = useFollow(id, address);

  useEffect(() => {
    fetch('/api/indexes')
      .then(r => r.json())
      .then((d: IndexesApiResponse) => {
        const found = d.indexes.find(i => i.id === id);
        if (found) setIdx(found);
        else setNotFound(true);
        setLoading(false);
        // Kick off health check in parallel
        setHealthLoading(true);
        fetch(`/api/health/${id}`)
          .then(r => r.ok ? r.json() : null)
          .then((h: HealthData | null) => { if (h && h.status) setHealth(h); setHealthLoading(false); })
          .catch(() => setHealthLoading(false));
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
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-md border font-semibold',
                  ETF_SIGNAL_STYLES[idx.etfSignal].cls
                )}>
                  {ETF_SIGNAL_STYLES[idx.etfSignal].label}
                </span>
                {idx.maxDrift > 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-md border font-semibold bg-amber-500/10 text-amber-400 border-amber-500/20">
                    ⚠ Rebalance Needed
                  </span>
                )}
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
              <button
                onClick={toggleFollow}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  following
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                    : 'glass border border-white/10 hover:border-indigo-500/30 text-gray-300 hover:text-white'
                )}
              >
                {following ? '✓ Following' : '+ Follow'}
              </button>
              <Link
                href={`/builder?thesis=${encodeURIComponent(idx.thesis)}&fork=${idx.id}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500 transition-all"
              >
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

        {/* Factor Health — only show once main index data is loaded */}
        {(health || healthLoading) && (
          <FactorHealthPanel health={health} loading={healthLoading} />
        )}

        {/* Drift Breakdown */}
        {idx.driftData && idx.driftData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 border border-white/10 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white">Weight Drift Analysis</h3>
                <p className="text-xs text-gray-500 mt-0.5">Actual portfolio weights after price moves vs target allocations</p>
              </div>
              {idx.maxDrift > 5 ? (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  ⚠ Max drift {idx.maxDrift.toFixed(1)}% — rebalance recommended
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  ✓ Within bounds ({idx.maxDrift.toFixed(1)}% max drift)
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-white/5">
                    <th className="text-left pb-2 font-medium">Token</th>
                    <th className="text-right pb-2 font-medium">Target</th>
                    <th className="text-right pb-2 font-medium">Actual</th>
                    <th className="text-right pb-2 font-medium">Drift</th>
                    <th className="text-left pb-2 pl-4 font-medium">Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {idx.driftData.map(d => {
                    const over = d.drift > 0;
                    const barWidth = Math.min(Math.abs(d.drift) * 10, 100);
                    return (
                      <tr key={d.symbol} className="py-2">
                        <td className="py-2.5 font-mono font-bold text-white">{d.symbol}</td>
                        <td className="py-2.5 text-right text-gray-400">{d.targetWeight.toFixed(1)}%</td>
                        <td className={cn(
                          'py-2.5 text-right font-semibold',
                          over ? 'text-amber-400' : 'text-cyan-400'
                        )}>
                          {d.actualWeight.toFixed(1)}%
                        </td>
                        <td className={cn(
                          'py-2.5 text-right font-bold',
                          over ? 'text-amber-400' : d.drift < 0 ? 'text-cyan-400' : 'text-gray-400'
                        )}>
                          {over ? '+' : ''}{d.drift.toFixed(1)}%
                        </td>
                        <td className="py-2.5 pl-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', over ? 'bg-amber-400/70' : 'bg-cyan-400/70')}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{over ? 'over' : 'under'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
