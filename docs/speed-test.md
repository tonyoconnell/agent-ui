# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-17T22:37:25.384Z |
| Test run at | 2026-04-17T22:37:18.522Z |
| Benchmarks measured | 101 named ops, 117 samples |
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
| `routing:select:100` | 0.005ms | 0.008 | 0.008 | 0.008 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.112 | 0.112 | 0.112 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 8.10e-4 | 8.10e-4 | 8.10e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.78e-4 | 1.78e-4 | 1.78e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.15e-5 | 5.15e-5 | 5.15e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.196 | 0.196 | 0.196 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 7.92e-4 | 7.92e-4 | 7.92e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 4.53e-4 | 4.53e-4 | 4.53e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 9.56e-4 | 9.56e-4 | 9.56e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.083 | 0.083 | 0.083 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.54 | 2.54 | 2.54 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 5.08e-4 | 5.08e-4 | 5.08e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.05 | 3.05 | 3.05 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.72e-4 | 1.72e-4 | 1.72e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.563 | 0.563 | 0.563 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.217 | 0.217 | 0.217 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 6.35 | 6.35 | 6.35 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.87e-4 | 3.87e-4 | 3.87e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.28e-4 | 2.28e-4 | 2.28e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.89 | 3.89 | 3.89 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 5.64e-4 | 5.64e-4 | 5.64e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 5.62e-4 | 5.62e-4 | 5.62e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.05e-4 | 2.05e-4 | 2.05e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.16e-4 | 1.16e-4 | 1.16e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.348 | 0.348 | 0.348 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 2.62e-4 | 2.62e-4 | 2.62e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.128 | 0.128 | 0.128 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.119 | 0.119 | 0.119 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.76 | 2.76 | 2.76 |
| `naming:scan-src` | 1 | 65.86 | 65.86 | 65.86 |
| `agents:parse:analyst.md` | 2 | 0.209 | 0.209 | 0.209 |
| `agents:parse:asi-builder.md` | 1 | 0.419 | 0.419 | 0.419 |
| `agents:parse:coder.md` | 1 | 0.279 | 0.279 | 0.279 |
| `agents:parse:community.md` | 2 | 0.781 | 0.781 | 0.781 |
| `agents:parse:concierge.md` | 2 | 0.236 | 0.236 | 0.236 |
| `agents:parse:classify.md` | 1 | 0.096 | 0.096 | 0.096 |
| `agents:parse:valence.md` | 1 | 0.242 | 0.242 | 0.242 |
| `agents:parse:bob.md` | 1 | 0.192 | 0.192 | 0.192 |
| `agents:parse:lexi.md` | 1 | 0.149 | 0.149 | 0.149 |
| `agents:parse:ai-ranking.md` | 2 | 0.337 | 0.337 | 0.337 |
| `agents:parse:amara.md` | 1 | 0.306 | 0.306 | 0.306 |
| `agents:parse:assessment.md` | 1 | 0.377 | 0.377 | 0.377 |
| `agents:parse:ceo.md` | 1 | 0.249 | 0.249 | 0.249 |
| `agents:parse:citation.md` | 2 | 0.373 | 0.373 | 0.373 |
| `agents:parse:cmo.md` | 2 | 0.594 | 0.594 | 0.594 |
| `agents:parse:content.md` | 2 | 0.211 | 0.211 | 0.211 |
| `agents:parse:edu.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:enrollment.md` | 1 | 0.189 | 0.189 | 0.189 |
| `agents:parse:forum.md` | 2 | 0.170 | 0.170 | 0.170 |
| `agents:parse:full.md` | 2 | 0.164 | 0.164 | 0.164 |
| `agents:parse:mktg.md` | 1 | 0.230 | 0.230 | 0.230 |
| `agents:parse:monthly.md` | 2 | 0.552 | 0.552 | 0.552 |
| `agents:parse:niche-dir.md` | 2 | 0.374 | 0.374 | 0.374 |
| `agents:parse:outreach.md` | 2 | 0.168 | 0.168 | 0.168 |
| `agents:parse:quick.md` | 2 | 0.442 | 0.442 | 0.442 |
| `agents:parse:sales.md` | 1 | 0.188 | 0.188 | 0.188 |
| `agents:parse:schema.md` | 2 | 0.207 | 0.207 | 0.207 |
| `agents:parse:social.md` | 3 | 0.189 | 0.324 | 0.324 |
| `agents:parse:support.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:upsell.md` | 1 | 0.184 | 0.184 | 0.184 |
| `agents:parse:welcome.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:designer.md` | 1 | 0.218 | 0.218 | 0.218 |
| `agents:parse:ehc-officer.md` | 1 | 0.588 | 0.588 | 0.588 |
| `agents:parse:eth-dev.md` | 1 | 0.274 | 0.274 | 0.274 |
| `agents:parse:founder.md` | 1 | 0.214 | 0.214 | 0.214 |
| `agents:parse:guard.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:harvester.md` | 1 | 0.139 | 0.139 | 0.139 |
| `agents:parse:ads.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:creative.md` | 1 | 0.200 | 0.200 | 0.200 |
| `agents:parse:director.md` | 1 | 0.471 | 0.471 | 0.471 |
| `agents:parse:media-buyer.md` | 1 | 0.265 | 0.265 | 0.265 |
| `agents:parse:seo.md` | 1 | 0.264 | 0.264 | 0.264 |
| `agents:parse:nanoclaw.md` | 1 | 0.221 | 0.221 | 0.221 |
| `agents:parse:ops.md` | 1 | 0.230 | 0.230 | 0.230 |
| `agents:parse:researcher.md` | 1 | 0.823 | 0.823 | 0.823 |
| `agents:parse:router.md` | 1 | 0.179 | 0.179 | 0.179 |
| `agents:parse:scout.md` | 1 | 0.209 | 0.209 | 0.209 |
| `agents:parse:teacher.md` | 1 | 0.472 | 0.472 | 0.472 |
| `agents:parse:testnet-buyer.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:trader.md` | 1 | 0.318 | 0.318 | 0.318 |
| `agents:parse:tutor.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:writer.md` | 1 | 0.160 | 0.160 | 0.160 |
| `signalSender:mark` | 1 | 0.047 | 0.047 | 0.047 |
| `edge:cache:hit:sync-path` | 1 | 4.81e-5 | 4.81e-5 | 4.81e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1371/1380 tests · 21489ms across 99 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6077ms |
| `llm-router.test.ts` | 12 | 4334ms |
| `adl-evolution.test.ts` | 7 | 1979ms |
| `system-speed.test.ts` | 15 | 1407ms |
| `sui-speed.test.ts` | 7 | 778ms |
| `sui.test.ts` | 6 | 687ms |
| `adl-llm.test.ts` | 5 | 640ms |
| `learning-acceleration.test.ts` | 20 | 584ms |
| `adl-cache.test.ts` | 38 | 452ms |
| `api-key.test.ts` | 13 | 368ms |

---

_Report generated 2026-04-17T22:37:25.386Z._
