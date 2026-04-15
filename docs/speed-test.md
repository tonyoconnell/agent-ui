# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T20:43:56.339Z |
| Test run at | 2026-04-15T20:43:36.290Z |
| Benchmarks measured | 67 named ops, 72 samples |
| Budget coverage | 31 / 45 operations |
| Verdict | **30 pass** · **1 over** · 14 missing |
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
| `routing:select:100` | 0.005ms | 0.032 | 0.032 | 0.032 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.327 | 0.327 | 0.327 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | — | — | — | 0 | _no data_ |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | — | — | — | 0 | _no data_ | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | — | — | — | 0 | _no data_ |  |
| `pheromone:sense` | 0.001ms | — | — | — | 0 | _no data_ |  |
| `pheromone:fade:1000` | 5.00ms | — | — | — | 0 | _no data_ |  |
| `pheromone:highways:top10` | 5.00ms | — | — | — | 0 | _no data_ |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | — | — | — | 0 | _no data_ | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `signal:queue:roundtrip` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `signal:ask:chain-3` | 100ms | — | — | — | 0 | _no data_ | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 8.01 | 8.01 | 8.01 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 11.06 | 11.06 | 11.06 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.79e-4 | 1.79e-4 | 1.79e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.080 | 0.080 | 0.080 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 2.26 | 2.26 | 2.26 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 11.78 | 11.78 | 11.78 | 1 | ◐ pass (within 3× scale) | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.36e-4 | 3.36e-4 | 3.36e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.057 | 0.057 | 0.057 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.65e-4 | 2.65e-4 | 2.65e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 11.45 | 11.45 | 11.45 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 5.55e-4 | 5.55e-4 | 5.55e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 9.58e-4 | 9.58e-4 | 9.58e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.045 | 0.045 | 0.045 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.35e-4 | 2.35e-4 | 2.35e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 2.76e-4 | 2.76e-4 | 2.76e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.804 | 0.804 | 0.804 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.037 | 0.037 | 0.037 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.020 | 0.020 | 0.020 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.097 | 0.097 | 0.097 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | — | — | — | 0 | _no data_ | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | — | — | — | 0 | _no data_ |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `typedb:read:boot` | 10.00ms | — | — | — | 0 | _no data_ |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `agents:parse:outreach.md` | 2 | 0.611 | 0.611 | 0.611 |
| `agents:parse:quick.md` | 2 | 0.614 | 0.614 | 0.614 |
| `agents:parse:schema.md` | 2 | 2.15 | 2.15 | 2.15 |
| `agents:parse:social.md` | 3 | 1.45 | 4.76 | 4.76 |
| `agents:parse:designer.md` | 1 | 0.577 | 0.577 | 0.577 |
| `agents:parse:ai-ranking.md` | 1 | 0.247 | 0.247 | 0.247 |
| `agents:parse:citation.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:cmo.md` | 1 | 0.288 | 0.288 | 0.288 |
| `agents:parse:forum.md` | 1 | 0.185 | 0.185 | 0.185 |
| `agents:parse:full.md` | 1 | 0.564 | 0.564 | 0.564 |
| `agents:parse:monthly.md` | 1 | 0.724 | 0.724 | 0.724 |
| `agents:parse:niche-dir.md` | 1 | 0.178 | 0.178 | 0.178 |
| `agents:parse:ehc-officer.md` | 1 | 0.373 | 0.373 | 0.373 |
| `agents:parse:eth-dev.md` | 1 | 0.753 | 0.753 | 0.753 |
| `agents:parse:founder.md` | 1 | 0.718 | 0.718 | 0.718 |
| `agents:parse:guard.md` | 1 | 0.930 | 0.930 | 0.930 |
| `agents:parse:harvester.md` | 1 | 0.923 | 0.923 | 0.923 |
| `agents:parse:ads.md` | 1 | 1.61 | 1.61 | 1.61 |
| `agents:parse:analyst.md` | 1 | 0.650 | 0.650 | 0.650 |
| `agents:parse:content.md` | 1 | 0.708 | 0.708 | 0.708 |
| `agents:parse:creative.md` | 1 | 0.737 | 0.737 | 0.737 |
| `agents:parse:director.md` | 1 | 0.217 | 0.217 | 0.217 |
| `agents:parse:media-buyer.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:seo.md` | 1 | 0.664 | 0.664 | 0.664 |
| `agents:parse:nanoclaw.md` | 1 | 1.38 | 1.38 | 1.38 |
| `agents:parse:ops.md` | 1 | 5.45 | 5.45 | 5.45 |
| `agents:parse:researcher.md` | 1 | 16.10 | 16.10 | 16.10 |
| `agents:parse:router.md` | 1 | 0.357 | 0.357 | 0.357 |
| `agents:parse:scout.md` | 1 | 0.386 | 0.386 | 0.386 |
| `agents:parse:teacher.md` | 1 | 0.427 | 0.427 | 0.427 |
| `agents:parse:trader.md` | 1 | 0.242 | 0.242 | 0.242 |
| `agents:parse:tutor.md` | 1 | 0.171 | 0.171 | 0.171 |
| `agents:parse:writer.md` | 1 | 0.163 | 0.163 | 0.163 |
| `signalSender:mark` | 1 | 0.059 | 0.059 | 0.059 |
| `sui:address:derive` | 1 | 10.46 | 10.46 | 10.46 |
| `edge:cache:hit:sync-path` | 1 | 4.90e-5 | 4.90e-5 | 4.90e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1146/1156 tests · 21082ms across 90 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6120ms |
| `llm-router.test.ts` | 12 | 3570ms |
| `adl-evolution.test.ts` | 7 | 1723ms |
| `system-speed.test.ts` | 15 | 1453ms |
| `sui-speed.test.ts` | 7 | 1275ms |
| `sui.test.ts` | 6 | 1081ms |
| `adl-llm.test.ts` | 5 | 803ms |
| `learning-acceleration.test.ts` | 20 | 592ms |
| `adl-cache.test.ts` | 38 | 390ms |
| `api-key.test.ts` | 13 | 342ms |

---

_Report generated 2026-04-15T20:43:56.341Z._
