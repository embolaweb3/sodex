import { NextRequest, NextResponse } from 'next/server';
import { keccak256, toBytes } from 'viem';
import { createServerClient, hasSupabase } from '@/lib/supabase';
import type { CryptoIndex, BacktestDataPoint, IndexToken, FactorVector } from '@/types';

interface SaveRequest {
  index: CryptoIndex;
  reasoning: string;
  warnings: string[];
  backtest: BacktestDataPoint[];
  walletAddress: string;
  riskLevel: string;
  factorVector?: FactorVector;
}

function computeMethodologyHash(index: CryptoIndex, riskLevel: string, factorVector?: FactorVector): string {
  const payload = JSON.stringify({
    thesis: index.thesis,
    riskLevel,
    // Factor vector is now part of the hash — two indexes with same thesis but
    // different factor emphasis produce different methodology fingerprints.
    factorVector: factorVector ?? null,
    constituents: index.constituents.map((c: IndexToken) => ({
      symbol: c.symbol,
      weight: c.weight,
      category: c.category,
    })),
    rebalanceFrequency: index.rebalanceFrequency,
  });
  return keccak256(toBytes(payload));
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveRequest = await req.json();
    const { index, reasoning, warnings, backtest, walletAddress, riskLevel, factorVector } = body;

    if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Valid wallet address required' }, { status: 400 });
    }

    const methodologyHash = computeMethodologyHash(index, riskLevel, factorVector);

    if (!hasSupabase()) {
      // Demo mode — return hash without persisting
      return NextResponse.json({
        id: index.id,
        methodologyHash,
        source: 'mock' as const,
        savedAt: new Date().toISOString(),
      });
    }

    const db = createServerClient();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data, error } = await db
      .from('indexes')
      .upsert({
        id: index.id,
        wallet_address: walletAddress.toLowerCase(),
        name: index.name,
        ticker: index.ticker,
        thesis: index.thesis,
        description: index.description ?? '',
        category: index.category,
        tags: index.tags,
        risk_level: riskLevel,
        constituents: index.constituents,
        performance: index.performance,
        reasoning,
        warnings,
        backtest,
        factor_vector: factorVector ?? null,
        is_public: true,
        methodology_hash: methodologyHash,
        updated_at: new Date().toISOString(),
      })
      .select('id, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      methodologyHash,
      
      source: 'live' as const,
      savedAt: data.created_at as string,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    );
  }
}
