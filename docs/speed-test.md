# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T23:59:06.603Z |
| Test run at | 2026-04-15T23:58:59.725Z |
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
| `routing:select:100` | 0.005ms | 0.008 | 0.008 | 0.008 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.116 | 0.116 | 0.116 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.07e-4 | 3.07e-4 | 3.07e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.58e-4 | 1.58e-4 | 1.58e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 1.17e-4 | 1.17e-4 | 1.17e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.181 | 0.181 | 0.181 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.29e-4 | 1.29e-4 | 1.29e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 8.33e-4 | 8.33e-4 | 8.33e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.61 | 2.61 | 2.61 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.70e-4 | 2.70e-4 | 2.70e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.61 | 3.61 | 3.61 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.49e-4 | 1.49e-4 | 1.49e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.030 | 0.030 | 0.030 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.490 | 0.490 | 0.490 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 4.84 | 4.84 | 4.84 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.86e-4 | 2.86e-4 | 2.86e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.11e-4 | 2.11e-4 | 2.11e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 4.79 | 4.79 | 4.79 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.16e-4 | 4.16e-4 | 4.16e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 5.72e-4 | 5.72e-4 | 5.72e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.94e-4 | 2.94e-4 | 2.94e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.38e-4 | 1.38e-4 | 1.38e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.167 | 0.167 | 0.167 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 2.66e-4 | 2.66e-4 | 2.66e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.098 | 0.098 | 0.098 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.105 | 0.105 | 0.105 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `naming:scan-src` | 1 | 71.09 | 71.09 | 71.09 |
| `sui:address:derive` | 1 | 2.58 | 2.58 | 2.58 |
| `agents:parse:analyst.md` | 2 | 0.325 | 0.325 | 0.325 |
| `agents:parse:asi-builder.md` | 1 | 0.294 | 0.294 | 0.294 |
| `agents:parse:coder.md` | 1 | 0.220 | 0.220 | 0.220 |
| `agents:parse:community.md` | 1 | 0.298 | 0.298 | 0.298 |
| `agents:parse:concierge.md` | 1 | 0.254 | 0.254 | 0.254 |
| `agents:parse:classify.md` | 1 | 0.182 | 0.182 | 0.182 |
| `agents:parse:valence.md` | 1 | 0.102 | 0.102 | 0.102 |
| `agents:parse:ai-ranking.md` | 2 | 0.398 | 0.398 | 0.398 |
| `agents:parse:citation.md` | 2 | 0.274 | 0.274 | 0.274 |
| `agents:parse:cmo.md` | 2 | 0.254 | 0.254 | 0.254 |
| `agents:parse:forum.md` | 2 | 0.272 | 0.272 | 0.272 |
| `agents:parse:full.md` | 2 | 0.187 | 0.187 | 0.187 |
| `agents:parse:monthly.md` | 2 | 0.160 | 0.160 | 0.160 |
| `agents:parse:niche-dir.md` | 2 | 0.263 | 0.263 | 0.263 |
| `agents:parse:outreach.md` | 2 | 0.168 | 0.168 | 0.168 |
| `agents:parse:quick.md` | 2 | 0.169 | 0.169 | 0.169 |
| `agents:parse:schema.md` | 2 | 0.161 | 0.161 | 0.161 |
| `agents:parse:social.md` | 3 | 0.191 | 0.201 | 0.201 |
| `agents:parse:designer.md` | 1 | 0.251 | 0.251 | 0.251 |
| `agents:parse:ehc-officer.md` | 1 | 0.253 | 0.253 | 0.253 |
| `agents:parse:eth-dev.md` | 1 | 0.429 | 0.429 | 0.429 |
| `agents:parse:founder.md` | 1 | 0.231 | 0.231 | 0.231 |
| `agents:parse:guard.md` | 1 | 0.132 | 0.132 | 0.132 |
| `agents:parse:harvester.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:ads.md` | 1 | 0.211 | 0.211 | 0.211 |
| `agents:parse:content.md` | 1 | 0.231 | 0.231 | 0.231 |
| `agents:parse:creative.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:director.md` | 1 | 0.162 | 0.162 | 0.162 |
| `agents:parse:media-buyer.md` | 1 | 0.276 | 0.276 | 0.276 |
| `agents:parse:seo.md` | 1 | 0.192 | 0.192 | 0.192 |
| `agents:parse:nanoclaw.md` | 1 | 0.198 | 0.198 | 0.198 |
| `agents:parse:ops.md` | 1 | 0.220 | 0.220 | 0.220 |
| `agents:parse:researcher.md` | 1 | 0.153 | 0.153 | 0.153 |
| `agents:parse:router.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:scout.md` | 1 | 0.131 | 0.131 | 0.131 |
| `agents:parse:teacher.md` | 1 | 0.411 | 0.411 | 0.411 |
| `agents:parse:trader.md` | 1 | 0.209 | 0.209 | 0.209 |
| `agents:parse:tutor.md` | 1 | 0.151 | 0.151 | 0.151 |
| `agents:parse:writer.md` | 1 | 0.145 | 0.145 | 0.145 |
| `signalSender:mark` | 1 | 0.035 | 0.035 | 0.035 |
| `edge:cache:hit:sync-path` | 1 | 4.27e-5 | 4.27e-5 | 4.27e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1230/1241 tests · 19264ms across 94 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6065ms |
| `llm-router.test.ts` | 12 | 3738ms |
| `adl-evolution.test.ts` | 7 | 1440ms |
| `system-speed.test.ts` | 15 | 1378ms |
| `sui-speed.test.ts` | 7 | 770ms |
| `sui.test.ts` | 6 | 680ms |
| `learning-acceleration.test.ts` | 20 | 548ms |
| `adl-llm.test.ts` | 5 | 524ms |
| `adl-cache.test.ts` | 38 | 400ms |
| `api-endpoints.test.ts` | 21 | 297ms |

---

_Report generated 2026-04-15T23:59:06.615Z._
