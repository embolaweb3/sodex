import { NextResponse } from 'next/server';
import { getMarketData, getETFData, getNewsList, getSSIList } from '@/lib/sosovalue';

export async function GET() {
  const [marketRes, etfRes, newsRes, ssiRes] = await Promise.allSettled([
    getMarketData(),
    getETFData(),
    getNewsList(undefined, 10),
    getSSIList(),
  ]);

  const market = marketRes.status === 'fulfilled' ? marketRes.value : { data: [], source: 'mock' as const, fetchedAt: new Date().toISOString() };
  const etf    = etfRes.status    === 'fulfilled' ? etfRes.value    : { data: [], source: 'mock' as const, fetchedAt: new Date().toISOString() };
  const news   = newsRes.status   === 'fulfilled' ? newsRes.value   : { data: [], source: 'mock' as const, fetchedAt: new Date().toISOString() };
  const ssi    = ssiRes.status    === 'fulfilled' ? ssiRes.value    : { data: [], source: 'mock' as const, fetchedAt: new Date().toISOString() };

  // Overall source is 'live' only when at least market data came from the real API
  const source = market.source === 'live' ? 'live' : 'mock';

  return NextResponse.json({
    market: market.data,
    etf: etf.data,
    news: news.data,
    ssi: ssi.data,
    source,
    fetchedAt: market.fetchedAt,
  });
}
