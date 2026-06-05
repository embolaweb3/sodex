export interface IndexToken {
  symbol: string;
  name: string;
  weight: number; // 0-100 percentage
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  rationale: string;
  category: string;
  logoUrl?: string;
}

export interface CryptoIndex {
  id: string;
  name: string;
  ticker: string;
  thesis: string;
  description: string;
  constituents: IndexToken[];
  createdAt: string;
  updatedAt: string;
  creatorAddress?: string;
  creatorName?: string;
  performance: IndexPerformance;
  category: string;
  tags: string[];
  followers: number;
  isPublic: boolean;
  rebalanceFrequency: 'weekly' | 'monthly' | 'quarterly';
  totalValue?: number;
}

export interface IndexPerformance {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
  day180: number;
  allTime: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  volatility?: number;
}

export interface BacktestDataPoint {
  date: string;
  indexValue: number;
  btcValue: number;
  ethValue: number;
}

export interface ETFFlowData {
  date: string;
  btcNetFlow: number;
  ethNetFlow: number;
  totalAum: number;
  btcAum: number;
  ethAum: number;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  category: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  url: string;
}

export interface BuildIndexRequest {
  thesis: string;
  riskLevel: 'conservative' | 'balanced' | 'aggressive';
  maxConstituents: number;
  categories?: string[];
}

export interface BuildIndexResponse {
  index: CryptoIndex;
  reasoning: string;
  warnings: string[];
  backtest: BacktestDataPoint[];
}

export interface SoDEXMarket {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  lastPrice: number;
  volume24h: number;
  change24h: number;
}

export interface ExecutionPreview {
  token: string;
  side: 'buy' | 'sell';
  amount: number;
  estimatedPrice: number;
  slippage: number;
  notional: number;
}

export interface ExecutedOrder {
  market: string;
  symbol: string;
  txHash: string;
  blockExplorerUrl: string;
  status: 'confirmed';
  notional: number;
  weight: number;
  timestamp: string;
}

export interface ExecutionResult {
  orders: ExecutedOrder[];
  executedAt: string;
  source: 'live' | 'mock';
}
