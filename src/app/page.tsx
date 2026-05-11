import { Hero } from '@/components/landing/Hero';
import { TickerStrip } from '@/components/landing/TickerStrip';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeaturedIndexes } from '@/components/landing/FeaturedIndexes';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-[#030712]">
      <Hero />
      <TickerStrip />
      <HowItWorks />
      <FeaturedIndexes />

      {/* Final CTA */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-4xl font-black mb-4">
            Build your first index <span className="gradient-text">in 60 seconds</span>
          </div>
          <p className="text-gray-400 mb-8">
            No financial expertise required. SoSoValue data + AI does the heavy lifting.
          </p>
          <Link
            href="/builder"
            className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-lg font-bold text-white transition-all duration-200 glow-indigo hover:scale-105"
          >
            Start Building Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-sm text-gray-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold text-gray-500">Index<span className="text-indigo-500">Forge</span></div>
          <div>Built for SoSoValue Buildathon 2026 · Powered by SoSoValue API + SoDEX + Claude AI</div>
          <div className="flex gap-4">
            <Link href="/builder" className="hover:text-gray-400 transition-colors">Builder</Link>
            <Link href="/indexes" className="hover:text-gray-400 transition-colors">Marketplace</Link>
            <Link href="/app" className="hover:text-gray-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
