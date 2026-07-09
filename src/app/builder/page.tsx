'use client';

import { useState, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency, formatPercent, getCategoryColor, cn } from '@/lib/utils';
import type { BuildIndexResponse, ExecutionResult, FactorVector, BrinsonAttribution } from '@/types';
import { useAccount } from 'wagmi';

const Scene = dynamic(() => import('@/components/three/Scene').then(m => ({ default: m.Scene })), { ssr: false });

const THESIS_EXAMPLES = [
  'AI tokens with institutional ETF inflows and strong developer activity',
  'DeFi blue chips with proven TVL, revenue, and high Sharpe ratio',
  'Layer 2 scaling solutions leading Ethereum ecosystem growth',
  'RWA tokenization protocols gaining institutional traction',
  'High-momentum sectors with positive SoSoValue sentiment scores',
];

const RISK_LEVELS = [
  { value: 'conservative', label: 'Conservative', desc: '5 tokens · Large caps · 30% max', color: 'text-cyan-400' },
  { value: 'balanced', label: 'Balanced', desc: '5-8 tokens · Mixed caps · 35% max', color: 'text-indigo-400' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Up to 10 · All caps · 40% max', color: 'text-orange-400' },
] as const;

type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

export default function BuilderPage() {
  const [thesis, setThesis] = useState('');
  const [risk, setRisk] = useState<RiskLevel>('balanced');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildIndexResponse | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'building' | 'result'>('input');
  const [buildingStep, setBuildingStep] = useState(0);
  const [macroAlert, setMacroAlert] = useState<string | null>(null);

  // Pre-fill from fork query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forkedThesis = params.get('thesis');
    if (forkedThesis) setThesis(decodeURIComponent(forkedThesis));
  }, []);

  // Macro event detection — scan live news for high-impact events
  useEffect(() => {
    const MACRO_KEYWORDS = ['FOMC', 'Federal Reserve', 'rate decision', 'rate hike', 'rate cut', 'CPI', 'consumer price', 'NFP', 'non-farm payroll', 'jobs report', 'PCE', 'Fed minutes'];
    fetch('/api/market-data')
      .then(r => r.json())
      .then((d: { news?: Array<{ title: string; summary: string }> }) => {
        const news = d.news ?? [];
        const hit = news.find(n =>
          MACRO_KEYWORDS.some(kw =>
            n.title.toLowerCase().includes(kw.toLowerCase()) ||
            n.summary.toLowerCase().includes(kw.toLowerCase())
          )
        );
        if (hit) {
          setMacroAlert(`Macro event in live SoSoValue news: "${hit.title.slice(0, 90)}${hit.title.length > 90 ? '...' : ''}"`);
        }
      })
      .catch(() => {});
  }, []);

  const BUILDING_STEPS = [
    'Querying SoSoValue live market data...',
    'Fetching 30-day ETF flow indicators...',
    'Computing institutional flow factors...',
    'Scoring tokens across 5 quantitative dimensions...',
    'AI interpreting thesis into factor vector...',
    'Constructing weights via softmax factor model...',
    'Running Brinson attribution analysis...',
    'Computing active return vs 60/40 benchmark...',
  ];

  async function handleBuild() {
    if (!thesis.trim() || thesis.length < 10) {
      setError('Please describe your thesis in at least 10 characters');
      return;
    }

    setError('');
    setLoading(true);
    setStep('building');
    setBuildingStep(0);

    // Animate build steps
    const interval = setInterval(() => {
      setBuildingStep(prev => {
        if (prev >= BUILDING_STEPS.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 600);

    try {
      const res = await fetch('/api/build-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis, riskLevel: risk, maxConstituents: 8 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Build failed');
      }

      const data: BuildIndexResponse = await res.json();
      clearInterval(interval);
      setBuildingStep(BUILDING_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
      setStep('result');
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'Failed to build index');
      setStep('input');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] pt-20 relative">
      {/* Three.js background */}
      <div className="fixed inset-0 z-0 opacity-60">
        <Suspense fallback={null}>
          <Scene variant="builder" />
        </Suspense>
      </div>
      <div className="fixed inset-0 grid-bg opacity-20 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full glass border border-indigo-500/20 text-xs text-indigo-400 uppercase tracking-widest">
            🏗️ AI Index Builder
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            Build your <span className="gradient-text">thematic index</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Describe your investment thesis. SoSoValue data + Claude AI constructs a weighted, backtested index instantly.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              {/* Thesis input */}
              <div className="glass rounded-2xl p-6 border border-white/10 mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Your Investment Thesis
                </label>
                <textarea
                  value={thesis}
                  onChange={e => setThesis(e.target.value)}
                  placeholder="Describe your investment thesis in plain English..."
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">Quick examples:</div>
                  <div className="flex flex-wrap gap-2">
                    {THESIS_EXAMPLES.map(ex => (
                      <button
                        key={ex}
                        onClick={() => setThesis(ex)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 text-gray-400 hover:text-indigo-300 transition-all"
                      >
                        {ex.slice(0, 40)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk level */}
              <div className="glass rounded-2xl p-6 border border-white/10 mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Risk Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {RISK_LEVELS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setRisk(r.value)}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-all',
                        risk === r.value
                          ? 'bg-indigo-500/15 border-indigo-500/50'
                          : 'bg-black/20 border-white/5 hover:border-white/20'
                      )}
                    >
                      <div className={cn('text-sm font-bold mb-1', r.color)}>{r.label}</div>
                      <div className="text-xs text-gray-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Macro event warning */}
              {macroAlert && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5">⚡</span>
                  <div>
                    <div className="text-xs font-bold text-amber-400 mb-1 uppercase tracking-wide">Macro Event Detected · SoSoValue Live News</div>
                    <p className="text-xs text-amber-300/80 leading-relaxed">{macroAlert}</p>
                    <p className="text-xs text-gray-500 mt-1">High-impact macro events can cause short-term factor score volatility. Consider weighting liquidity higher or reducing aggressive factor emphasis.</p>
                  </div>
                  <button onClick={() => setMacroAlert(null)} className="flex-shrink-0 text-gray-600 hover:text-gray-400 text-xs mt-0.5">✕</button>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleBuild}
                disabled={loading || thesis.length < 10}
                className={cn(
                  'w-full py-4 rounded-xl font-bold text-white transition-all duration-200 text-base',
                  thesis.length >= 10
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 glow-indigo hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                )}
              >
                Build Index with AI →
              </button>
            </motion.div>
          )}

          {step === 'building' && (
            <motion.div
              key="building"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="glass rounded-2xl p-10 border border-indigo-500/20">
                {/* Spinning rings */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 spin-slow" />
                  <div className="absolute inset-2 rounded-full border-2 border-violet-500/30" style={{ animation: 'spin-slow 5s linear infinite reverse' }} />
                  <div className="absolute inset-4 rounded-full border border-cyan-500/40 spin-slow" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-6">Building your index...</h3>

                <div className="space-y-3 text-left">
                  {BUILDING_STEPS.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= buildingStep ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                        i < buildingStep ? 'bg-emerald-500 text-white' :
                          i === buildingStep ? 'bg-indigo-500 text-white pulse-dot' :
                            'bg-white/5 text-gray-600'
                      )}>
                        {i < buildingStep ? '✓' : i + 1}
                      </span>
                      <span className={i <= buildingStep ? 'text-gray-300' : 'text-gray-600'}>{s}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <IndexResult result={result} riskLevel={risk} onRebuild={() => { setStep('input'); setResult(null); }} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const FACTOR_META: { key: keyof FactorVector; label: string; desc: string; color: string }[] = [
  { key: 'instFlow',  label: 'Institutional Flow',  desc: 'ETF net-flow momentum',      color: '#f59e0b' },
  { key: 'momentum',  label: 'Momentum',             desc: 'Vs sector-peer returns',     color: '#6366f1' },
  { key: 'liquidity', label: 'Liquidity',            desc: 'Volume / market cap ratio',  color: '#06b6d4' },
  { key: 'sentiment', label: 'Sentiment',            desc: 'News attention density',     color: '#8b5cf6' },
  { key: 'sizeRank',  label: 'Growth Potential',     desc: 'Within-sector size rank',    color: '#10b981' },
];

function FactorVectorPanel({ fv }: { fv: FactorVector }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-indigo-500/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">⚖️</span>
        <h3 className="font-bold text-white">Factor Emphasis</h3>
        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI Extracted</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">How the thesis was translated into a quantitative factor vector. Weights drive token scoring — no LLM token selection.</p>
      <div className="space-y-3">
        {FACTOR_META.map(({ key, label, desc, color }) => {
          const pct = Math.round(fv[key] * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-semibold text-white">{label}</span>
                  <span className="text-xs text-gray-600 ml-2">{desc}</span>
                </div>
                <span className="text-sm font-bold text-white">{pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function AttributionPanel({ attr }: { attr: BrinsonAttribution }) {
  const activeColor = attr.totalActiveReturn >= 0 ? 'text-emerald-400' : 'text-red-400';
  const rows = [
    { label: 'Portfolio Return (7d)',   value: attr.portfolioReturn,    color: 'text-white' },
    { label: 'Benchmark Return (7d)',   value: attr.benchmarkReturn,    color: 'text-gray-400', note: '60% BTC · 40% ETH' },
    { label: 'Allocation Effect',       value: attr.allocationEffect,   color: attr.allocationEffect  >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Selection Effect',        value: attr.selectionEffect,    color: attr.selectionEffect   >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Interaction Effect',      value: attr.interactionEffect,  color: attr.interactionEffect >= 0 ? 'text-emerald-400' : 'text-red-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass rounded-2xl p-6 border border-cyan-500/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📐</span>
        <h3 className="font-bold text-white">Brinson Attribution</h3>
        <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">7d · Live Data</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">Return decomposition against 60/40 BTC/ETH benchmark using real SoSoValue 7-day returns.</p>

      <div className="space-y-2.5 mb-4">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-400">{row.label}</span>
              {row.note && <span className="text-xs text-gray-600 ml-1.5">{row.note}</span>}
            </div>
            <span className={cn('font-bold font-mono', row.color)}>
              {row.value >= 0 ? '+' : ''}{row.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Active Return</div>
          <div className="text-xs text-gray-600 mt-0.5">Primary factor: {attr.topContributingFactor} ({attr.topContributingFactorPct}%)</div>
        </div>
        <div className={cn('text-2xl font-black font-mono', activeColor)}>
          {attr.totalActiveReturn >= 0 ? '+' : ''}{attr.totalActiveReturn.toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
}

function truncateTxHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

interface PublishResult {
  id: string;
  methodologyHash: string;
  source: 'live' | 'mock';
  savedAt: string;
}

function IndexResult({
  result,
  riskLevel,
  onRebuild,
}: {
  result: BuildIndexResponse;
  riskLevel: string;
  onRebuild: () => void;
}) {
  const { index, reasoning, warnings, backtest } = result;
  const { address, isConnected } = useAccount();

  const [execState, setExecState] = useState<'idle' | 'executing' | 'done'>('idle');
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [execError, setExecError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const [publishState, setPublishState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState('');

  async function handlePublish() {
    if (!isConnected || !address) return;
    setPublishState('saving');
    setPublishError('');
    try {
      const res = await fetch('/api/indexes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, reasoning, warnings, backtest, walletAddress: address, riskLevel, factorVector: result.factorVector }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Publish failed');
      setPublishResult(await res.json());
      setPublishState('done');
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
      setPublishState('idle');
    }
  }

  async function handleExecute() {
    setExecState('executing');
    setExecError('');
    try {
      const orders = index.constituents.map(token => ({
        market: `${token.symbol}-USDC`,
        symbol: token.symbol,
        notional: (token.weight / 100) * 10000,
        weight: token.weight,
      }));
      const res = await fetch('/api/sodex/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Execution failed');
      setExecResult(await res.json());
      setExecState('done');
    } catch (err) {
      setExecError(err instanceof Error ? err.message : 'Execution failed');
      setExecState('idle');
    }
  }

  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header card */}
      <div className="glass rounded-2xl p-6 border border-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-white">{index.name}</h2>
              <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{index.ticker}</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xl">{index.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {index.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <button
              onClick={onRebuild}
              className="px-4 py-2 rounded-lg glass border border-white/10 hover:border-white/20 text-sm font-medium text-gray-300 hover:text-white transition-all"
            >
              ← Rebuild
            </button>

            {publishState === 'done' && publishResult ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                ✓ Published
              </div>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!isConnected || publishState === 'saving'}
                title={!isConnected ? 'Connect wallet to publish' : undefined}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold text-white transition-all',
                  isConnected && publishState !== 'saving'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                )}
              >
                {publishState === 'saving' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Saving...
                  </span>
                ) : isConnected ? 'Publish Index' : 'Connect Wallet to Publish'}
              </button>
            )}
          </div>
        </div>

        {/* Performance row */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mt-6 pt-5 border-t border-white/5">
          {[
            { label: '1D', value: index.performance.day1 },
            { label: '7D', value: index.performance.day7 },
            { label: '30D', value: index.performance.day30 },
            { label: '90D', value: index.performance.day90 },
            { label: 'Sharpe', value: index.performance.sharpeRatio, noPercent: true },
            { label: 'Max DD', value: index.performance.maxDrawdown },
            { label: 'Volatility', value: index.performance.volatility, noPercent: true },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className={cn(
                'text-base font-black',
                m.noPercent ? 'text-gray-300' : (m.value || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {m.noPercent ? m.value?.toFixed(2) : formatPercent(m.value || 0)}
              </div>
              <div className="text-xs text-gray-600">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Constituents */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Index Constituents</h3>
          <div className="space-y-3">
            {index.constituents.map((token, i) => (
              <motion.div
                key={token.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
              >
                {/* Weight bar */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={getCategoryColor(token.category)}
                      strokeWidth="3"
                      strokeDasharray={`${token.weight * 0.942} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {token.weight}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{token.symbol}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatCurrency(token.price)}</div>
                      <div className={cn('text-xs', token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {formatPercent(token.change24h)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{token.rationale}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Backtest chart */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-1">90-Day Backtest</h3>
          <p className="text-xs text-gray-500 mb-4">Simulated performance vs BTC & ETH benchmarks · $1,000 initial</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={backtest} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="indexGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4b5563', fontSize: 10 }}
                tickFormatter={v => v.slice(5)}
                interval={14}
              />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} tickFormatter={v => `$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(v, name) => [`$${(v as number).toFixed(2)}`, name as string]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="indexValue" name={index.ticker} stroke="#6366f1" fill="url(#indexGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="btcValue" name="BTC" stroke="#f59e0b" fill="url(#btcGrad)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="ethValue" name="ETH" stroke="#06b6d4" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Model + Attribution — side by side */}
      {(result.factorVector || result.attribution) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {result.factorVector && <FactorVectorPanel fv={result.factorVector} />}
          {result.attribution  && <AttributionPanel  attr={result.attribution} />}
        </div>
      )}

      {/* AI Methodology */}
      <div className="glass rounded-2xl p-6 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="font-bold text-white">Factor Model Methodology</h3>
          <span className="text-xs px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/30">Quantitative · Claude Sonnet 4.6</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{reasoning}</p>

        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Risk Warnings</div>
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-300/80">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                {w}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish result — methodology hash */}
      {publishState === 'done' && publishResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✅</span>
            <h3 className="font-bold text-white">Index Published</h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-md border font-semibold',
              publishResult.source === 'live'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            )}>
              {publishResult.source === 'live' ? '● Saved to DB' : '○ Demo mode'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Methodology Hash (keccak256)</div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/5">
                <code className="font-mono text-xs text-cyan-400 flex-1 break-all">
                  {publishResult.methodologyHash}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publishResult.methodologyHash).catch(() => {});
                    setCopied('hash');
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors text-sm"
                >
                  {copied === 'hash' ? '✓' : '⎘'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1.5">
                Deterministic fingerprint of your index methodology. Anyone can verify it by recomputing from the thesis + constituent weights.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
              <span>Published {new Date(publishResult.savedAt).toLocaleString()}</span>
              <a href="/indexes" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                View in Marketplace →
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {publishError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {publishError}
        </div>
      )}

      {/* Execution Panel */}
      <div className="glass rounded-2xl p-6 border border-cyan-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="font-bold text-white">SoDEX Execution</h3>
            {execResult && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-md border font-semibold',
                execResult.source === 'live'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              )}>
                {execResult.source === 'live' ? '● LIVE' : '○ DEMO'}
              </span>
            )}
            {execState === 'idle' && !execResult && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Testnet</span>
            )}
          </div>
          {execResult && (
            <span className="text-xs text-gray-500">
              {new Date(execResult.executedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Pre-execution: order preview table */}
        {execState !== 'done' && (
          <>
            <p className="text-xs text-gray-500 mb-4">$10,000 deployment across {index.constituents.length} tokens via SoDEX orderbook</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-2">Token</th>
                    <th className="text-right py-2">Weight</th>
                    <th className="text-right py-2">Notional</th>
                    <th className="text-right py-2">Est. Qty</th>
                    <th className="text-right py-2">Slippage</th>
                  </tr>
                </thead>
                <tbody>
                  {index.constituents.map(token => {
                    const notional = (token.weight / 100) * 10000;
                    const qty = token.price > 0 ? notional / token.price : 0;
                    return (
                      <tr key={token.symbol} className="border-b border-white/3 hover:bg-white/2">
                        <td className="py-2.5 font-mono font-semibold text-white">{token.symbol}</td>
                        <td className="py-2.5 text-right text-gray-400">{token.weight}%</td>
                        <td className="py-2.5 text-right text-gray-300">{formatCurrency(notional)}</td>
                        <td className="py-2.5 text-right text-gray-300">{qty.toFixed(4)}</td>
                        <td className="py-2.5 text-right text-emerald-400">~0.05%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {execError && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {execError}
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={execState === 'executing'}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-bold text-white transition-all',
                execState === 'executing'
                  ? 'bg-cyan-900/50 text-cyan-600 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 glow-cyan hover:scale-[1.01] active:scale-[0.99]'
              )}
            >
              {execState === 'executing' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  Submitting {index.constituents.length} orders to SoDEX...
                </span>
              ) : (
                `Execute ${index.constituents.length} Orders on SoDEX Testnet →`
              )}
            </button>
          </>
        )}

        {/* Post-execution: tx receipt table */}
        {execState === 'done' && execResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-base">✓</span>
              <span className="text-emerald-300 text-sm font-semibold">
                {execResult.orders.length} orders confirmed on SoDEX testnet
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-2">Token</th>
                    <th className="text-right py-2">Notional</th>
                    <th className="text-left py-2 pl-4">Tx Hash</th>
                    <th className="text-right py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {execResult.orders.map(order => (
                    <motion.tr
                      key={order.symbol}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-b border-white/3 hover:bg-white/2 group"
                    >
                      <td className="py-2.5 font-mono font-semibold text-white">{order.symbol}</td>
                      <td className="py-2.5 text-right text-gray-300">{formatCurrency(order.notional)}</td>
                      <td className="py-2.5 pl-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={order.blockExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-cyan-400 hover:text-cyan-300 underline decoration-dotted transition-colors"
                            title={order.txHash}
                          >
                            {truncateTxHash(order.txHash)}
                          </a>
                          <button
                            onClick={() => copyHash(order.txHash)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300 text-xs"
                            title="Copy tx hash"
                          >
                            {copied === order.txHash ? '✓' : '⎘'}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                          Confirmed
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => { setExecState('idle'); setExecResult(null); }}
              className="mt-4 w-full py-2.5 rounded-xl glass border border-white/10 hover:border-white/20 text-xs text-gray-400 hover:text-white transition-all"
            >
              Reset execution
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
