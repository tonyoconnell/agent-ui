# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-17T23:24:08.915Z |
| Test run at | 2026-04-17T23:23:31.665Z |
| Benchmarks measured | 101 named ops, 118 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **36 pass** · **9 over** · 0 missing |
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
| `routing:select:100` | 0.005ms | 0.088 | 0.088 | 0.088 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 1.50 | 1.50 | 1.50 | 1 | ◐ pass (within 3× scale) | search API + rank |
| `routing:follow` | 0.050ms | 0.034 | 0.034 | 0.034 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.117 | 0.117 | 0.117 | 1 | ✗ over |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.017 | 0.017 | 0.017 | 1 | ✗ over | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 0.001 | 0.001 | 0.001 | 1 | ◐ pass (within 3× scale) |  |
| `pheromone:sense` | 0.001ms | 7.36e-5 | 7.36e-5 | 7.36e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 4.28 | 4.28 | 4.28 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.104 | 0.104 | 0.104 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.376 | 0.376 | 0.376 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 27.59 | 27.59 | 27.59 | 1 | ✗ over |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 28.77 | 28.77 | 28.77 | 1 | ✗ over | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 2.48e-4 | 2.48e-4 | 2.48e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.037 | 0.037 | 0.037 | 1 | ✗ over |  |
| `sui:tx:build:movecall` | 0.100ms | 0.519 | 0.519 | 0.519 | 1 | ✗ over |  |
| `sui:sign` | 5.00ms | 7.01 | 7.01 | 7.01 | 1 | ◐ pass (within 3× scale) |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.129 | 0.129 | 0.129 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.033 | 0.033 | 0.033 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 45.87 | 45.87 | 45.87 | 1 | ✗ over | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.083 | 0.083 | 0.083 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.082 | 0.082 | 0.082 | 1 | ✗ over | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 7.56e-4 | 7.56e-4 | 7.56e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 106 | 106 | 106 | 1 | ◐ pass (within 3× scale) |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 7.31e-4 | 7.31e-4 | 7.31e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.130 | 0.130 | 0.130 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.36e-4 | 1.36e-4 | 1.36e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 1.29 | 1.29 | 1.29 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.025 | 0.025 | 0.025 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.049 | 0.049 | 0.049 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 1.10e-4 | 1.10e-4 | 1.10e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.512 | 0.512 | 0.512 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.725 | 0.725 | 0.725 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `naming:scan-src` | 1 | 956 | 956 | 956 |
| `sui:address:derive` | 1 | 20.77 | 20.77 | 20.77 |
| `agents:parse:analyst.md` | 2 | 1.61 | 1.61 | 1.61 |
| `agents:parse:asi-builder.md` | 1 | 7.62 | 7.62 | 7.62 |
| `agents:parse:coder.md` | 1 | 3.25 | 3.25 | 3.25 |
| `agents:parse:community.md` | 2 | 0.353 | 0.353 | 0.353 |
| `agents:parse:concierge.md` | 2 | 0.365 | 0.365 | 0.365 |
| `agents:parse:classify.md` | 1 | 0.149 | 0.149 | 0.149 |
| `agents:parse:valence.md` | 1 | 0.116 | 0.116 | 0.116 |
| `agents:parse:bob.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:lexi.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:ai-ranking.md` | 2 | 1.32 | 1.32 | 1.32 |
| `agents:parse:amara.md` | 1 | 0.476 | 0.476 | 0.476 |
| `agents:parse:assessment.md` | 1 | 1.10 | 1.10 | 1.10 |
| `agents:parse:ceo.md` | 2 | 0.739 | 0.739 | 0.739 |
| `agents:parse:citation.md` | 2 | 2.00 | 2.00 | 2.00 |
| `agents:parse:cmo.md` | 2 | 0.934 | 0.934 | 0.934 |
| `signalSender:mark` | 1 | 0.379 | 0.379 | 0.379 |
| `agents:parse:content.md` | 2 | 31.66 | 31.66 | 31.66 |
| `agents:parse:edu.md` | 1 | 0.965 | 0.965 | 0.965 |
| `agents:parse:enrollment.md` | 1 | 0.675 | 0.675 | 0.675 |
| `agents:parse:forum.md` | 2 | 0.634 | 0.634 | 0.634 |
| `agents:parse:full.md` | 2 | 1.70 | 1.70 | 1.70 |
| `agents:parse:mktg.md` | 1 | 1.37 | 1.37 | 1.37 |
| `agents:parse:monthly.md` | 2 | 2.80 | 2.80 | 2.80 |
| `agents:parse:niche-dir.md` | 2 | 0.696 | 0.696 | 0.696 |
| `agents:parse:outreach.md` | 2 | 2.44 | 2.44 | 2.44 |
| `agents:parse:quick.md` | 2 | 1.63 | 1.63 | 1.63 |
| `agents:parse:sales.md` | 1 | 0.575 | 0.575 | 0.575 |
| `agents:parse:schema.md` | 2 | 2.12 | 2.12 | 2.12 |
| `agents:parse:social.md` | 3 | 1.68 | 5.11 | 5.11 |
| `agents:parse:support.md` | 1 | 0.753 | 0.753 | 0.753 |
| `agents:parse:upsell.md` | 1 | 0.635 | 0.635 | 0.635 |
| `agents:parse:welcome.md` | 1 | 39.00 | 39.00 | 39.00 |
| `agents:parse:designer.md` | 1 | 15.03 | 15.03 | 15.03 |
| `agents:parse:ehc-officer.md` | 1 | 14.03 | 14.03 | 14.03 |
| `agents:parse:eth-dev.md` | 1 | 2.40 | 2.40 | 2.40 |
| `agents:parse:founder.md` | 1 | 2.74 | 2.74 | 2.74 |
| `agents:parse:guard.md` | 1 | 17.11 | 17.11 | 17.11 |
| `agents:parse:harvester.md` | 1 | 8.25 | 8.25 | 8.25 |
| `agents:parse:ads.md` | 1 | 20.85 | 20.85 | 20.85 |
| `agents:parse:creative.md` | 1 | 12.32 | 12.32 | 12.32 |
| `agents:parse:director.md` | 1 | 4.82 | 4.82 | 4.82 |
| `agents:parse:media-buyer.md` | 1 | 1.35 | 1.35 | 1.35 |
| `agents:parse:seo.md` | 1 | 4.62 | 4.62 | 4.62 |
| `agents:parse:nanoclaw.md` | 1 | 2.89 | 2.89 | 2.89 |
| `agents:parse:ops.md` | 1 | 2.20 | 2.20 | 2.20 |
| `agents:parse:researcher.md` | 1 | 0.654 | 0.654 | 0.654 |
| `agents:parse:router.md` | 1 | 4.28 | 4.28 | 4.28 |
| `agents:parse:scout.md` | 1 | 6.57 | 6.57 | 6.57 |
| `agents:parse:teacher.md` | 1 | 5.84 | 5.84 | 5.84 |
| `agents:parse:testnet-buyer.md` | 1 | 0.282 | 0.282 | 0.282 |
| `agents:parse:trader.md` | 1 | 2.59 | 2.59 | 2.59 |
| `agents:parse:tutor.md` | 1 | 2.88 | 2.88 | 2.88 |
| `agents:parse:writer.md` | 1 | 1.48 | 1.48 | 1.48 |
| `edge:cache:hit:sync-path` | 1 | 5.95e-5 | 5.95e-5 | 5.95e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1380/1392 tests · 117860ms across 100 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `tick.test.ts` | 9 | 17704ms |
| `system-speed.test.ts` | 15 | 17005ms |
| `adl-evolution.test.ts` | 7 | 16297ms |
| `learning-acceleration.test.ts` | 20 | 8569ms |
| `sui-speed.test.ts` | 7 | 7200ms |
| `llm.test.ts` | 14 | 6899ms |
| `sui.test.ts` | 6 | 6024ms |
| `llm-router.test.ts` | 12 | 4314ms |
| `adl-cache.test.ts` | 38 | 3871ms |
| `api-endpoints.test.ts` | 21 | 3698ms |

---

_Report generated 2026-04-17T23:24:08.920Z._
