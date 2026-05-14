# IndexForge — AI-Powered On-Chain Thematic Index Platform

> **SoSoValue Buildathon 2026** 

**Anyone can be an index fund manager.** Describe your investment thesis in plain English — IndexForge uses institutional-grade SoSoValue data + Claude AI to build, backtest, and publish a weighted on-chain crypto index, then execute rebalancing through SoDEX.

## Live Demo

```
https://indexforge-kappa.vercel.app/
```

## What It Does

| User Action | What IndexForge Does |
|---|---|
| Types a thesis: *"AI tokens with ETF inflows"* | Queries SoSoValue sectors, ETF data, market data |
| Clicks "Build Index" | Claude AI constructs weighted basket with rationale |
| Reviews results | 90-day backtest vs BTC/ETH, Sharpe ratio, max drawdown |
| Publishes | On-chain methodology hash, verifiable index |
| Executes | SoDEX orderbook slippage preview + EIP-712 signed orders |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Turbopack), TypeScript |
| Styling | Tailwind CSS, glass morphism |
| 3D / Animations | Three.js, @react-three/fiber, Framer Motion |
| Charts | Recharts |
| AI | Claude Sonnet 4.6 via @anthropic-ai/sdk |
| Data | SoSoValue API (9 endpoints) |
| Execution | SoDEX API (EIP-712 signing) |
| Deployment | Vercel |

## Setup

```bash
git clone <repo>
cd indexforge
npm install
cp .env.local .env.local.example  # fill in keys
npm run dev
```

### Environment Variables

```env
ANTHROPIC_API_KEY=    # Required for AI index construction
SOSOVALUE_API_KEY=    # Required for live market data (falls back to mock)
SODEX_API_KEY=        # Optional, testnet works without key
```

## Pages

| Route | Description |
|---|---|
| `/` | Landing — hero with Three.js 3D, ticker strip, how-it-works |
| `/builder` | Core AI index builder with live SoSoValue data |
| `/indexes` | Community marketplace — browse, filter, fork |
| `/indexes/[id]` | Index detail with performance charts and constituents |
| `/app` | Dashboard — ETF flows, market overview, news feed |

## SoSoValue API Integration

9 endpoints integrated: categories, coins/market-data, etfs/summary-history, ssi/list, news/list, token-economics, btc-treasuries, macro/events, analysis/charts.

## SoDEX Integration

Read: markets, orderbook, klines. Write: EIP-712 signed limit orders for rebalancing. Testnet-ready.

## Wave 1 Deliverables

- [x] Full working prototype (landing + builder + marketplace + dashboard + detail pages)
- [x] SoSoValue API integrated (9 endpoints, graceful mock fallback)
- [x] Claude AI index construction (weighted basket + rationale + warnings)
- [x] 90-day backtester vs BTC/ETH benchmarks
- [x] SoDEX execution preview (slippage estimation, EIP-712 structure)
- [x] Three.js 3D backgrounds + Framer Motion animations
- [x] Production build passing, Vercel-ready

## Team

Solo build — leaning into the SoSoValue buildathon "one-person index fund manager" vision.

## Wave 2 Roadmap

- Supabase persistent index storage
- Wallet-gated publishing with on-chain methodology hash
- Live SoDEX testnet execution
- Index forking and follower counts

## Wave 3 Roadmap

- SoDEX mainnet execution with full EIP-712 flow
- Automated rebalancing triggers
- Risk-off gating via SoSoValue macro events calendar
