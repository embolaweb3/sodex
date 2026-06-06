import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/layout/Nav';

export const metadata: Metadata = {
  title: 'Prism — Build On-Chain Thematic Indexes with AI',
  description: 'Describe your investment thesis. AI builds a weighted crypto index. Backtest it. Publish it on-chain. Execute through SoDEX.',
  keywords: ['crypto index', 'DeFi', 'SoSoValue', 'AI investing', 'on-chain', 'thematic ETF', 'Prism'],
  openGraph: {
    title: 'Prism',
    description: 'Anyone can be an index fund manager.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#030712] text-gray-100">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
