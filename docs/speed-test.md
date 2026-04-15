# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T05:29:54.030Z |
| Test run at | 2026-04-15T05:29:46.985Z |
| Benchmarks measured | 86 named ops, 99 samples |
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
| `routing:select:100` | 0.005ms | 0.011 | 0.011 | 0.011 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.150 | 0.150 | 0.150 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.007 | 0.007 | 0.007 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.17e-4 | 6.17e-4 | 6.17e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.90e-4 | 1.90e-4 | 1.90e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 8.48e-5 | 8.48e-5 | 8.48e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.216 | 0.216 | 0.216 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 8.64e-4 | 8.64e-4 | 8.64e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 5.33e-4 | 5.33e-4 | 5.33e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.63 | 3.63 | 3.63 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.41e-4 | 3.41e-4 | 3.41e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.85 | 3.85 | 3.85 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 3.77e-4 | 3.77e-4 | 3.77e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.034 | 0.034 | 0.034 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.583 | 0.583 | 0.583 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 8.12 | 8.12 | 8.12 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 6.62e-4 | 6.62e-4 | 6.62e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.89e-4 | 2.89e-4 | 2.89e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.24 | 3.24 | 3.24 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 9.06e-4 | 9.06e-4 | 9.06e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 3.43e-4 | 3.43e-4 | 3.43e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.36e-4 | 1.36e-4 | 1.36e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.251 | 0.251 | 0.251 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 5.26e-5 | 5.26e-5 | 5.26e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.140 | 0.140 | 0.140 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.180 | 0.180 | 0.180 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 3.18 | 3.18 | 3.18 |
| `agents:parse:analyst.md` | 2 | 0.286 | 0.286 | 0.286 |
| `agents:parse:asi-builder.md` | 1 | 0.498 | 0.498 | 0.498 |
| `agents:parse:coder.md` | 1 | 2.62 | 2.62 | 2.62 |
| `agents:parse:community.md` | 1 | 0.352 | 0.352 | 0.352 |
| `agents:parse:concierge.md` | 1 | 1.34 | 1.34 | 1.34 |
| `agents:parse:ai-ranking.md` | 2 | 0.986 | 0.986 | 0.986 |
| `agents:parse:citation.md` | 2 | 0.618 | 0.618 | 0.618 |
| `agents:parse:cmo.md` | 2 | 0.375 | 0.375 | 0.375 |
| `agents:parse:forum.md` | 2 | 0.240 | 0.240 | 0.240 |
| `agents:parse:full.md` | 2 | 0.226 | 0.226 | 0.226 |
| `agents:parse:monthly.md` | 2 | 0.205 | 0.205 | 0.205 |
| `agents:parse:niche-dir.md` | 2 | 0.457 | 0.457 | 0.457 |
| `agents:parse:outreach.md` | 2 | 0.186 | 0.186 | 0.186 |
| `agents:parse:quick.md` | 2 | 0.191 | 0.191 | 0.191 |
| `agents:parse:schema.md` | 2 | 0.306 | 0.306 | 0.306 |
| `agents:parse:social.md` | 3 | 0.292 | 0.540 | 0.540 |
| `agents:parse:designer.md` | 1 | 0.345 | 0.345 | 0.345 |
| `agents:parse:ehc-officer.md` | 1 | 0.321 | 0.321 | 0.321 |
| `agents:parse:eth-dev.md` | 1 | 0.304 | 0.304 | 0.304 |
| `agents:parse:founder.md` | 1 | 0.296 | 0.296 | 0.296 |
| `agents:parse:guard.md` | 1 | 0.149 | 0.149 | 0.149 |
| `agents:parse:harvester.md` | 1 | 0.153 | 0.153 | 0.153 |
| `agents:parse:ads.md` | 1 | 0.249 | 0.249 | 0.249 |
| `agents:parse:content.md` | 1 | 0.242 | 0.242 | 0.242 |
| `agents:parse:creative.md` | 1 | 0.398 | 0.398 | 0.398 |
| `agents:parse:director.md` | 1 | 0.313 | 0.313 | 0.313 |
| `agents:parse:media-buyer.md` | 1 | 0.355 | 0.355 | 0.355 |
| `agents:parse:seo.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:nanoclaw.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:ops.md` | 1 | 0.261 | 0.261 | 0.261 |
| `agents:parse:researcher.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:router.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:scout.md` | 1 | 0.148 | 0.148 | 0.148 |
| `agents:parse:teacher.md` | 1 | 0.512 | 0.512 | 0.512 |
| `agents:parse:trader.md` | 1 | 0.235 | 0.235 | 0.235 |
| `agents:parse:tutor.md` | 1 | 0.176 | 0.176 | 0.176 |
| `agents:parse:writer.md` | 1 | 0.192 | 0.192 | 0.192 |
| `naming:scan-src` | 1 | 65.01 | 65.01 | 65.01 |
| `signalSender:mark` | 1 | 0.056 | 0.056 | 0.056 |
| `edge:cache:hit:sync-path` | 1 | 4.90e-5 | 4.90e-5 | 4.90e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 550/550 tests · 15880ms across 40 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6089ms |
| `llm-router.test.ts` | 12 | 3961ms |
| `system-speed.test.ts` | 15 | 1800ms |
| `sui-speed.test.ts` | 7 | 833ms |
| `sui.test.ts` | 6 | 721ms |
| `api-key.test.ts` | 13 | 415ms |
| `routing.test.ts` | 54 | 298ms |
| `lifecycle-speed.test.ts` | 7 | 298ms |
| `agents.test.ts` | 5 | 261ms |
| `context.test.ts` | 29 | 246ms |

---

_Report generated 2026-04-15T05:29:54.032Z._
