'use client';

import { useRef, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/three/Scene').then(m => ({ default: m.Scene })), { ssr: false });

const SAMPLE_THESES = [
  '"AI tokens with institutional ETF backing..."',
  '"DeFi blue chips with high TVL growth..."',
  '"Layer 2 scaling solutions leading Ethereum..."',
  '"RWA tokenization protocols gaining traction..."',
];

const STATS = [
  { label: 'Indexes Created', value: '2,847', suffix: '' },
  { label: 'Total AUM Tracked', value: '$4.2', suffix: 'B' },
  { label: 'SoSoValue Data Points', value: '1.8', suffix: 'M' },
  { label: 'Avg Backtest Accuracy', value: '94', suffix: '%' },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Three.js Background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Scene variant="hero" />
        </Suspense>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-40 z-0" />

      {/* Radial gradient focal point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-3xl z-0" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-3xl z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-600/6 blur-3xl z-0" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass border border-indigo-500/30 text-sm text-indigo-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 pulse-dot" />
          Powered by SoSoValue API + Claude AI
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.05]"
        >
          Anyone can be an{' '}
          <span className="gradient-text">Index Fund</span>{' '}
          Manager
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed"
        >
          Describe your investment thesis in plain English. IndexForge uses institutional-grade
          SoSoValue data and AI to build, backtest, and publish a weighted on-chain crypto index —
          then execute rebalancing through SoDEX.
        </motion.p>

        {/* Animated thesis examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center gap-2 text-sm text-gray-500 italic"
        >
          <span>Try:</span>
          <TypewriterText texts={SAMPLE_THESES} />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/builder"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-base font-bold text-white transition-all duration-200 glow-indigo hover:scale-105 active:scale-95"
          >
            Build Your Index →
          </Link>
          <Link
            href="/indexes"
            className="px-8 py-4 rounded-xl glass border border-white/10 hover:border-indigo-500/40 text-base font-semibold text-gray-300 hover:text-white transition-all duration-200"
          >
            Browse Marketplace
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl font-black text-white">
                {stat.value}<span className="gradient-text">{stat.suffix}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 flex flex-col items-center pb-8 gap-2"
      >
        <span className="text-xs text-gray-600 uppercase tracking-widest">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-transparent rounded-full"
        />
      </motion.div>
    </section>
  );
}

function TypewriterText({ texts }: { texts: string[] }) {
  return (
    <motion.div className="text-indigo-400">
      {texts.map((text, i) => (
        <motion.span
          key={text}
          initial={{ opacity: 0, display: 'none' }}
          animate={{
            opacity: [0, 1, 1, 0],
            display: ['none', 'inline', 'inline', 'none'],
          }}
          transition={{
            duration: 3.5,
            delay: i * 3.5,
            repeat: Infinity,
            repeatDelay: texts.length * 3.5 - 3.5,
          }}
        >
          {text}
        </motion.span>
      ))}
    </motion.div>
  );
}
