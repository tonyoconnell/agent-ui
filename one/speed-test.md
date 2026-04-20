# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T08:25:50.993Z |
| Test run at | 2026-04-20T08:25:24.928Z |
| Benchmarks measured | 112 named ops, 142 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **44 pass** · **1 over** · 0 missing |
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
| `routing:select:1000` | 1.00ms | 0.078 | 0.078 | 0.078 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.69e-4 | 3.69e-4 | 3.69e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.21e-4 | 2.21e-4 | 2.21e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.22e-5 | 4.22e-5 | 4.22e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.131 | 0.131 | 0.131 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 8.76e-4 | 8.76e-4 | 8.76e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 7.05e-4 | 7.05e-4 | 7.05e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.36e-4 | 1.36e-4 | 1.36e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.16 | 2.16 | 2.16 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.14e-4 | 3.14e-4 | 3.14e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.88 | 2.88 | 2.88 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.53e-4 | 1.53e-4 | 1.53e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 7.14e-4 | 7.14e-4 | 7.14e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.355 | 0.355 | 0.355 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.062 | 0.062 | 0.062 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 39.74 | 39.74 | 39.74 | 1 | ✗ over | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 9.36e-4 | 9.36e-4 | 9.36e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.140 | 0.140 | 0.140 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.023 | 0.023 | 0.023 | 1 | ◐ pass (within 3× scale) | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 6.43e-4 | 6.43e-4 | 6.43e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 17.82 | 17.82 | 17.82 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 6.12e-4 | 6.12e-4 | 6.12e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 4.30e-4 | 4.30e-4 | 4.30e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 1.95e-4 | 1.95e-4 | 1.95e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.10e-4 | 1.10e-4 | 1.10e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.98e-5 | 7.98e-5 | 7.98e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.464 | 0.464 | 0.464 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.033 | 0.033 | 0.033 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 8.64e-5 | 8.64e-5 | 8.64e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.386 | 0.386 | 0.386 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.171 | 0.171 | 0.171 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `naming:scan-src` | 1 | 108 | 108 | 108 |
| `sui:address:derive` | 1 | 3.08 | 3.08 | 3.08 |
| `agents:parse:analyst.md` | 2 | 0.232 | 0.232 | 0.232 |
| `agents:parse:asi-builder.md` | 1 | 0.336 | 0.336 | 0.336 |
| `agents:parse:ceo.md` | 4 | 0.355 | 0.616 | 0.616 |
| `agents:parse:coder.md` | 1 | 0.346 | 0.346 | 0.346 |
| `agents:parse:community-director.md` | 1 | 0.543 | 0.543 | 0.543 |
| `agents:parse:community.md` | 2 | 0.262 | 0.262 | 0.262 |
| `agents:parse:concierge.md` | 3 | 0.187 | 0.188 | 0.188 |
| `agents:parse:classify.md` | 1 | 0.099 | 0.099 | 0.099 |
| `agents:parse:valence.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:bob.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:lexi.md` | 1 | 0.225 | 0.225 | 0.225 |
| `agents:parse:david.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:ai-ranking.md` | 2 | 0.302 | 0.302 | 0.302 |
| `agents:parse:amara.md` | 1 | 0.421 | 0.421 | 0.421 |
| `agents:parse:assessment.md` | 1 | 0.542 | 0.542 | 0.542 |
| `agents:parse:citation.md` | 2 | 0.332 | 0.332 | 0.332 |
| `agents:parse:cmo.md` | 3 | 0.281 | 0.376 | 0.376 |
| `agents:parse:content.md` | 2 | 0.255 | 0.255 | 0.255 |
| `agents:parse:edu.md` | 1 | 0.252 | 0.252 | 0.252 |
| `agents:parse:enrollment.md` | 1 | 0.270 | 0.270 | 0.270 |
| `agents:parse:forum.md` | 2 | 0.440 | 0.440 | 0.440 |
| `agents:parse:full.md` | 2 | 0.270 | 0.270 | 0.270 |
| `agents:parse:mktg.md` | 1 | 0.378 | 0.378 | 0.378 |
| `agents:parse:monthly.md` | 2 | 0.171 | 0.171 | 0.171 |
| `agents:parse:niche-dir.md` | 2 | 0.183 | 0.183 | 0.183 |
| `agents:parse:outreach.md` | 2 | 0.232 | 0.232 | 0.232 |
| `agents:parse:quick.md` | 2 | 0.177 | 0.177 | 0.177 |
| `agents:parse:sales.md` | 1 | 0.290 | 0.290 | 0.290 |
| `agents:parse:schema.md` | 2 | 0.172 | 0.172 | 0.172 |
| `agents:parse:social.md` | 4 | 0.294 | 0.321 | 0.321 |
| `agents:parse:support.md` | 2 | 0.274 | 0.274 | 0.274 |
| `agents:parse:upsell.md` | 1 | 0.484 | 0.484 | 0.484 |
| `agents:parse:welcome.md` | 1 | 0.131 | 0.131 | 0.131 |
| `agents:parse:designer.md` | 1 | 0.260 | 0.260 | 0.260 |
| `agents:parse:ehc-officer.md` | 1 | 0.288 | 0.288 | 0.288 |
| `agents:parse:engineering-director.md` | 1 | 0.500 | 0.500 | 0.500 |
| `agents:parse:eth-dev.md` | 1 | 0.300 | 0.300 | 0.300 |
| `agents:parse:founder.md` | 1 | 0.253 | 0.253 | 0.253 |
| `agents:parse:guard.md` | 1 | 0.140 | 0.140 | 0.140 |
| `agents:parse:harvester.md` | 1 | 0.303 | 0.303 | 0.303 |
| `agents:parse:ads.md` | 2 | 0.296 | 0.296 | 0.296 |
| `agents:parse:creative.md` | 1 | 0.233 | 0.233 | 0.233 |
| `agents:parse:director.md` | 3 | 0.303 | 0.318 | 0.318 |
| `agents:parse:media-buyer.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:seo.md` | 2 | 0.348 | 0.348 | 0.348 |
| `agents:parse:marketing-director.md` | 1 | 0.525 | 0.525 | 0.525 |
| `agents:parse:nanoclaw.md` | 1 | 0.315 | 0.315 | 0.315 |
| `agents:parse:ops.md` | 1 | 0.540 | 0.540 | 0.540 |
| `agents:parse:researcher.md` | 2 | 0.178 | 0.178 | 0.178 |
| `agents:parse:tutor.md` | 2 | 0.174 | 0.174 | 0.174 |
| `agents:parse:world.md` | 1 | 0.045 | 0.045 | 0.045 |
| `agents:parse:cfo.md` | 1 | 0.247 | 0.247 | 0.247 |
| `agents:parse:cto.md` | 1 | 0.223 | 0.223 | 0.223 |
| `agents:parse:router.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:sales-director.md` | 1 | 0.298 | 0.298 | 0.298 |
| `agents:parse:scout.md` | 1 | 0.146 | 0.146 | 0.146 |
| `agents:parse:service-director.md` | 1 | 0.595 | 0.595 | 0.595 |
| `agents:parse:teacher.md` | 1 | 0.408 | 0.408 | 0.408 |
| `agents:parse:moderator.md` | 1 | 0.225 | 0.225 | 0.225 |
| `agents:parse:writer.md` | 2 | 0.438 | 0.438 | 0.438 |
| `agents:parse:testnet-buyer.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:trader.md` | 1 | 0.340 | 0.340 | 0.340 |
| `agents:parse:you.md` | 1 | 0.293 | 0.293 | 0.293 |
| `signalSender:mark` | 1 | 0.019 | 0.019 | 0.019 |
| `edge:cache:hit:sync-path` | 1 | 3.59e-5 | 3.59e-5 | 3.59e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1612/1642 tests · 76083ms across 127 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 25193ms |
| `chairman-chain.test.ts` | 27 | 24033ms |
| `llm.test.ts` | 14 | 6103ms |
| `llm-router.test.ts` | 12 | 3926ms |
| `lifecycle-speed.test.ts` | 7 | 1470ms |
| `chat-chairman-integration.test.ts` | 6 | 1204ms |
| `system-speed.test.ts` | 15 | 1041ms |
| `world-boundary.test.ts` | 1 | 797ms |
| `tick.test.ts` | 9 | 678ms |
| `agents.test.ts` | 5 | 597ms |

---

_Report generated 2026-04-20T08:25:51.002Z._
