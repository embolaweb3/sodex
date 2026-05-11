'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Describe Your Thesis',
    description: 'Type your investment idea in plain English. "AI tokens with strong ETF inflows" or "DeFi blue chips with institutional backing" — any thesis works.',
    icon: '✍️',
    color: 'from-indigo-600 to-indigo-800',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    number: '02',
    title: 'AI Constructs the Index',
    description: 'Claude AI queries SoSoValue\'s live market data, ETF flows, sector classifications, and SSI indexes to select and weight the best-fit tokens.',
    icon: '🧠',
    color: 'from-violet-600 to-violet-800',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    number: '03',
    title: 'Backtest & Validate',
    description: 'See 30, 90, and 180-day simulated performance vs BTC and ETH benchmarks. Review Sharpe ratio, max drawdown, and volatility metrics.',
    icon: '📊',
    color: 'from-cyan-600 to-cyan-800',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    number: '04',
    title: 'Publish & Execute',
    description: 'Publish your index on-chain with verifiable methodology. Execute rebalancing trades through SoDEX\'s orderbook with slippage preview.',
    icon: '⚡',
    color: 'from-emerald-600 to-emerald-800',
    glow: 'rgba(16,185,129,0.3)',
  },
];

const FEATURES = [
  { icon: '🔗', label: 'SoSoValue API', desc: '9 integrated endpoints' },
  { icon: '⚖️', label: 'SoDEX Execution', desc: 'EIP-712 signed orders' },
  { icon: '🤖', label: 'Claude AI', desc: 'Sonnet 4.6 reasoning' },
  { icon: '📡', label: 'Live Data', desc: 'Real-time market feeds' },
  { icon: '🛡️', label: 'Risk Controls', desc: 'Concentration caps + volatility gates' },
  { icon: '🌐', label: 'On-Chain', desc: 'Verifiable methodology hash' },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full glass border border-violet-500/20 text-xs text-violet-400 uppercase tracking-widest">
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl font-black">
            From thesis to{' '}
            <span className="gradient-text">on-chain index</span>
            {' '}in minutes
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            IndexForge replaces weeks of research and manual rebalancing with an AI-powered pipeline
            backed by institutional-grade market intelligence.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative"
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-indigo-500/50 to-transparent z-0" style={{ width: 'calc(100% - 2rem)' }} />
              )}

              <div className="glass rounded-2xl p-6 h-full border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <div className="text-xs font-mono text-gray-600 mb-1">{step.number}</div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <div className="text-center mb-6">
            <span className="text-sm text-gray-500 uppercase tracking-widest">Powered by</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="text-center"
              >
                <div className="text-2xl mb-1">{feat.icon}</div>
                <div className="text-xs font-semibold text-white">{feat.label}</div>
                <div className="text-xs text-gray-500">{feat.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
