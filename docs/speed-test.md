# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T13:39:19.953Z |
| Test run at | 2026-04-15T13:39:04.926Z |
| Benchmarks measured | 88 named ops, 101 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **43 pass** · **2 over** · 0 missing |
| PERF_SCALE | 3 (practical budget = budget × 3) |

**What's measured here:**

- `routing:*` — `select()`, `follow()` over 100–1,000 path worlds
- `pheromone:*` — `mark()`, `warn()`, `sense()`, `fade()`, `highways()`
- `signal:*` — in-memory dispatch, queue drain, 3-unit `ask()` round-trip
- `identity:*` — Sui keypair derivation (SHA-256 + Ed25519)
- `edge:*` — in-process KV cache hit

How to extend: call `measure('<layer>:<op>', fn, iters)` in any test; the
sample lands here automatically. Add a budget in `scripts/speed-report.ts`
to get a verdict column.

---

## System Benchmarks

### Routing Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `routing:select:100` | 0.005ms | 0.076 | 0.076 | 0.076 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.458 | 0.458 | 0.458 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.043 | 0.043 | 0.043 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.034 | 0.034 | 0.034 | 1 | ✗ over |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.05e-4 | 6.05e-4 | 6.05e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 0.002 | 0.002 | 0.002 | 1 | ◐ pass (within 3× scale) |  |
| `pheromone:sense` | 0.001ms | 1.02e-4 | 1.02e-4 | 1.02e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.921 | 0.921 | 0.921 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 3.68e-4 | 3.68e-4 | 3.68e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.166 | 0.166 | 0.166 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 10.03 | 10.03 | 10.03 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 8.56 | 8.56 | 8.56 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 2.38e-4 | 2.38e-4 | 2.38e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.188 | 0.188 | 0.188 | 1 | ◐ pass (within 3× scale) |  |
| `sui:sign` | 5.00ms | 1.16 | 1.16 | 1.16 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 25.51 | 25.51 | 25.51 | 1 | ◐ pass (within 3× scale) | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 8.46e-4 | 8.46e-4 | 8.46e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.046 | 0.046 | 0.046 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.52e-4 | 2.52e-4 | 2.52e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 18.65 | 18.65 | 18.65 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 5.58e-4 | 5.58e-4 | 5.58e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 2.27e-4 | 2.27e-4 | 2.27e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.715 | 0.715 | 0.715 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.052 | 0.052 | 0.052 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.033 | 0.033 | 0.033 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 5.68e-5 | 5.68e-5 | 5.68e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 1.04 | 1.04 | 1.04 | 1 | ◐ pass (within 3× scale) |  |
| `typedb:read:boot` | 10.00ms | 0.585 | 0.585 | 0.585 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 5.97 | 5.97 | 5.97 |
| `agents:parse:analyst.md` | 2 | 1.58 | 1.58 | 1.58 |
| `agents:parse:asi-builder.md` | 1 | 1.13 | 1.13 | 1.13 |
| `agents:parse:coder.md` | 1 | 0.791 | 0.791 | 0.791 |
| `agents:parse:community.md` | 1 | 0.904 | 0.904 | 0.904 |
| `agents:parse:concierge.md` | 1 | 0.381 | 0.381 | 0.381 |
| `agents:parse:classify.md` | 1 | 0.126 | 0.126 | 0.126 |
| `agents:parse:valence.md` | 1 | 0.254 | 0.254 | 0.254 |
| `agents:parse:ai-ranking.md` | 2 | 0.835 | 0.835 | 0.835 |
| `agents:parse:citation.md` | 2 | 0.263 | 0.263 | 0.263 |
| `agents:parse:cmo.md` | 2 | 0.525 | 0.525 | 0.525 |
| `agents:parse:forum.md` | 2 | 0.410 | 0.410 | 0.410 |
| `agents:parse:full.md` | 2 | 0.883 | 0.883 | 0.883 |
| `agents:parse:monthly.md` | 2 | 0.390 | 0.390 | 0.390 |
| `agents:parse:niche-dir.md` | 2 | 3.03 | 3.03 | 3.03 |
| `agents:parse:outreach.md` | 2 | 0.535 | 0.535 | 0.535 |
| `agents:parse:quick.md` | 2 | 0.332 | 0.332 | 0.332 |
| `agents:parse:schema.md` | 2 | 14.84 | 14.84 | 14.84 |
| `agents:parse:social.md` | 3 | 0.479 | 1.71 | 1.71 |
| `agents:parse:designer.md` | 1 | 0.560 | 0.560 | 0.560 |
| `agents:parse:ehc-officer.md` | 1 | 0.617 | 0.617 | 0.617 |
| `agents:parse:eth-dev.md` | 1 | 0.396 | 0.396 | 0.396 |
| `agents:parse:founder.md` | 1 | 0.316 | 0.316 | 0.316 |
| `agents:parse:guard.md` | 1 | 0.535 | 0.535 | 0.535 |
| `agents:parse:harvester.md` | 1 | 14.05 | 14.05 | 14.05 |
| `agents:parse:ads.md` | 1 | 1.47 | 1.47 | 1.47 |
| `agents:parse:content.md` | 1 | 0.339 | 0.339 | 0.339 |
| `agents:parse:creative.md` | 1 | 0.594 | 0.594 | 0.594 |
| `agents:parse:director.md` | 1 | 0.282 | 0.282 | 0.282 |
| `agents:parse:media-buyer.md` | 1 | 0.603 | 0.603 | 0.603 |
| `agents:parse:seo.md` | 1 | 20.62 | 20.62 | 20.62 |
| `agents:parse:nanoclaw.md` | 1 | 1.22 | 1.22 | 1.22 |
| `agents:parse:ops.md` | 1 | 0.391 | 0.391 | 0.391 |
| `agents:parse:researcher.md` | 1 | 1.27 | 1.27 | 1.27 |
| `agents:parse:router.md` | 1 | 0.783 | 0.783 | 0.783 |
| `agents:parse:scout.md` | 1 | 3.14 | 3.14 | 3.14 |
| `agents:parse:teacher.md` | 1 | 1.33 | 1.33 | 1.33 |
| `agents:parse:trader.md` | 1 | 4.78 | 4.78 | 4.78 |
| `agents:parse:tutor.md` | 1 | 1.06 | 1.06 | 1.06 |
| `agents:parse:writer.md` | 1 | 2.20 | 2.20 | 2.20 |
| `naming:scan-src` | 1 | 553 | 553 | 553 |
| `signalSender:mark` | 1 | 0.125 | 0.125 | 0.125 |
| `edge:cache:hit:sync-path` | 1 | 1.13e-4 | 1.13e-4 | 1.13e-4 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 779/787 tests · 40108ms across 70 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `system-speed.test.ts` | 15 | 7103ms |
| `llm.test.ts` | 14 | 6349ms |
| `llm-router.test.ts` | 12 | 4465ms |
| `sui-speed.test.ts` | 7 | 2665ms |
| `sui.test.ts` | 6 | 2307ms |
| `agents.test.ts` | 5 | 2182ms |
| `adl-evolution.test.ts` | 3 | 1975ms |
| `adl-cache.test.ts` | 15 | 1850ms |
| `page-speed.test.ts` | 4 | 1525ms |
| `api-key.test.ts` | 13 | 1190ms |

---

_Report generated 2026-04-15T13:39:19.963Z._
