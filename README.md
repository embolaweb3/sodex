# IndexForge — AI-Powered On-Chain Thematic Index Platform

> **SoSoValue Buildathon 2026** · Wave 1 Submission

---

## The Problem

Index investing is one of the most proven strategies in traditional finance — S&P 500, NASDAQ 100, sector ETFs. In crypto, it barely exists for retail users.

Today, building a thematic crypto index requires:
- Weeks of manual research across hundreds of tokens
- Proprietary market data that only institutions can afford
- Constant manual rebalancing as markets shift
- Technical expertise to execute on-chain without overpaying in slippage

The result? Retail investors either chase individual coins blindly, or sit on the sidelines entirely.

**IndexForge removes every one of those barriers.**

---

## What Is IndexForge?

IndexForge is an agentic on-chain index platform that lets anyone — a retail trader, a DeFi power user, or a one-person fund — build, backtest, publish, and rebalance a thematic cryptocurrency index in under 60 seconds.

You describe your investment thesis in plain English. IndexForge does the rest.

```
"AI tokens with strong institutional ETF inflows and developer momentum"
                              ↓
   SoSoValue API → sector data, ETF flows, prices, SSI indexes, news
                              ↓
   Claude AI → selects tokens, assigns weights, writes per-token rationale
                              ↓
   Index Engine → concentration caps, 90-day backtest, Sharpe ratio
                              ↓
   SoDEX → orderbook slippage preview, EIP-712 signed rebalancing orders
                              ↓
   Published index with verifiable on-chain methodology
```

---

## Who Is It For?

| User | Problem Solved |
|---|---|
| **Retail investor** | Wants exposure to a crypto theme (AI, RWA, DeFi) without picking individual coins or paying a fund manager |
| **DeFi power user** | Wants to manage a personal portfolio systematically with risk controls and auto-rebalancing |
| **Index creator** | Wants to publish a thesis-driven index, build a following, and let others mirror it |
| **Index follower** | Wants to copy a proven index creator's strategy without doing the research themselves |
| **Researcher / analyst** | Wants to test how different thematic baskets would have performed historically |

---

## Key Benefits

### 1. Democratizes Institutional-Grade Index Construction
Building a custom index previously required Bloomberg terminals, quant teams, and millions in AUM. IndexForge replaces all of that with a single text input — backed by SoSoValue's institutional data infrastructure covering ETF flows, sector classifications, real-time prices, and market intelligence.

### 2. AI That Explains Its Reasoning
Unlike black-box trading bots, IndexForge's Claude AI produces a full written rationale for every token selected and every weight assigned. Users understand *why* their index looks the way it does — not just what it contains. This builds trust and helps users learn.

### 3. Backtested Before You Commit
Every generated index is immediately tested against 90 days of historical data and benchmarked against BTC and ETH. Sharpe ratio, maximum drawdown, and annualized volatility are surfaced before a single dollar is deployed. You know the risk profile before you invest.

### 4. Risk Controls Built In
The index engine enforces concentration caps (max 30–40% per token based on risk level), filters tokens by liquidity thresholds, and applies sector diversification rules derived from SoSoValue category data. It is not just a basket — it is a risk-managed portfolio.

### 5. Full Pipeline: From Idea to On-Chain Execution
Most crypto tools stop at signals or dashboards. IndexForge completes the loop — from thesis input through AI construction, backtest validation, and all the way to SoDEX orderbook execution with real slippage estimates and EIP-712 signed orders.

### 6. Composable and Social
Published indexes can be forked, followed, and mirrored. A creator publishes a "DeFi Blue Chip" index; followers can mirror the exact weights or fork and customize. This creates a marketplace of investment strategies — not just assets.

### 7. Verifiable Methodology
Index methodology is hashed and published on-chain, making it auditable and tamper-proof. Unlike opaque fund managers, IndexForge indexes are transparent by design.

---

## How It Works — Step by Step

**Step 1 — Describe your thesis**
Type any investment theme in plain English. Examples:
- *"AI tokens with growing institutional ETF inflows"*
- *"DeFi blue chips with high TVL and proven fee revenue"*
- *"Layer 2 scaling solutions leading Ethereum ecosystem growth"*
- *"RWA tokenization protocols gaining institutional traction"*

**Step 2 — AI queries SoSoValue**
Claude Sonnet 4.6 calls 9 SoSoValue API endpoints to pull live sector data, ETF net flows, market caps, 24h/7d price changes, volume, SSI composite indexes, and news sentiment. It uses this to score every available token against the thesis.

**Step 3 — Index is constructed**
The AI selects the best-fit tokens, assigns softmax-weighted allocations (anchored to market cap, ETF flow momentum, and sector relevance), applies concentration limits, and writes a plain-English rationale for each token's inclusion.

**Step 4 — Backtest runs automatically**
A 90-day simulated backtest runs immediately. You see the index's hypothetical performance vs BTC and ETH, plus Sharpe ratio, max drawdown, and volatility — before you commit.

**Step 5 — Review and publish**
Satisfied with the construction? Publish the index on-chain with a verifiable methodology hash. It appears in the public marketplace where other users can follow or fork it.

**Step 6 — Execute through SoDEX**
IndexForge generates an execution plan through the SoDEX orderbook — showing estimated quantities, notional values, and slippage per token. Rebalancing orders are signed via EIP-712, keeping assets non-custodial throughout.

---

## Live Demo

```bash
git clone https://github.com/embolaweb3/indexforge
cd indexforge
npm install
# Add your API keys to .env.local (app works with mock data without keys)
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

```env
ANTHROPIC_API_KEY=      # Claude AI for index construction (required)
SOSOVALUE_API_KEY=      # Live market data (falls back to realistic mock data)
SODEX_API_KEY=          # Execution layer (testnet works without a key)
```

---

## App Pages

| Route | What You'll Find |
|---|---|
| `/` | Landing page — animated Three.js 3D background, live ticker strip, step-by-step walkthrough, featured community indexes |
| `/builder` | **The core feature** — thesis input, risk level selector, animated AI build progress, index result with constituent weights, backtest chart, and SoDEX execution preview |
| `/indexes` | Community index marketplace — filter by category (AI, DeFi, RWA, L1, L2, Gaming), sort by followers or performance |
| `/indexes/[id]` | Index detail page — full performance metrics, allocation pie chart, 90-day area chart vs benchmarks, constituent breakdown |
| `/app` | Market dashboard — BTC/ETH ETF flow bar chart from SoSoValue, real-time market table, top movers, SoSoValue news feed |

---

## SoSoValue API — 9 Endpoints Integrated

| Endpoint | How IndexForge Uses It |
|---|---|
| `GET /v1/categories` | Maps thesis keywords to official SoSoValue sector taxonomy |
| `GET /v1/coins/market-data` | Prices, market caps, 24h/7d change, volume for token scoring |
| `GET /v1/etfs/summary-history` | BTC/ETH institutional ETF net flows — key signal for momentum weighting |
| `GET /v1/ssi/list` | SoSoValue composite sector indexes as a benchmark comparison layer |
| `GET /v1/news/list` | Narrative signals from categorized news — used in the Dashboard |
| `GET /v1/currencies/{id}/token-economics` | Token unlock schedules for dilution risk awareness |
| `GET /v1/btc-treasuries` | Institutional BTC holding data for macro context |
| `GET /v1/macro/events` | Macro calendar for risk-off signal overlay |
| `GET /v1/analysis/charts` | Technical analysis overlays for the Dashboard |

---

## SoDEX Integration

| Layer | Detail |
|---|---|
| **Markets** | Fetch all available trading pairs and current prices |
| **Orderbook** | Pull bid/ask depth to estimate execution slippage per token |
| **Klines** | Historical OHLCV for backtesting and technical overlays |
| **Orders** | EIP-712 typed data signing for non-custodial limit order submission |
| **Testnet** | Fully accessible without mainnet deposit — live in Wave 1 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Turbopack), TypeScript |
| Styling | Tailwind CSS, custom glass morphism, CSS animations |
| 3D & Motion | Three.js, @react-three/fiber, @react-three/drei, Framer Motion |
| Charts | Recharts (area, bar, pie) |
| AI | Claude Sonnet 4.6 via `@anthropic-ai/sdk` |
| Market Data | SoSoValue API (9 endpoints) |
| Execution | SoDEX API with EIP-712 order signing |
| Deployment | Vercel (static + serverless Edge Functions) |

---
