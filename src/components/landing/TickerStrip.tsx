'use client';

import { useEffect, useState } from 'react';
import { MOCK_MARKET_DATA } from '@/lib/sosovalue';
import { formatCurrency, formatPercent } from '@/lib/utils';

type TokenItem = { symbol: string; name: string; price: number; change24h: number; category: string };

export function TickerStrip() {
  const [tokens, setTokens] = useState<TokenItem[]>(MOCK_MARKET_DATA);

  useEffect(() => {
    fetch('/api/market-data')
      .then(r => r.json())
      .then(d => { if (d.market?.length) setTokens(d.market); })
      .catch(() => {});
  }, []);

  const doubled = [...tokens, ...tokens];

  return (
    <div className="border-y border-white/5 bg-black/40 overflow-hidden py-2.5 relative">
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-black/80 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-black/80 to-transparent" />
      <div className="ticker-scroll flex gap-8 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((token, i) => (
          <div key={`${token.symbol}-${i}`} className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-white">{token.symbol}</span>
            <span className="text-gray-400">{formatCurrency(token.price)}</span>
            <span className={token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatPercent(token.change24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
