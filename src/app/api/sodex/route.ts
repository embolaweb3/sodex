import { NextRequest, NextResponse } from 'next/server';
import { getMarkets, getOrderbook, estimateSlippage } from '@/lib/sodex';
import type { ExecutionPreview } from '@/types';

export async function GET() {
  try {
    const markets = await getMarkets();
    return NextResponse.json({ markets: markets.data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch SoDEX markets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tokens, totalNotional } = await req.json() as {
      tokens: Array<{ symbol: string; weight: number }>;
      totalNotional: number;
    };

    const previews: ExecutionPreview[] = await Promise.all(
      tokens.map(async token => {
        const symbol = `${token.symbol}-USDC`;
        const notional = (token.weight / 100) * totalNotional;

        let slippage = 0.1;
        try {
          const ob = await getOrderbook(symbol);
          slippage = estimateSlippage(ob.data, 'buy', notional);
        } catch {
          // use default
        }

        const markets = await getMarkets();
        const market = markets.data.find(m => m.symbol === symbol);
        const price = market?.lastPrice || 0;

        return {
          token: token.symbol,
          side: 'buy' as const,
          amount: price > 0 ? notional / price : 0,
          estimatedPrice: price,
          slippage: parseFloat(slippage.toFixed(4)),
          notional,
        };
      })
    );

    return NextResponse.json({ previews });
  } catch {
    return NextResponse.json({ error: 'Failed to build execution preview' }, { status: 500 });
  }
}
