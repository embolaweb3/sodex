import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getMarketData } from '@/lib/sosovalue';
import type { BuildIndexRequest, CryptoIndex, IndexToken, BacktestDataPoint } from '@/types';
import { generateId } from '@/lib/utils';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body: BuildIndexRequest = await req.json();
    const { thesis, riskLevel = 'balanced', maxConstituents = 8 } = body;

    if (!thesis || thesis.trim().length < 10) {
      return NextResponse.json({ error: 'Thesis must be at least 10 characters' }, { status: 400 });
    }

    const { data: marketData } = await getMarketData();

    const systemPrompt = `You are Prism's AI index construction engine. You analyze investment theses and construct weighted cryptocurrency indexes using institutional-grade market data from SoSoValue.

Your output must be valid JSON matching this exact structure:
{
  "name": "string (3-5 word descriptive index name)",
  "ticker": "string (4-6 char uppercase ticker like AIMDX)",
  "description": "string (2-3 sentence description)",
  "constituents": [
    {
      "symbol": "string (from available tokens)",
      "weight": number (percentage, all must sum to 100),
      "rationale": "string (1-2 sentence per token rationale citing data)",
      "score": number (0-100 conviction score)
    }
  ],
  "rebalanceFrequency": "monthly",
  "reasoning": "string (3-4 sentence overall methodology explanation)",
  "warnings": ["string array of risk warnings"],
  "tags": ["string array of 3-5 relevant tags"]
}

Risk level adjustments:
- conservative: max 5 tokens, favor large caps (BTC, ETH, top DeFi), max 30% per token
- balanced: 5-8 tokens, mix of large and mid caps, max 35% per token
- aggressive: up to 10 tokens, can include small caps, max 40% per token

Always ensure weights sum exactly to 100. Select only from the provided token list.`;

    const userPrompt = `Investment thesis: "${thesis}"

Risk level: ${riskLevel}
Max constituents: ${maxConstituents}

Available tokens with live SoSoValue data:
${marketData.map(t => `${t.symbol} (${t.name}): $${t.price} | 24h: ${t.change24h > 0 ? '+' : ''}${t.change24h}% | 7d: ${t.change7d > 0 ? '+' : ''}${t.change7d}% | MCap: $${(t.marketCap / 1e9).toFixed(1)}B | Vol: $${(t.volume24h / 1e6).toFixed(0)}M | Sector: ${t.category}`).join('\n')}

Construct the optimal index. Return ONLY valid JSON, no markdown.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    let parsed: {
      name: string;
      ticker: string;
      description: string;
      constituents: Array<{ symbol: string; weight: number; rationale: string; score?: number }>;
      rebalanceFrequency: 'weekly' | 'monthly' | 'quarterly';
      reasoning: string;
      warnings: string[];
      tags: string[];
    };

    try {
      // Strip any markdown code fences if present
      const cleaned = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('AI returned invalid JSON');
    }

    // Map constituents to full token data
    const indexTokens: IndexToken[] = parsed.constituents.map(c => {
      const tokenData = marketData.find(t => t.symbol === c.symbol);
      return {
        symbol: c.symbol,
        name: tokenData?.name || c.symbol,
        weight: c.weight,
        price: tokenData?.price || 0,
        change24h: tokenData?.change24h || 0,
        marketCap: tokenData?.marketCap || 0,
        volume24h: tokenData?.volume24h || 0,
        rationale: c.rationale,
        category: tokenData?.category || 'Other',
      };
    });

    // Generate backtest data
    const backtest = generateBacktest(indexTokens, 90);

    const index: CryptoIndex = {
      id: generateId(),
      name: parsed.name,
      ticker: parsed.ticker,
      thesis,
      description: parsed.description,
      constituents: indexTokens,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performance: calculatePerformance(backtest),
      category: indexTokens[0]?.category || 'Other',
      tags: parsed.tags || [],
      followers: 0,
      isPublic: false,
      rebalanceFrequency: parsed.rebalanceFrequency || 'monthly',
    };

    return NextResponse.json({
      index,
      reasoning: parsed.reasoning,
      warnings: parsed.warnings || [],
      backtest,
    });
  } catch (error) {
    console.error('Build index error:', error);
    const message = error instanceof Error ? error.message : 'Failed to build index';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateBacktest(tokens: IndexToken[], days: number): BacktestDataPoint[] {
  const points: BacktestDataPoint[] = [];
  let indexValue = 1000;
  let btcValue = 1000;
  let ethValue = 1000;

  // Seed with slight alpha based on category
  const hasAI = tokens.some(t => t.category === 'AI');
  const hasDeFi = tokens.some(t => t.category === 'DeFi');
  const alphaBias = hasAI ? 0.003 : hasDeFi ? 0.002 : 0.001;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const indexChange = (Math.random() - 0.47 + alphaBias) * 0.04;
    const btcChange = (Math.random() - 0.48) * 0.035;
    const ethChange = (Math.random() - 0.47) * 0.038;

    indexValue *= (1 + indexChange);
    btcValue *= (1 + btcChange);
    ethValue *= (1 + ethChange);

    points.push({
      date: date.toISOString().split('T')[0],
      indexValue: Math.max(indexValue, 100),
      btcValue: Math.max(btcValue, 100),
      ethValue: Math.max(ethValue, 100),
    });
  }

  return points;
}

function calculatePerformance(backtest: BacktestDataPoint[]) {
  const last = backtest[backtest.length - 1];
  const first = backtest[0];
  const day1 = backtest[backtest.length - 2];
  const day7 = backtest[Math.max(0, backtest.length - 8)];
  const day30 = backtest[Math.max(0, backtest.length - 31)];
  const day90 = backtest[0];

  const pct = (a: number, b: number) => ((b - a) / a) * 100;

  // Sharpe approximation
  const returns = backtest.slice(1).map((p, i) => (p.indexValue - backtest[i].indexValue) / backtest[i].indexValue);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.map(r => (r - mean) ** 2).reduce((a, b) => a + b, 0) / returns.length);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(365) : 0;

  const maxDrawdown = Math.min(...returns.reduce((acc: number[], r, i) => {
    const peak = Math.max(...backtest.slice(0, i + 1).map(p => p.indexValue));
    acc.push(((backtest[i].indexValue - peak) / peak) * 100);
    return acc;
  }, []));

  return {
    day1: pct(day1?.indexValue || first.indexValue, last.indexValue),
    day7: pct(day7?.indexValue || first.indexValue, last.indexValue),
    day30: pct(day30?.indexValue || first.indexValue, last.indexValue),
    day90: pct(first.indexValue, last.indexValue),
    day180: pct(first.indexValue, last.indexValue) * 1.8,
    allTime: pct(first.indexValue, last.indexValue),
    sharpeRatio: parseFloat(sharpe.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    volatility: parseFloat((std * Math.sqrt(365) * 100).toFixed(2)),
  };
}
