import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getMarketData, getETFData, getNewsList } from '@/lib/sosovalue';
import { computeFactorScores, constructFromFactors } from '@/lib/factor-engine';
import { brinsonAttribution, factorCorrelatedBacktest, calculatePerformance, generateAttributionNarration } from '@/lib/attribution';
import type { BuildIndexRequest, CryptoIndex, IndexToken, FactorVector } from '@/types';
import { generateId } from '@/lib/utils';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body: BuildIndexRequest = await req.json();
    const { thesis, riskLevel = 'balanced', maxConstituents = 8 } = body;

    if (!thesis || thesis.trim().length < 10) {
      return NextResponse.json({ error: 'Thesis must be at least 10 characters' }, { status: 400 });
    }

    // Step 1: fetch all SoSoValue data in parallel
    const [marketRes, etfRes, newsRes] = await Promise.allSettled([
      getMarketData(),
      getETFData(),
      getNewsList(undefined, 20),
    ]);

    const marketData = marketRes.status === 'fulfilled' ? marketRes.value.data : [];
    const etfData    = etfRes.status    === 'fulfilled' ? etfRes.value.data    : [];
    const newsData   = newsRes.status   === 'fulfilled' ? newsRes.value.data   : [];

    if (marketData.length === 0) {
      return NextResponse.json({ error: 'Market data unavailable' }, { status: 503 });
    }

    // Step 2: compute factor scores (pure math, no LLM)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const factorScores = computeFactorScores(marketData as any, etfData as any, newsData as any);

    // Step 3: AI interprets thesis → factor emphasis vector + metadata only
    // The LLM never touches token weights — it only translates the thesis intent into a numeric vector
    const systemPrompt = `You are Prism's thesis interpreter. Extract the quantitative factor emphasis from an investment thesis.

Return ONLY valid JSON matching this exact structure — no markdown, no explanation:
{
  "factorVector": {
    "instFlow": 0.0,
    "momentum": 0.0,
    "liquidity": 0.0,
    "sentiment": 0.0,
    "sizeRank": 0.0
  },
  "name": "3-5 word descriptive index name",
  "ticker": "4-6 char uppercase ticker like AIMDX",
  "description": "2-3 sentence description of this index strategy",
  "sectorFilter": null,
  "tags": ["tag1", "tag2", "tag3"],
  "warnings": ["risk warning 1", "risk warning 2"]
}

factorVector values must sum to exactly 1.0.
sectorFilter: set to one of "L1","L2","DeFi","AI","RWA","Gaming","Infrastructure" only when the thesis is unambiguously single-sector. Otherwise null.

Factor inference:
- "institutional", "ETF flows", "smart money", "fund flows" → high instFlow (0.35–0.50)
- "momentum", "trending", "breakout", "performance" → high momentum (0.35–0.50)
- "liquid", "blue chip", "high volume", "established" → high liquidity (0.30–0.45)
- "narrative", "hype", "attention", "media coverage" → high sentiment (0.25–0.40)
- "emerging", "small cap", "growth", "early stage" → high sizeRank (0.30–0.45)
- "stable", "proven", "large cap" → low sizeRank (0.05–0.15)
- Generic/balanced thesis → distribute roughly equally`;

    const userPrompt = `Thesis: "${thesis}"
Risk level: ${riskLevel}
Max constituents: ${maxConstituents}
Available sectors: L1, L2, DeFi, AI, RWA, Gaming, Infrastructure`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from AI');

    let parsed: {
      factorVector: FactorVector;
      name: string;
      ticker: string;
      description: string;
      sectorFilter: string | null;
      tags: string[];
      warnings: string[];
    };

    try {
      const cleaned = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('AI returned invalid JSON');
    }

    // Normalize factor vector to sum exactly to 1.0
    const fvRaw = parsed.factorVector;
    const fvSum = Object.values(fvRaw).reduce((a, b) => a + b, 0);
    const factorVector: FactorVector = fvSum > 0.01 ? {
      instFlow:  fvRaw.instFlow  / fvSum,
      momentum:  fvRaw.momentum  / fvSum,
      liquidity: fvRaw.liquidity / fvSum,
      sentiment: fvRaw.sentiment / fvSum,
      sizeRank:  fvRaw.sizeRank  / fvSum,
    } : { instFlow: 0.2, momentum: 0.2, liquidity: 0.2, sentiment: 0.2, sizeRank: 0.2 };

    // Step 4: factor engine constructs weights (pure math — LLM is done)
    const maxN = riskLevel === 'conservative' ? 5
      : riskLevel === 'balanced' ? Math.min(maxConstituents, 7)
      : Math.min(maxConstituents, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoredTokens = constructFromFactors(factorVector, factorScores, marketData as any, riskLevel, maxN, parsed.sectorFilter);

    if (scoredTokens.length === 0) {
      throw new Error('Factor model could not select tokens — insufficient market data');
    }

    // Step 5: Brinson attribution using real 7-day returns from SoSoValue
    const btcChange7d = marketData.find(t => t.symbol === 'BTC')?.change7d ?? 0;
    const ethChange7d = marketData.find(t => t.symbol === 'ETH')?.change7d ?? 0;

    const attribution = brinsonAttribution(
      scoredTokens.map(t => ({
        symbol: t.symbol, weight: t.weight, change7d: t.change7d, category: t.category,
      })),
      btcChange7d,
      ethChange7d,
      factorVector,
    );

    // Step 6: factor-correlated backtest + performance metrics
    const backtest = factorCorrelatedBacktest(
      scoredTokens.map(t => ({ symbol: t.symbol, weight: t.weight, factorScore: t.factorScore })),
      90,
    );
    const performance = calculatePerformance(backtest);

    // Step 7: programmatic narration — grounded in the attribution numbers, no hallucination
    const reasoning = generateAttributionNarration(factorVector, attribution, scoredTokens.map(t => t.symbol));

    const indexTokens: IndexToken[] = scoredTokens.map(t => ({
      symbol:     t.symbol,
      name:       t.name,
      weight:     t.weight,
      price:      t.price,
      change24h:  t.change24h,
      marketCap:  t.marketCap,
      volume24h:  t.volume24h,
      rationale:  t.rationale,
      category:   t.category,
      factorScore: t.factorScore,
    }));

    const index: CryptoIndex = {
      id:                 generateId(),
      name:               parsed.name,
      ticker:             parsed.ticker,
      thesis,
      description:        parsed.description,
      constituents:       indexTokens,
      createdAt:          new Date().toISOString(),
      updatedAt:          new Date().toISOString(),
      performance,
      category:           scoredTokens[0]?.category || 'Other',
      tags:               parsed.tags || [],
      followers:          0,
      isPublic:           false,
      rebalanceFrequency: 'monthly',
    };

    return NextResponse.json({ index, reasoning, warnings: parsed.warnings || [], backtest, factorVector, attribution });
  } catch (error) {
    console.error('Build index error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build index' },
      { status: 500 },
    );
  }
}
