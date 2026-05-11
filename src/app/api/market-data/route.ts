import { NextResponse } from 'next/server';
import { getMarketData, getETFData, getNewsList, getSSIList } from '@/lib/sosovalue';

export async function GET() {
  try {
    const [marketRes, etfRes, newsRes, ssiRes] = await Promise.allSettled([
      getMarketData(),
      getETFData(),
      getNewsList(undefined, 10),
      getSSIList(),
    ]);

    return NextResponse.json({
      market: marketRes.status === 'fulfilled' ? marketRes.value.data : [],
      etf: etfRes.status === 'fulfilled' ? etfRes.value.data : [],
      news: newsRes.status === 'fulfilled' ? newsRes.value.data : [],
      ssi: ssiRes.status === 'fulfilled' ? ssiRes.value.data : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
