import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase, hasSupabase } from '@/lib/supabase';
import { getMarketData, getETFData, getNewsList } from '@/lib/sosovalue';
import { computeFactorScores } from '@/lib/factor-engine';
import type { FactorVector } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SEED_FACTOR_VECTORS: Record<string, FactorVector> = {
  'ai-momentum':        { instFlow: 0.15, momentum: 0.40, liquidity: 0.10, sentiment: 0.25, sizeRank: 0.10 },
  'defi-blue-chip':     { instFlow: 0.20, momentum: 0.20, liquidity: 0.35, sentiment: 0.15, sizeRank: 0.10 },
  'rwa-frontier':       { instFlow: 0.45, momentum: 0.15, liquidity: 0.20, sentiment: 0.10, sizeRank: 0.10 },
  'l2-ecosystem':       { instFlow: 0.15, momentum: 0.30, liquidity: 0.25, sentiment: 0.20, sizeRank: 0.10 },
  'institutional-flow': { instFlow: 0.55, momentum: 0.20, liquidity: 0.15, sentiment: 0.10, sizeRank: 0.00 },
  'gaming-metaverse':   { instFlow: 0.10, momentum: 0.30, liquidity: 0.20, sentiment: 0.30, sizeRank: 0.10 },
};

const SEED_CONSTITUENTS: Record<string, Array<{ symbol: string; weight: number }>> = {
  'ai-momentum':        [{ symbol: 'TAO', weight: 35 }, { symbol: 'RENDER', weight: 30 }, { symbol: 'FET', weight: 25 }],
  'defi-blue-chip':     [{ symbol: 'UNI', weight: 30 }, { symbol: 'AAVE', weight: 25 }, { symbol: 'MKR', weight: 20 }, { symbol: 'PENDLE', weight: 15 }],
  'rwa-frontier':       [{ symbol: 'ONDO', weight: 40 }, { symbol: 'LINK', weight: 35 }],
  'l2-ecosystem':       [{ symbol: 'ARB', weight: 40 }, { symbol: 'OP', weight: 35 }],
  'institutional-flow': [{ symbol: 'BTC', weight: 55 }, { symbol: 'ETH', weight: 35 }],
  'gaming-metaverse':   [{ symbol: 'IMX', weight: 50 }],
};

const SEED_NAMES: Record<string, string> = {
  'ai-momentum':        'AI Momentum Index',
  'defi-blue-chip':     'DeFi Blue Chip',
  'rwa-frontier':       'RWA Frontier',
  'l2-ecosystem':       'L2 Ecosystem Fund',
  'institutional-flow': 'ETF Flow Tracker',
  'gaming-metaverse':   'GameFi & Metaverse',
};

const SEED_THESES: Record<string, string> = {
  'ai-momentum':        'AI & ML tokens with growing institutional ETF inflows and strong developer activity',
  'defi-blue-chip':     'Established DeFi protocols with proven TVL, revenue, and sustained institutional interest',
  'rwa-frontier':       'Real World Asset tokenization protocols leading the institutional on-chain finance wave',
  'l2-ecosystem':       'Layer 2 scaling solutions leading Ethereum ecosystem growth with strong developer adoption',
  'institutional-flow': 'Tokens with the strongest positive institutional ETF inflows per SoSoValue data',
  'gaming-metaverse':   'Gaming and metaverse tokens positioned for the next wave of blockchain gaming adoption',
};

const FACTOR_LABELS: Record<keyof FactorVector, string> = {
  instFlow: 'Institutional Flow',
  momentum: 'Momentum',
  liquidity: 'Liquidity',
  sentiment: 'Sentiment',
  sizeRank:  'Growth Potential',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let factorVector: FactorVector | null = SEED_FACTOR_VECTORS[id] ?? null;
    let constituents: Array<{ symbol: string; weight: number }> = SEED_CONSTITUENTS[id] ?? [];
    let indexName  = SEED_NAMES[id] ?? id;
    let indexThesis = SEED_THESES[id] ?? '';

    // User-built index overrides seed
    if (hasSupabase() && supabase) {
      const { data } = await supabase
        .from('indexes')
        .select('name, thesis, factor_vector, constituents')
        .eq('id', id)
        .single();

      if (data?.factor_vector) {
        factorVector  = data.factor_vector as FactorVector;
        indexName     = data.name as string;
        indexThesis   = (data.thesis as string) ?? '';
        constituents  = (data.constituents as Array<{ symbol: string; weight: number }>) ?? [];
      }
    }

    if (!factorVector || constituents.length === 0) {
      return NextResponse.json({ error: 'Index not found or no factor data' }, { status: 404 });
    }

    // Compute current factor scores from live data
    const [marketRes, etfRes, newsRes] = await Promise.allSettled([
      getMarketData(),
      getETFData(),
      getNewsList(undefined, 20),
    ]);
    const marketData = marketRes.status === 'fulfilled' ? marketRes.value.data : [];
    const etfData    = etfRes.status    === 'fulfilled' ? etfRes.value.data    : [];
    const newsData   = newsRes.status   === 'fulfilled' ? newsRes.value.data   : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoreMap = computeFactorScores(marketData as any, etfData as any, newsData as any);

    // Weighted average across constituents that have scores
    const found = constituents.filter(c => scoreMap.has(c.symbol));
    if (found.length === 0) {
      return NextResponse.json({ error: 'No factor data for index constituents' }, { status: 503 });
    }

    const validWeight = found.reduce((s, c) => s + c.weight, 0);
    const avg = { instFlow: 0, momentum: 0, liquidity: 0, sentiment: 0, sizeRank: 0 };
    for (const c of found) {
      const s = scoreMap.get(c.symbol)!;
      const w = c.weight / validWeight;
      (Object.keys(avg) as (keyof typeof avg)[]).forEach(k => { avg[k] += s[k] * w; });
    }
    (Object.keys(avg) as (keyof typeof avg)[]).forEach(k => { avg[k] = Math.round(avg[k] * 10) / 10; });

    // Analyze each factor
    type Level = 'strong' | 'moderate' | 'weak';
    const factors = (Object.keys(factorVector) as (keyof FactorVector)[]).map(k => {
      const thesisWeight  = factorVector![k];
      const currentScore  = avg[k];
      const level: Level  = currentScore >= 60 ? 'strong' : currentScore >= 40 ? 'moderate' : 'weak';
      return { key: k, name: FACTOR_LABELS[k], thesisWeight, currentScore, level };
    }).sort((a, b) => b.thesisWeight - a.thesisWeight);

    // Alerts: emphasized factor with weak current score
    const alerts: string[] = [];
    for (const f of factors) {
      if (f.thesisWeight >= 0.20 && f.currentScore < 40) {
        alerts.push(
          `${f.name} score (${f.currentScore}/100) is weak for a thesis that weights it at ${Math.round(f.thesisWeight * 100)}%`
        );
      }
    }

    const status: 'healthy' | 'warning' | 'degraded' =
      alerts.length === 0 ? 'healthy' :
      alerts.length >= 2  ? 'degraded' : 'warning';

    // Index Doctor — Claude explains the alerts in plain English
    let doctorNote: string | null = null;
    if (alerts.length > 0 && process.env.ANTHROPIC_API_KEY) {
      try {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `You are the Index Doctor for Prism, a quantitative crypto index platform powered by SoSoValue data.

Index: ${indexName}
Thesis: ${indexThesis}
Factor alerts: ${alerts.join('; ')}

Write 2-3 sentences in plain English explaining what these alerts mean for this index's investment thesis. Be specific about the underperforming factor and its real-world implication. End with one concrete, actionable recommendation.`,
          }],
        });
        const block = msg.content[0];
        if (block.type === 'text') doctorNote = block.text;
      } catch {
        // Silently fail — page still renders without doctor note
      }
    }

    return NextResponse.json({
      indexId:     id,
      indexName,
      status,
      factors,
      alerts,
      doctorNote,
      constituents: found.map(c => c.symbol),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Health check failed' },
      { status: 500 }
    );
  }
}
