# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T23:26:02.930Z |
| Test run at | 2026-04-15T23:25:55.700Z |
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
| `routing:select:100` | 0.005ms | 0.007 | 0.007 | 0.007 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.088 | 0.088 | 0.088 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.06e-4 | 3.06e-4 | 3.06e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.41e-4 | 1.41e-4 | 1.41e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.88e-5 | 4.88e-5 | 4.88e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.169 | 0.169 | 0.169 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.36e-4 | 1.36e-4 | 1.36e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.04 | 3.04 | 3.04 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.00 | 3.00 | 3.00 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.54e-4 | 1.54e-4 | 1.54e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.030 | 0.030 | 0.030 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.425 | 0.425 | 0.425 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.85 | 5.85 | 5.85 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.87e-4 | 2.87e-4 | 2.87e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.11e-4 | 2.11e-4 | 2.11e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.48 | 2.48 | 2.48 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.32e-4 | 4.32e-4 | 4.32e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 8.01e-4 | 8.01e-4 | 8.01e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 8.64e-4 | 8.64e-4 | 8.64e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.12e-4 | 1.12e-4 | 1.12e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.87e-5 | 7.87e-5 | 7.87e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.437 | 0.437 | 0.437 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 2.53e-4 | 2.53e-4 | 2.53e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.092 | 0.092 | 0.092 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.104 | 0.104 | 0.104 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.69 | 2.69 | 2.69 |
| `agents:parse:analyst.md` | 2 | 0.204 | 0.204 | 0.204 |
| `agents:parse:asi-builder.md` | 1 | 0.273 | 0.273 | 0.273 |
| `agents:parse:coder.md` | 1 | 0.203 | 0.203 | 0.203 |
| `agents:parse:community.md` | 1 | 0.374 | 0.374 | 0.374 |
| `agents:parse:concierge.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:classify.md` | 1 | 0.100 | 0.100 | 0.100 |
| `agents:parse:valence.md` | 1 | 0.082 | 0.082 | 0.082 |
| `agents:parse:ai-ranking.md` | 2 | 0.287 | 0.287 | 0.287 |
| `agents:parse:citation.md` | 2 | 0.157 | 0.157 | 0.157 |
| `agents:parse:cmo.md` | 2 | 0.445 | 0.445 | 0.445 |
| `agents:parse:forum.md` | 2 | 0.617 | 0.617 | 0.617 |
| `agents:parse:full.md` | 2 | 0.223 | 0.223 | 0.223 |
| `agents:parse:monthly.md` | 2 | 0.166 | 0.166 | 0.166 |
| `agents:parse:niche-dir.md` | 2 | 0.454 | 0.454 | 0.454 |
| `agents:parse:outreach.md` | 2 | 0.237 | 0.237 | 0.237 |
| `agents:parse:quick.md` | 2 | 0.311 | 0.311 | 0.311 |
| `agents:parse:schema.md` | 2 | 0.671 | 0.671 | 0.671 |
| `agents:parse:social.md` | 3 | 0.297 | 0.498 | 0.498 |
| `agents:parse:designer.md` | 1 | 0.271 | 0.271 | 0.271 |
| `agents:parse:ehc-officer.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:eth-dev.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:founder.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:guard.md` | 1 | 0.126 | 0.126 | 0.126 |
| `agents:parse:harvester.md` | 1 | 0.254 | 0.254 | 0.254 |
| `agents:parse:ads.md` | 1 | 0.192 | 0.192 | 0.192 |
| `agents:parse:content.md` | 1 | 0.319 | 0.319 | 0.319 |
| `agents:parse:creative.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:director.md` | 1 | 0.154 | 0.154 | 0.154 |
| `agents:parse:media-buyer.md` | 1 | 0.487 | 0.487 | 0.487 |
| `agents:parse:seo.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:nanoclaw.md` | 1 | 0.187 | 0.187 | 0.187 |
| `agents:parse:ops.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:researcher.md` | 1 | 0.147 | 0.147 | 0.147 |
| `agents:parse:router.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:scout.md` | 1 | 0.123 | 0.123 | 0.123 |
| `agents:parse:teacher.md` | 1 | 0.320 | 0.320 | 0.320 |
| `agents:parse:trader.md` | 1 | 0.184 | 0.184 | 0.184 |
| `agents:parse:tutor.md` | 1 | 0.141 | 0.141 | 0.141 |
| `agents:parse:writer.md` | 1 | 0.138 | 0.138 | 0.138 |
| `naming:scan-src` | 1 | 107 | 107 | 107 |
| `signalSender:mark` | 1 | 0.041 | 0.041 | 0.041 |
| `edge:cache:hit:sync-path` | 1 | 4.30e-5 | 4.30e-5 | 4.30e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1230/1241 tests · 19017ms across 94 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6076ms |
| `llm-router.test.ts` | 12 | 3832ms |
| `adl-evolution.test.ts` | 7 | 1399ms |
| `system-speed.test.ts` | 15 | 1308ms |
| `sui-speed.test.ts` | 7 | 740ms |
| `sui.test.ts` | 6 | 525ms |
| `adl-llm.test.ts` | 5 | 513ms |
| `learning-acceleration.test.ts` | 20 | 406ms |
| `adl-cache.test.ts` | 38 | 342ms |
| `api-key.test.ts` | 13 | 279ms |

---

_Report generated 2026-04-15T23:26:02.943Z._
