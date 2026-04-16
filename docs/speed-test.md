# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-16T00:07:31.716Z |
| Test run at | 2026-04-16T00:07:24.898Z |
| Benchmarks measured | 88 named ops, 101 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **45 pass** · **0 over** · 0 missing |
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
| `routing:select:100` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.078 | 0.078 | 0.078 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 4.46e-4 | 4.46e-4 | 4.46e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.59e-4 | 1.59e-4 | 1.59e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.61e-5 | 4.61e-5 | 4.61e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.132 | 0.132 | 0.132 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 8.49e-4 | 8.49e-4 | 8.49e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.26e-4 | 1.26e-4 | 1.26e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 8.84e-4 | 8.84e-4 | 8.84e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.46 | 2.46 | 2.46 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.78e-4 | 2.78e-4 | 2.78e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.58 | 2.58 | 2.58 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.43e-4 | 1.43e-4 | 1.43e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.038 | 0.038 | 0.038 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.361 | 0.361 | 0.361 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 4.63 | 4.63 | 4.63 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.89e-4 | 2.89e-4 | 2.89e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.83e-4 | 2.83e-4 | 2.83e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.63 | 3.63 | 3.63 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 4.70e-4 | 4.70e-4 | 4.70e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.78e-4 | 2.78e-4 | 2.78e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.43e-5 | 7.43e-5 | 7.43e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.193 | 0.193 | 0.193 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.53e-5 | 4.53e-5 | 4.53e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.102 | 0.102 | 0.102 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.152 | 0.152 | 0.152 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.22 | 2.22 | 2.22 |
| `naming:scan-src` | 1 | 51.80 | 51.80 | 51.80 |
| `agents:parse:analyst.md` | 2 | 0.361 | 0.361 | 0.361 |
| `agents:parse:asi-builder.md` | 1 | 0.293 | 0.293 | 0.293 |
| `agents:parse:coder.md` | 1 | 0.231 | 0.231 | 0.231 |
| `agents:parse:community.md` | 1 | 0.292 | 0.292 | 0.292 |
| `agents:parse:concierge.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:classify.md` | 1 | 0.090 | 0.090 | 0.090 |
| `agents:parse:valence.md` | 1 | 0.104 | 0.104 | 0.104 |
| `agents:parse:ai-ranking.md` | 2 | 0.455 | 0.455 | 0.455 |
| `agents:parse:citation.md` | 2 | 0.205 | 0.205 | 0.205 |
| `agents:parse:cmo.md` | 2 | 0.317 | 0.317 | 0.317 |
| `agents:parse:forum.md` | 2 | 0.194 | 0.194 | 0.194 |
| `agents:parse:full.md` | 2 | 0.233 | 0.233 | 0.233 |
| `agents:parse:monthly.md` | 2 | 0.495 | 0.495 | 0.495 |
| `agents:parse:niche-dir.md` | 2 | 0.174 | 0.174 | 0.174 |
| `agents:parse:outreach.md` | 2 | 0.172 | 0.172 | 0.172 |
| `agents:parse:quick.md` | 2 | 0.313 | 0.313 | 0.313 |
| `agents:parse:schema.md` | 2 | 0.520 | 0.520 | 0.520 |
| `agents:parse:social.md` | 3 | 0.211 | 0.630 | 0.630 |
| `agents:parse:designer.md` | 1 | 0.434 | 0.434 | 0.434 |
| `agents:parse:ehc-officer.md` | 1 | 0.524 | 0.524 | 0.524 |
| `agents:parse:eth-dev.md` | 1 | 0.668 | 0.668 | 0.668 |
| `agents:parse:founder.md` | 1 | 0.916 | 0.916 | 0.916 |
| `agents:parse:guard.md` | 1 | 0.174 | 0.174 | 0.174 |
| `agents:parse:harvester.md` | 1 | 0.422 | 0.422 | 0.422 |
| `agents:parse:ads.md` | 1 | 0.200 | 0.200 | 0.200 |
| `agents:parse:content.md` | 1 | 0.525 | 0.525 | 0.525 |
| `agents:parse:creative.md` | 1 | 0.422 | 0.422 | 0.422 |
| `agents:parse:director.md` | 1 | 0.489 | 0.489 | 0.489 |
| `agents:parse:media-buyer.md` | 1 | 0.241 | 0.241 | 0.241 |
| `agents:parse:seo.md` | 1 | 1.80 | 1.80 | 1.80 |
| `agents:parse:nanoclaw.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:ops.md` | 1 | 0.992 | 0.992 | 0.992 |
| `agents:parse:researcher.md` | 1 | 2.16 | 2.16 | 2.16 |
| `agents:parse:router.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:scout.md` | 1 | 0.135 | 0.135 | 0.135 |
| `agents:parse:teacher.md` | 1 | 0.345 | 0.345 | 0.345 |
| `agents:parse:trader.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:tutor.md` | 1 | 0.151 | 0.151 | 0.151 |
| `agents:parse:writer.md` | 1 | 0.145 | 0.145 | 0.145 |
| `signalSender:mark` | 1 | 0.032 | 0.032 | 0.032 |
| `edge:cache:hit:sync-path` | 1 | 4.26e-5 | 4.26e-5 | 4.26e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1232/1241 tests · 18319ms across 94 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6072ms |
| `llm-router.test.ts` | 12 | 3744ms |
| `adl-evolution.test.ts` | 7 | 1238ms |
| `system-speed.test.ts` | 15 | 1136ms |
| `sui-speed.test.ts` | 7 | 634ms |
| `sui.test.ts` | 6 | 581ms |
| `adl-llm.test.ts` | 5 | 571ms |
| `learning-acceleration.test.ts` | 20 | 377ms |
| `adl-cache.test.ts` | 38 | 347ms |
| `api-key.test.ts` | 13 | 275ms |

---

_Report generated 2026-04-16T00:07:31.718Z._
