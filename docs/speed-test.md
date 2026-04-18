# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T15:20:23.307Z |
| Test run at | 2026-04-18T15:19:58.538Z |
| Benchmarks measured | 104 named ops, 125 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **41 pass** · **4 over** · 0 missing |
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
| `routing:select:100` | 0.005ms | 0.023 | 0.023 | 0.023 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.540 | 0.540 | 0.540 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.029 | 0.029 | 0.029 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.018 | 0.018 | 0.018 | 1 | ✗ over |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.002 | 0.002 | 0.002 | 1 | ◐ pass (within 3× scale) | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 0.002 | 0.002 | 0.002 | 1 | ◐ pass (within 3× scale) |  |
| `pheromone:sense` | 0.001ms | 5.72e-4 | 5.72e-4 | 5.72e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.677 | 0.677 | 0.677 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 3.82e-4 | 3.82e-4 | 3.82e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.093 | 0.093 | 0.093 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 13.40 | 13.40 | 13.40 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 12.86 | 12.86 | 12.86 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 0.001 | 0.001 | 0.001 | 1 | ◐ pass (within 3× scale) |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.086 | 0.086 | 0.086 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 2.17 | 2.17 | 2.17 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.511 | 0.511 | 0.511 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.033 | 0.033 | 0.033 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 32.01 | 32.01 | 32.01 | 1 | ✗ over | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 7.21e-4 | 7.21e-4 | 7.21e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.163 | 0.163 | 0.163 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.044 | 0.044 | 0.044 | 1 | ✗ over | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.37e-4 | 2.37e-4 | 2.37e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 6.47 | 6.47 | 6.47 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 6.06e-4 | 6.06e-4 | 6.06e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 5.57e-4 | 5.57e-4 | 5.57e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.025 | 0.025 | 0.025 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.77e-4 | 2.77e-4 | 2.77e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.99e-4 | 1.99e-4 | 1.99e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.708 | 0.708 | 0.708 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.049 | 0.049 | 0.049 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.094 | 0.094 | 0.094 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.032 | 0.032 | 0.032 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 9.85e-5 | 9.85e-5 | 9.85e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.501 | 0.501 | 0.501 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.819 | 0.819 | 0.819 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `agents:parse:analyst.md` | 2 | 1.15 | 1.15 | 1.15 |
| `agents:parse:asi-builder.md` | 1 | 5.79 | 5.79 | 5.79 |
| `agents:parse:coder.md` | 1 | 1.29 | 1.29 | 1.29 |
| `agents:parse:community.md` | 2 | 3.01 | 3.01 | 3.01 |
| `agents:parse:concierge.md` | 3 | 0.366 | 2.71 | 2.71 |
| `agents:parse:classify.md` | 1 | 0.121 | 0.121 | 0.121 |
| `agents:parse:valence.md` | 1 | 0.113 | 0.113 | 0.113 |
| `agents:parse:bob.md` | 1 | 2.12 | 2.12 | 2.12 |
| `agents:parse:lexi.md` | 1 | 0.185 | 0.185 | 0.185 |
| `agents:parse:ai-ranking.md` | 2 | 0.661 | 0.661 | 0.661 |
| `agents:parse:amara.md` | 1 | 0.539 | 0.539 | 0.539 |
| `agents:parse:assessment.md` | 1 | 7.06 | 7.06 | 7.06 |
| `agents:parse:ceo.md` | 2 | 7.52 | 7.52 | 7.52 |
| `agents:parse:citation.md` | 2 | 1.62 | 1.62 | 1.62 |
| `agents:parse:cmo.md` | 3 | 1.47 | 3.99 | 3.99 |
| `agents:parse:content.md` | 2 | 2.42 | 2.42 | 2.42 |
| `agents:parse:edu.md` | 1 | 0.760 | 0.760 | 0.760 |
| `agents:parse:enrollment.md` | 1 | 1.38 | 1.38 | 1.38 |
| `agents:parse:forum.md` | 2 | 1.06 | 1.06 | 1.06 |
| `agents:parse:full.md` | 2 | 1.08 | 1.08 | 1.08 |
| `agents:parse:mktg.md` | 1 | 0.251 | 0.251 | 0.251 |
| `agents:parse:monthly.md` | 2 | 0.289 | 0.289 | 0.289 |
| `agents:parse:niche-dir.md` | 2 | 1.89 | 1.89 | 1.89 |
| `agents:parse:outreach.md` | 2 | 1.35 | 1.35 | 1.35 |
| `agents:parse:quick.md` | 2 | 1.09 | 1.09 | 1.09 |
| `agents:parse:sales.md` | 1 | 0.309 | 0.309 | 0.309 |
| `agents:parse:schema.md` | 2 | 1.14 | 1.14 | 1.14 |
| `agents:parse:social.md` | 3 | 0.343 | 0.421 | 0.421 |
| `agents:parse:support.md` | 1 | 1.96 | 1.96 | 1.96 |
| `agents:parse:upsell.md` | 1 | 0.339 | 0.339 | 0.339 |
| `agents:parse:welcome.md` | 1 | 0.179 | 0.179 | 0.179 |
| `agents:parse:designer.md` | 1 | 0.252 | 0.252 | 0.252 |
| `agents:parse:ehc-officer.md` | 1 | 0.440 | 0.440 | 0.440 |
| `agents:parse:eth-dev.md` | 1 | 0.304 | 0.304 | 0.304 |
| `agents:parse:founder.md` | 1 | 1.01 | 1.01 | 1.01 |
| `agents:parse:guard.md` | 1 | 0.512 | 0.512 | 0.512 |
| `agents:parse:harvester.md` | 1 | 0.172 | 0.172 | 0.172 |
| `agents:parse:ads.md` | 1 | 0.390 | 0.390 | 0.390 |
| `agents:parse:creative.md` | 1 | 0.276 | 0.276 | 0.276 |
| `agents:parse:director.md` | 1 | 0.228 | 0.228 | 0.228 |
| `agents:parse:media-buyer.md` | 1 | 0.580 | 0.580 | 0.580 |
| `agents:parse:seo.md` | 1 | 0.306 | 0.306 | 0.306 |
| `agents:parse:nanoclaw.md` | 1 | 0.237 | 0.237 | 0.237 |
| `agents:parse:ops.md` | 1 | 0.734 | 0.734 | 0.734 |
| `agents:parse:researcher.md` | 2 | 0.514 | 0.514 | 0.514 |
| `agents:parse:tutor.md` | 2 | 0.499 | 0.499 | 0.499 |
| `agents:parse:world.md` | 1 | 0.114 | 0.114 | 0.114 |
| `agents:parse:cfo.md` | 1 | 0.543 | 0.543 | 0.543 |
| `agents:parse:cto.md` | 1 | 0.635 | 0.635 | 0.635 |
| `agents:parse:router.md` | 1 | 0.344 | 0.344 | 0.344 |
| `agents:parse:scout.md` | 1 | 0.558 | 0.558 | 0.558 |
| `agents:parse:teacher.md` | 1 | 1.12 | 1.12 | 1.12 |
| `agents:parse:testnet-buyer.md` | 1 | 0.617 | 0.617 | 0.617 |
| `agents:parse:trader.md` | 1 | 2.88 | 2.88 | 2.88 |
| `agents:parse:writer.md` | 1 | 0.466 | 0.466 | 0.466 |
| `sui:address:derive` | 1 | 10.42 | 10.42 | 10.42 |
| `naming:scan-src` | 1 | 319 | 319 | 319 |
| `signalSender:mark` | 1 | 0.252 | 0.252 | 0.252 |
| `edge:cache:hit:sync-path` | 1 | 4.54e-5 | 4.54e-5 | 4.54e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1568/1603 tests · 55260ms across 119 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `system-speed.test.ts` | 15 | 6453ms |
| `llm.test.ts` | 14 | 6438ms |
| `adl-evolution.test.ts` | 7 | 5046ms |
| `phase2-keypair-derivation.test.ts` | 14 | 4730ms |
| `llm-router.test.ts` | 12 | 4119ms |
| `sui-speed.test.ts` | 7 | 2478ms |
| `agentverse-connect.test.ts` | 9 | 2457ms |
| `sui.test.ts` | 6 | 2131ms |
| `learning-acceleration.test.ts` | 20 | 1990ms |
| `adl-llm.test.ts` | 5 | 1532ms |

---

_Report generated 2026-04-18T15:20:23.329Z._
