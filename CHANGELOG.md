# Changelog

All notable changes to one.ie are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.0] — 2026-04-23 — Wallet + Chat + Pay

### Added
- 5-state passkey wallet with AES-256-GCM envelope encryption
- Touch ID sign flow (SUI transactions, sponsored gas)
- SuiNS name resolution in Send page
- Scoped wallet Move module (spend caps, pause, revoke, spawn-child)
- Agent co-sign flow (pending approval queue, 5-min TTL, notifications)
- Multi-chain pay links (SUI/ETH/SOL/BTC/BASE/ARB/OPT)
- AI chat with resumable sessions (cursor, 1-hour reattach), ⌘K widget
- 5 rich-message types (PaymentCard, AgentCard, ListingCard, PreSignCard, HandoffCard)
- Sell surface (list capabilities, mint, share)
- Buy discovery (pheromone-weighted listing query)
- Build surface (form-based agent deploy → CF Worker)
- Push/email/webhook notification routing
- Peer agent lifecycle (boot, heartbeat, spawn-child, dead-man cascade)
- Legal pages (terms, privacy, cookie consent)
- Help surface with /chat handoff

### Security
- State-1 balance cap: $25 USD cumulative (oracle-priced, enforced at sponsor build)
- Two-oracle consensus (Pyth + CoinGecko, 60s staleness, 2% deviation limit)
- AML address screening (local blocklist + optional Chainalysis API)
- Reconciliation tick: on-chain vs TypeDB balance diff alerts
- CSP hardened (nonce-based script-src replacing unsafe-inline)
- Error-copy CI lint (wallet.md §Error copy ↔ errors.ts, fails on drift)
