export type DataSource = 'live' | 'mock';

export interface WithSource<T> {
  data: T;
  source: DataSource;
  fetchedAt: string;
}

const SOSOVALUE_BASE = 'https://openapi.sosovalue.com/openapi/v1';

export function hasApiKey(): boolean {
  return Boolean(process.env.SOSOVALUE_API_KEY?.trim());
}

const headers = () => ({
  'Content-Type': 'application/json',
  'x-soso-api-key': process.env.SOSOVALUE_API_KEY || '',
});

async function fetchSSV<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SOSOVALUE_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { headers: headers(), next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`SoSoValue API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function live<T>(data: T): WithSource<T> {
  return { data, source: 'live', fetchedAt: new Date().toISOString() };
}

function mock<T>(data: T): WithSource<T> {
  return { data, source: 'mock', fetchedAt: new Date().toISOString() };
}

export async function checkLiveness(): Promise<DataSource> {
  if (!hasApiKey()) return 'mock';
  try {
    await fetchSSV('/currencies');
    return 'live';
  } catch (err) {
    console.error('[SoSoValue] checkLiveness failed:', err instanceof Error ? err.message : err);
    return 'mock';
  }
}

export async function getCategories() {
  try {
    const res = await fetchSSV<{ data: Array<{ name: string; slug: string; description: string }> }>('/currencies/sector-spotlight');
    return live(res.data);
  } catch {
    return mock(MOCK_CATEGORIES);
  }
}

// Static category map — avoids a separate API call per token
const SYMBOL_CATEGORY: Record<string, string> = {
  BTC: 'L1', ETH: 'L1', SOL: 'L1',
  ARB: 'L2', OP: 'L2',
  UNI: 'DeFi', AAVE: 'DeFi', MKR: 'DeFi', PENDLE: 'DeFi',
  RENDER: 'AI', TAO: 'AI', FET: 'AI',
  LINK: 'Infrastructure',
  ONDO: 'RWA',
  IMX: 'Gaming',
};

const TARGET_SYMBOLS = new Set(Object.keys(SYMBOL_CATEGORY));

export async function getMarketData() {
  try {
    // Step 1: get currency list to resolve symbol → currency_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listRes = await fetchSSV<any>('/currencies');
    const allCurrencies: Array<{ currency_id: string; symbol: string; name: string }> =
      listRes?.data ?? listRes ?? [];

    const targets = allCurrencies.filter(c => TARGET_SYMBOLS.has(c.symbol?.toUpperCase()));
    if (targets.length === 0) return mock(MOCK_MARKET_DATA);

    // Step 2: fetch market snapshot for each target token in parallel
    const snapshots = await Promise.allSettled(
      targets.map(async c => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await fetchSSV<any>(`/currencies/${c.currency_id}/market-snapshot`);
        const s = r?.data ?? r ?? {};
        return {
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: Number(s.price ?? 0),
          // API returns decimal fraction (e.g. -0.0161 = -1.61%)
          change24h: Number(s.change_pct_24h ?? 0) * 100,
          change7d: 0,
          marketCap: Number(s.marketcap ?? 0),
          volume24h: Number(s.turnover_24h ?? 0),
          category: SYMBOL_CATEGORY[c.symbol.toUpperCase()] ?? 'Other',
        } as MarketDataItem;
      })
    );

    const liveItems = snapshots
      .filter((r): r is PromiseFulfilledResult<MarketDataItem> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(item => item.price > 0);

    return live(liveItems);
  } catch (err) {
    console.error('[SoSoValue] getMarketData failed:', err instanceof Error ? err.message : err);
    return mock(MOCK_MARKET_DATA);
  }
}

export async function getETFData() {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const params = { symbol: 'BTC', country_code: 'US', limit: '30', start_date: fmt(start), end_date: fmt(end) };
    const ethParams = { symbol: 'ETH', country_code: 'US', limit: '30', start_date: fmt(start), end_date: fmt(end) };

    const [btcRes, ethRes] = await Promise.allSettled([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchSSV<any>('/etfs/summary-history', params),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchSSV<any>('/etfs/summary-history', ethParams),
    ]);


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const btcRaw: Array<Record<string, any>> =
      btcRes.status === 'fulfilled' ? (btcRes.value?.data ?? []) : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethMap = new Map<string, Record<string, any>>();
    if (ethRes.status === 'fulfilled') {
      (ethRes.value?.data ?? []).forEach((d: Record<string, unknown>) => ethMap.set(String(d.date), d));
    }

    const items: ETFItem[] = btcRaw.map(d => {
      const eth = ethMap.get(String(d.date)) ?? {};
      return {
        date: String(d.date ?? ''),
        btcNetFlow: Number(d.total_net_inflow ?? 0),
        ethNetFlow: Number(eth.total_net_inflow ?? 0),
        totalAum: Number(d.total_net_assets ?? 0) + Number(eth.total_net_assets ?? 0),
        btcAum: Number(d.total_net_assets ?? 0),
        ethAum: Number(eth.total_net_assets ?? 0),
      };
    });

    return live(items);
  } catch (err) {
    console.error('[SoSoValue] getETFData failed:', err instanceof Error ? err.message : err);
    return mock(MOCK_ETF_DATA);
  }
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNewsItem(n: any): NewsItem {
  const rawTitle = String(n.title ?? '').trim();
  const rawSummary = stripHtml(String(n.content ?? n.summary ?? ''));
  const title = rawTitle || rawSummary.slice(0, 120) || 'Untitled';
  return {
    newsId: String(n.id ?? ''),
    title,
    summary: rawSummary,
    publishedAt: n.release_time
      ? new Date(Number(n.release_time)).toISOString()
      : new Date().toISOString(),
    source: n.nick_name ?? n.author ?? 'SoSoValue',
    categories: [
      ...(Array.isArray(n.tags) ? n.tags : []),
      ...(Array.isArray(n.matched_currencies)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? n.matched_currencies.map((c: any) => c.name)
        : []),
    ].filter(Boolean).slice(0, 3),
    url: n.source_link ?? n.original_link ?? '#',
  };
}

export async function getNewsList(category?: string, limit = 20) {
  try {
    const params: Record<string, string> = { page_size: String(limit) };
    if (category) params.category = category;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await fetchSSV<any>('/news', params);
    // Response shape: { code, data: { page, page_size, total, list: [...] } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataField = (res as any)?.data;
    const raw: unknown[] = Array.isArray(dataField)
      ? dataField
      : Array.isArray(dataField?.list) ? dataField.list : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return live(raw.map((n: any) => mapNewsItem(n)));
  } catch (err) {
    console.error('[SoSoValue] getNewsList failed:', err instanceof Error ? err.message : err);
    return live([]);
  }
}

export async function getSSIList() {
  try {
    const res = await fetchSSV<{ data: SSIItem[] } | SSIItem[]>('/indices');
    const raw = Array.isArray(res) ? res : (res as { data: SSIItem[] }).data;
    return live(raw);
  } catch {
    return mock(MOCK_SSI);
  }
}

export async function getBTCTreasuries() {
  try {
    const res = await fetchSSV<{ data: TreasuryItem[] } | TreasuryItem[]>('/btc-treasuries');
    const raw = Array.isArray(res) ? res : (res as { data: TreasuryItem[] }).data;
    return live(raw);
  } catch {
    return mock([] as TreasuryItem[]);
  }
}

// Types
interface MarketDataItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  category: string;
}

interface ETFItem {
  date: string;
  btcNetFlow: number;
  ethNetFlow: number;
  totalAum: number;
  btcAum: number;
  ethAum: number;
}

interface NewsItem {
  newsId: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  categories: string[];
  url: string;
}

interface SSIItem {
  id: string;
  name: string;
  value: number;
  change24h: number;
  constituents: Array<{ symbol: string; weight: number }>;
}

interface TreasuryItem {
  entity: string;
  holdings: number;
  value: number;
}

// Mock data for when API key is not set
const MOCK_CATEGORIES = [
  { name: 'Layer 1', slug: 'L1', description: 'Base layer blockchains' },
  { name: 'Layer 2', slug: 'L2', description: 'Scaling solutions' },
  { name: 'DeFi', slug: 'DeFi', description: 'Decentralized Finance protocols' },
  { name: 'AI', slug: 'AI', description: 'AI & Machine Learning tokens' },
  { name: 'RWA', slug: 'RWA', description: 'Real World Assets' },
  { name: 'Gaming', slug: 'Gaming', description: 'GameFi & Metaverse' },
  { name: 'Infrastructure', slug: 'Infrastructure', description: 'Web3 infrastructure' },
];

export const MOCK_MARKET_DATA: MarketDataItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 94250, change24h: 2.3, change7d: 8.1, marketCap: 1850000000000, volume24h: 32000000000, category: 'L1' },
  { symbol: 'ETH', name: 'Ethereum', price: 3480, change24h: 1.8, change7d: 6.2, marketCap: 418000000000, volume24h: 18000000000, category: 'L1' },
  { symbol: 'SOL', name: 'Solana', price: 178, change24h: 3.1, change7d: 12.4, marketCap: 82000000000, volume24h: 4200000000, category: 'L1' },
  { symbol: 'ARB', name: 'Arbitrum', price: 0.82, change24h: -1.2, change7d: 3.8, marketCap: 3200000000, volume24h: 280000000, category: 'L2' },
  { symbol: 'OP', name: 'Optimism', price: 1.24, change24h: 0.8, change7d: 5.1, marketCap: 1900000000, volume24h: 190000000, category: 'L2' },
  { symbol: 'UNI', name: 'Uniswap', price: 8.90, change24h: 2.1, change7d: 9.3, marketCap: 5300000000, volume24h: 320000000, category: 'DeFi' },
  { symbol: 'AAVE', name: 'Aave', price: 198, change24h: 3.4, change7d: 14.2, marketCap: 2900000000, volume24h: 210000000, category: 'DeFi' },
  { symbol: 'MKR', name: 'Maker', price: 1820, change24h: 1.9, change7d: 7.8, marketCap: 1650000000, volume24h: 95000000, category: 'DeFi' },
  { symbol: 'RENDER', name: 'Render', price: 6.20, change24h: 4.2, change7d: 18.6, marketCap: 2600000000, volume24h: 180000000, category: 'AI' },
  { symbol: 'TAO', name: 'Bittensor', price: 412, change24h: 5.1, change7d: 22.3, marketCap: 3100000000, volume24h: 145000000, category: 'AI' },
  { symbol: 'FET', name: 'Fetch.ai', price: 1.68, change24h: 3.8, change7d: 15.9, marketCap: 1420000000, volume24h: 98000000, category: 'AI' },
  { symbol: 'LINK', name: 'Chainlink', price: 18.40, change24h: 1.5, change7d: 6.8, marketCap: 10800000000, volume24h: 520000000, category: 'Infrastructure' },
  { symbol: 'ONDO', name: 'Ondo Finance', price: 1.12, change24h: 2.8, change7d: 11.4, marketCap: 1580000000, volume24h: 87000000, category: 'RWA' },
  { symbol: 'PENDLE', name: 'Pendle', price: 4.85, change24h: 6.2, change7d: 24.1, marketCap: 720000000, volume24h: 62000000, category: 'DeFi' },
  { symbol: 'IMX', name: 'Immutable X', price: 1.42, change24h: 1.1, change7d: 4.6, marketCap: 2100000000, volume24h: 145000000, category: 'Gaming' },
];

const MOCK_ETF_DATA: ETFItem[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const btcFlow = (Math.random() - 0.3) * 800000000;
  const ethFlow = (Math.random() - 0.35) * 200000000;
  return {
    date: date.toISOString().split('T')[0],
    btcNetFlow: btcFlow,
    ethNetFlow: ethFlow,
    totalAum: 95000000000 + i * 500000000 + Math.random() * 2000000000,
    btcAum: 72000000000 + i * 400000000,
    ethAum: 12000000000 + i * 80000000,
  };
});

const MOCK_NEWS: NewsItem[] = [
  { newsId: '1', title: 'BlackRock Bitcoin ETF records largest single-day inflow of $820M', summary: 'Institutional demand surges as BlackRock IBIT sees record inflows amid Bitcoin rally above $94K.', publishedAt: new Date().toISOString(), source: 'SoSoValue', categories: ['BTC', 'ETF'], url: '#' },
  { newsId: '2', title: 'AI tokens surge 25% as Bittensor launches new subnet for financial intelligence', summary: 'TAO leads AI sector rally following the launch of a dedicated financial data subnet attracting major validators.', publishedAt: new Date(Date.now() - 3600000).toISOString(), source: 'SoSoValue', categories: ['AI', 'Infrastructure'], url: '#' },
  { newsId: '3', title: 'DeFi TVL hits $180B as Aave and Pendle see record deposits', summary: 'Total value locked in DeFi protocols reaches new highs driven by yield-seeking strategies on Aave and Pendle.', publishedAt: new Date(Date.now() - 7200000).toISOString(), source: 'SoSoValue', categories: ['DeFi'], url: '#' },
  { newsId: '4', title: 'RWA tokenization market crosses $15B as Ondo Finance expands to new chains', summary: 'Real world asset tokenization continues explosive growth with Ondo Finance leading institutional adoption.', publishedAt: new Date(Date.now() - 10800000).toISOString(), source: 'SoSoValue', categories: ['RWA'], url: '#' },
  { newsId: '5', title: 'Ethereum L2 ecosystem sees $2.4B in weekly volume as Arbitrum leads', summary: 'Layer 2 networks continue to absorb Ethereum mainnet activity with Arbitrum commanding 58% market share.', publishedAt: new Date(Date.now() - 14400000).toISOString(), source: 'SoSoValue', categories: ['L2'], url: '#' },
];

const MOCK_SSI: SSIItem[] = [
  { id: '1', name: 'DeFi Index', value: 1284.5, change24h: 3.2, constituents: [{ symbol: 'UNI', weight: 25 }, { symbol: 'AAVE', weight: 20 }, { symbol: 'MKR', weight: 18 }, { symbol: 'PENDLE', weight: 15 }] },
  { id: '2', name: 'Layer 1 Index', value: 2891.3, change24h: 2.1, constituents: [{ symbol: 'ETH', weight: 45 }, { symbol: 'SOL', weight: 30 }, { symbol: 'BTC', weight: 25 }] },
  { id: '3', name: 'AI Index', value: 892.7, change24h: 5.8, constituents: [{ symbol: 'TAO', weight: 35 }, { symbol: 'RENDER', weight: 30 }, { symbol: 'FET', weight: 25 }] },
];
