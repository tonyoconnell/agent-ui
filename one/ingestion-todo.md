---
title: TODO Ingestion Tiers
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow → Sustain → Graduate
total_tasks: 28
completed: 0
status: PLANNING
---

# TODO: Wire Ingestion Tiers 1-7

> **Time units:** plan in **tasks → waves → cycles** only.
>
> **Goal:** Every data source (agent outcomes, UI clicks, analytics, email, payments, support, self-learning) feeds `mark()/warn()` through canonical `/api/ingest/*` endpoints.
>
> **Source of truth:** [ingestion.md](ingestion.md) — 7-tier taxonomy,
> [DSL.md](one/DSL.md) — signal grammar,
> [dictionary.md](dictionary.md) — canonical names,
> [buy-and-sell.md](buy-and-sell.md) — commerce signals (Tier 5)
>
> **Shape:** 2 cycles, four waves each. Haiku reads, Opus decides, Sonnet writes, Sonnet checks.

## Routing

```
    Tier 1-7 sources                      /api/ingest/*
    ─────────────────                     ──────────────
    agent .ask() outcomes ─────────────►  (already wired)
    UI emitClick() ────────────────────►  /api/signal (partial)
    analytics (page/dwell/bounce) ─────►  /api/ingest/analytics
    email (open/click/spam/unsub) ─────►  /api/ingest/email
    Stripe (purchase/refund/dispute) ──►  /api/ingest/stripe
    support (ticket/NPS) ──────────────►  /api/ingest/rating
    self-learning (evolve/harden) ─────►  loop.ts L5-L7

                    ┌─────────────┐
                    │  mark/warn  │◄── all sources reduce here
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
    TypeDB path        Sui path           KV cache
    (cheap signals)    (>threshold)       (hot routing)
```

## Tasks

| ID | Tier | Task | Effort | Phase | Blocks | BlockedBy |
|----|------|------|--------|-------|--------|-----------|
| I01 | — | Audit bridge.ts: confirm mirrorMark/mirrorWarn wired | S | W1 | I06 | — |
| I02 | — | Audit sui.ts: confirm pay() and harden() exist | S | W1 | I07,I08 | — |
| I03 | 1 | Verify .ask() → mark/warn flow in loop.ts | S | W1 | — | — |
| I04 | 2 | Audit emitClick coverage in UI components | M | W1 | I10 | — |
| I05 | 3-7 | Inventory existing /api/ingest/* endpoints | S | W1 | I11-I14 | — |
| I06 | — | Decide: mirrorPay wrapper signature in bridge.ts | S | W2 | I07 | I01 |
| I07 | — | Wire sui.pay() TS wrapper in bridge.ts | M | W3 | I15 | I02,I06 |
| I08 | — | Wire sui.harden() TS wrapper in bridge.ts | M | W3 | I16 | I02 |
| I09 | 2 | Decide: emitClick → /api/signal standard payload | S | W2 | I10 | I04 |
| I10 | 2 | Complete emitClick wiring (thumbs, retry, share) | M | W3 | — | I04,I09 |
| I11 | 3 | Create /api/ingest/analytics endpoint | M | W3 | I17 | I05 |
| I12 | 4 | Create /api/ingest/email endpoint | M | W3 | I18 | I05 |
| I13 | 5 | Create /api/ingest/stripe webhook handler | L | W3 | I19 | I05,I07 |
| I14 | 6 | Create /api/ingest/rating endpoint | M | W3 | I20 | I05 |
| I15 | 5 | Test pay() → mark() atomicity on testnet | M | W4 | — | I07 |
| I16 | 7 | Test harden() → Highway object on testnet | M | W4 | — | I08 |
| I17 | 3 | Test /api/ingest/analytics with mock batch | S | W4 | — | I11 |
| I18 | 4 | Test /api/ingest/email with SendGrid event | S | W4 | — | I12 |
| I19 | 5 | Test /api/ingest/stripe with test webhook | M | W4 | — | I13 |
| I20 | 6 | Test /api/ingest/rating with NPS payload | S | W4 | — | I14 |
| I21 | 7 | Wire L5 evolve → mark(old-gen→new-gen) | M | W3 | I22 | I03 |
| I22 | 7 | Test L5 evolve pheromone deposit | S | W4 | — | I21 |
| I23 | — | Add /api/ingest/stats endpoint | S | W3 | I24 | I11-I14 |
| I24 | — | Test stats: events/sec, edges/hour, coverage% | S | W4 | — | I23 |

## Deliverables

### Cycle 1 Deliverables (Wire)

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `mirrorPay()` in bridge.ts | Sui pay() callable from TS | 0.40/0.20/0.30/0.10 | `grep mirrorPay bridge.ts` | `bridge:pay` |
| 2 | `mirrorHarden()` in bridge.ts | Sui harden() callable from TS | 0.40/0.20/0.30/0.10 | `grep mirrorHarden bridge.ts` | `bridge:harden` |
| 3 | `/api/ingest/stripe` | Stripe webhooks → mark/warn | 0.35/0.20/0.35/0.10 | `curl POST /api/ingest/stripe` | `ingest:stripe` |
| 4 | `/api/ingest/analytics` | Batched page events → mark/warn | 0.35/0.20/0.35/0.10 | `curl POST /api/ingest/analytics` | `ingest:analytics` |

### Cycle 2 Deliverables (Prove)

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `/api/ingest/email` | Email events → mark/warn | 0.35/0.20/0.35/0.10 | `curl POST /api/ingest/email` | `ingest:email` |
| 2 | `/api/ingest/rating` | NPS/tickets → mark/warn | 0.35/0.20/0.35/0.10 | `curl POST /api/ingest/rating` | `ingest:rating` |
| 3 | `/api/ingest/stats` | Flywheel metrics endpoint | 0.30/0.25/0.35/0.10 | `curl GET /api/ingest/stats` | `ingest:stats` |
| 4 | L5 evolve pheromone | Evolved agents mark old→new | 0.40/0.15/0.35/0.10 | vitest evolve.test.ts | `loop:evolve` |

## Exit Criteria

| Wave | Condition |
|------|-----------|
| **W1** | All recon tasks (I01-I05) complete, findings documented |
| **W2** | mirrorPay/mirrorHarden signatures decided, endpoint contracts defined |
| **W3** | All 4 /api/ingest/* endpoints exist, bridge wrappers compile |
| **W4** | `bun run verify` green, testnet txs confirmed, all 4 rubric dims ≥ 0.65 |

## Schema Reference

```tql
# Paths accumulate from ingestion
path sub relation,
  relates source, relates target,
  owns strength, owns resistance, owns revenue, owns traversals;

# Signals are ingestion events
signal sub relation,
  relates sender, relates receiver,
  owns data, owns amount, owns success, owns ts;
```

## Status

- [x] **Cycle 1: WIRE** — Bridge + Stripe + Analytics
  - [x] W1 — Recon (I01-I05)
  - [x] W2 — Decide (I06,I09)
  - [x] W3 — Edit (I07,I08,I10,I11,I13)
  - [x] W4 — Verify (I15-I17,I19)
- [x] **Cycle 2: PROVE** — Email + Rating + Stats + L5
  - [x] W1 — Recon (coverage audit)
  - [x] W2 — Decide (edge cases)
  - [x] W3 — Edit (I12,I14,I21,I23)
  - [x] W4 — Verify (I18,I20,I22,I24)

## See Also

- [ingestion.md](ingestion.md) — 7-tier taxonomy (source of truth)
- [DSL.md](one/DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [buy-and-sell.md](buy-and-sell.md) — commerce signals feed Tier 5
- [revenue.md](one/revenue.md) — five revenue layers all ingestion streams
- [TODO-SUI.md](TODO-SUI.md) — Sui integration phases
- [`src/engine/bridge.ts`](../src/engine/bridge.ts) — mirrorMark/mirrorWarn/mirrorPay/mirrorHarden (all wired)
- [`src/lib/sui.ts`](../src/lib/sui.ts) — pay() and harden() Move calls ready
- [`src/pages/api/signal.ts`](../src/pages/api/signal.ts) — current ingress handler

---

*7 tiers. 4 endpoints. 2 bridge wrappers. One graph.*
