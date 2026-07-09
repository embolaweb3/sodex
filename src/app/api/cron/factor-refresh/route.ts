import { NextRequest, NextResponse } from 'next/server';
import { getMarketData, getETFData, getNewsList } from '@/lib/sosovalue';
import { computeFactorScores } from '@/lib/factor-engine';
import { createServerClient, hasSupabase } from '@/lib/supabase';

/**
 * Nightly factor-score refresh cron.
 *
 * Vercel calls this at 01:00 UTC daily via vercel.json cron config.
 * It sends: Authorization: Bearer ${CRON_SECRET}
 *
 * What it does:
 *   1. Pull live SoSoValue data (market, ETF, news)
 *   2. Compute 5-factor scores for every tracked token
 *   3. Upsert one row per (symbol, date) into factor_scores table
 *
 * The factor_scores table is the compounding moat — every day adds a new
 * row of institutional-grade quantitative data for each token.
 */
export async function GET(req: NextRequest) {
  // Validate cron secret (Vercel sends Authorization: Bearer <secret>)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Step 1: fetch all SoSoValue data in parallel
    const [marketRes, etfRes, newsRes] = await Promise.allSettled([
      getMarketData(),
      getETFData(),
      getNewsList(undefined, 30),
    ]);

    const marketData = marketRes.status === 'fulfilled' ? marketRes.value.data : [];
    const etfData    = etfRes.status    === 'fulfilled' ? etfRes.value.data    : [];
    const newsData   = newsRes.status   === 'fulfilled' ? newsRes.value.data   : [];

    if (marketData.length === 0) {
      return NextResponse.json({ error: 'Market data unavailable — cron aborted' }, { status: 503 });
    }

    // Step 2: compute factor scores (pure math)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const factorScores = computeFactorScores(marketData as any, etfData as any, newsData as any);

    // Compute raw ETF flow ratios for audit trail
    const last7 = etfData.slice(-7);
    const btcFlow7d = last7.reduce((s, d) => s + d.btcNetFlow, 0);
    const btcAum    = etfData[etfData.length - 1]?.btcAum || 1e10;
    const ethFlow7d = last7.reduce((s, d) => s + d.ethNetFlow, 0);
    const ethAum    = etfData[etfData.length - 1]?.ethAum || 1e9;
    const rawBtcRatio = btcFlow7d / btcAum;
    const rawEthRatio = ethFlow7d / Math.max(ethAum, 1);

    // Step 3: build upsert rows
    const rows = marketData
      .filter(t => factorScores.has(t.symbol))
      .map(t => {
        const f = factorScores.get(t.symbol)!;
        return {
          symbol:            t.symbol,
          date:              today,
          inst_flow:         f.instFlow,
          momentum:          f.momentum,
          liquidity:         f.liquidity,
          sentiment:         f.sentiment,
          size_rank:         f.sizeRank,
          sector:            t.category,
          raw_btc_flow_ratio: rawBtcRatio,
          raw_eth_flow_ratio: rawEthRatio,
        };
      });

    // Step 4: persist to Supabase
    if (!hasSupabase()) {
      // No DB — return the computed scores so the cron is still useful in dev
      return NextResponse.json({
        mode:     'no-db',
        date:     today,
        computed: rows.length,
        symbols:  rows.map(r => r.symbol),
        sample:   rows[0] ?? null,
      });
    }

    const db = createServerClient();
    if (!db) {
      return NextResponse.json({ error: 'DB client unavailable' }, { status: 503 });
    }

    const { error, count } = await db
      .from('factor_scores')
      .upsert(rows, { onConflict: 'symbol,date', count: 'exact' });

    if (error) {
      console.error('[cron/factor-refresh] DB upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[cron/factor-refresh] Upserted ${count} rows for ${today}`);

    return NextResponse.json({
      ok:      true,
      date:    today,
      upserted: count ?? rows.length,
      symbols: rows.map(r => r.symbol),
      source:  marketRes.status === 'fulfilled' ? marketRes.value.source : 'unknown',
    });
  } catch (err) {
    console.error('[cron/factor-refresh] Fatal:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron failed' },
      { status: 500 },
    );
  }
}
