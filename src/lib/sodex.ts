const SODEX_BASE = 'https://api.sodex.com';

async function fetchSoDEX<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SODEX_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`SoDEX API error ${res.status}`);
  return res.json();
}

export async function getMarkets() {
  try {
    return await fetchSoDEX<{ data: SoDEXMarket[] }>('/api/v1/markets');
  } catch {
    return { data: MOCK_MARKETS };
  }
}

export async function getOrderbook(symbol: string, depth = 10) {
  try {
    return await fetchSoDEX<{ data: Orderbook }>(`/api/v1/orderbook/${symbol}`, { depth: String(depth) });
  } catch {
    return { data: getMockOrderbook(symbol) };
  }
}

export async function getKlines(symbol: string, interval = '1h', limit = 100) {
  try {
    return await fetchSoDEX<{ data: Kline[] }>(`/api/v1/klines/${symbol}`, { interval, limit: String(limit) });
  } catch {
    return { data: generateMockKlines(symbol, limit) };
  }
}

// EIP-712 order structure for SoDEX
export function buildOrderPayload(params: {
  market: string;
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  sender: string;
}) {
  const nonce = Date.now();
  return {
    domain: {
      name: 'SoDEX',
      version: '1',
      chainId: 1,
    },
    types: {
      Order: [
        { name: 'market', type: 'string' },
        { name: 'side', type: 'string' },
        { name: 'price', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'sender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    message: {
      ...params,
      nonce,
    },
  };
}

export function estimateSlippage(orderbook: Orderbook, side: 'buy' | 'sell', notional: number): number {
  const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
  let remaining = notional;
  let totalCost = 0;
  let totalQty = 0;

  for (const [price, qty] of levels) {
    const levelCost = price * qty;
    if (remaining <= levelCost) {
      const partialQty = remaining / price;
      totalCost += remaining;
      totalQty += partialQty;
      remaining = 0;
      break;
    }
    totalCost += levelCost;
    totalQty += qty;
    remaining -= levelCost;
  }

  if (totalQty === 0) return 0;
  const avgPrice = totalCost / totalQty;
  const midPrice = (levels[0]?.[0] || avgPrice);
  return Math.abs((avgPrice - midPrice) / midPrice) * 100;
}

// Types
interface SoDEXMarket {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  lastPrice: number;
  volume24h: number;
  change24h: number;
}

interface Orderbook {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

interface Kline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Mock data
const MOCK_MARKETS: SoDEXMarket[] = [
  { symbol: 'BTC-USDC', baseCurrency: 'BTC', quoteCurrency: 'USDC', lastPrice: 94250, volume24h: 12000000, change24h: 2.3 },
  { symbol: 'ETH-USDC', baseCurrency: 'ETH', quoteCurrency: 'USDC', lastPrice: 3480, volume24h: 8000000, change24h: 1.8 },
  { symbol: 'SOL-USDC', baseCurrency: 'SOL', quoteCurrency: 'USDC', lastPrice: 178, volume24h: 2400000, change24h: 3.1 },
  { symbol: 'ARB-USDC', baseCurrency: 'ARB', quoteCurrency: 'USDC', lastPrice: 0.82, volume24h: 980000, change24h: -1.2 },
];

function getMockOrderbook(symbol: string): Orderbook {
  const basePrice = MOCK_MARKETS.find(m => m.symbol === symbol)?.lastPrice || 100;
  const bids: [number, number][] = Array.from({ length: 10 }, (_, i) => [
    basePrice * (1 - (i + 1) * 0.001),
    Math.random() * 10,
  ]);
  const asks: [number, number][] = Array.from({ length: 10 }, (_, i) => [
    basePrice * (1 + (i + 1) * 0.001),
    Math.random() * 10,
  ]);
  return { symbol, bids, asks, timestamp: Date.now() };
}

function generateMockKlines(symbol: string, limit: number): Kline[] {
  const basePrice = MOCK_MARKETS.find(m => m.symbol === symbol)?.lastPrice || 100;
  let price = basePrice * 0.85;
  return Array.from({ length: limit }, (_, i) => {
    const change = (Math.random() - 0.48) * price * 0.02;
    price = Math.max(price + change, 1);
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    return {
      timestamp: Date.now() - (limit - i) * 3600000,
      open: price - change,
      high,
      low,
      close: price,
      volume: Math.random() * 1000000,
    };
  });
}
