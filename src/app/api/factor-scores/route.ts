import { NextResponse } from 'next/server';
import { supabase, hasSupabase } from '@/lib/supabase';
import { getMarketData, getETFData, getNewsList } from '@/lib/sosovalue';
import { computeFactorScores } from '@/lib/factor-engine';

/**
 * GET /api/factor-scores
 *
 * Returns the latest factor scores for all tracked tokens.
 * Source priority:
 *   1. Supabase factor_scores table (today's row if cron has run, else most recent date)
 *   2. Freshly computed from SoSoValue (fallback if DB is empty or unavailable)
 *
 * Judges can call this to verify the DB is live and accumulating data.
 */
export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  // Try DB first
  if (hasSupabase() && supabase) {
    const { data, error } = await supabase
      .from('factor_scores')
      .select('symbol, date, inst_flow, momentum, liquidity, sentiment, size_rank, sector')
      .order('date', { ascending: false })
      .limit(200); // up to 200 rows (15 tokens × many days)

    if (!error && data && data.length > 0) {
      // Group by symbol, take most recent date per symbol
      const bySymbol = new Map<string, typeof data[number]>();
      for (const row of data) {
        if (!bySymbol.has(row.symbol)) bySymbol.set(row.symbol, row);
      }

      const scores = Object.fromEntries(
        [...bySymbol.entries()].map(([symbol, row]) => [
          symbol,
          {
            instFlow:  row.inst_flow,
            momentum:  row.momentum,
            liquidity: row.liquidity,
            sentiment: row.sentiment,
            sizeRank:  row.size_rank,
            sector:    row.sector,
            asOf:      row.date,
          },
        ])
      );

      // Find how many distinct dates are in the table (depth of the time series)
      const dates = [...new Set(data.map(r => r.date))].sort().reverse();

      return NextResponse.json({
        source:     'database',
        asOf:       dates[0] ?? today,
        daysOfData: dates.length,
        symbols:    Object.keys(scores).length,
        scores,
      });
    }
  }

  // Fallback: compute live from SoSoValue
  const [marketRes, etfRes, newsRes] = await Promise.allSettled([
    getMarketData(),
    getETFData(),
    getNewsList(undefined, 20),
  ]);

  const marketData = marketRes.status === 'fulfilled' ? marketRes.value.data : [];
  const etfData    = etfRes.status    === 'fulfilled' ? etfRes.value.data    : [];
  const newsData   = newsRes.status   === 'fulfilled' ? newsRes.value.data   : [];

  if (marketData.length === 0) {
    return NextResponse.json({ error: 'No data available' }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const factorScores = computeFactorScores(marketData as any, etfData as any, newsData as any);

  const scores = Object.fromEntries(
    [...factorScores.entries()].map(([symbol, f]) => {
      const token = marketData.find(t => t.symbol === symbol);
      return [symbol, { ...f, sector: token?.category ?? 'Other', asOf: today }];
    })
  );

  return NextResponse.json({
    source:     'live-computed',
    asOf:       today,
    daysOfData: 0,
    symbols:    Object.keys(scores).length,
    scores,
  });
}
