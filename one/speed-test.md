# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T04:11:56.725Z |
| Test run at | 2026-04-20T04:11:36.979Z |
| Benchmarks measured | 112 named ops, 142 samples |
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
| `routing:select:1000` | 1.00ms | 0.086 | 0.086 | 0.086 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 4.46e-4 | 4.46e-4 | 4.46e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.44e-4 | 2.44e-4 | 2.44e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.45e-5 | 4.45e-5 | 4.45e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.155 | 0.155 | 0.155 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.75e-4 | 9.75e-4 | 9.75e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 7.99e-4 | 7.99e-4 | 7.99e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.39e-4 | 1.39e-4 | 1.39e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.27 | 2.27 | 2.27 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.98e-4 | 3.98e-4 | 3.98e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.24 | 3.24 | 3.24 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.80e-4 | 1.80e-4 | 1.80e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.528 | 0.528 | 0.528 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.061 | 0.061 | 0.061 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 6.57 | 6.57 | 6.57 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.46e-4 | 3.46e-4 | 3.46e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.32e-4 | 2.32e-4 | 2.32e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.86 | 3.86 | 3.86 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 5.17e-4 | 5.17e-4 | 5.17e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.53e-4 | 2.53e-4 | 2.53e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.33e-4 | 1.33e-4 | 1.33e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 9.51e-5 | 9.51e-5 | 9.51e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.339 | 0.339 | 0.339 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.025 | 0.025 | 0.025 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.61e-5 | 4.61e-5 | 4.61e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.136 | 0.136 | 0.136 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.121 | 0.121 | 0.121 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.83 | 2.83 | 2.83 |
| `naming:scan-src` | 1 | 360 | 360 | 360 |
| `agents:parse:analyst.md` | 2 | 0.407 | 0.407 | 0.407 |
| `agents:parse:asi-builder.md` | 1 | 0.894 | 0.894 | 0.894 |
| `agents:parse:ceo.md` | 4 | 0.549 | 0.910 | 0.910 |
| `agents:parse:coder.md` | 1 | 0.753 | 0.753 | 0.753 |
| `agents:parse:community-director.md` | 1 | 0.884 | 0.884 | 0.884 |
| `agents:parse:community.md` | 2 | 0.653 | 0.653 | 0.653 |
| `agents:parse:concierge.md` | 3 | 0.450 | 0.592 | 0.592 |
| `agents:parse:classify.md` | 1 | 0.217 | 0.217 | 0.217 |
| `agents:parse:valence.md` | 1 | 0.193 | 0.193 | 0.193 |
| `agents:parse:bob.md` | 1 | 0.398 | 0.398 | 0.398 |
| `agents:parse:lexi.md` | 1 | 0.273 | 0.273 | 0.273 |
| `agents:parse:david.md` | 1 | 0.390 | 0.390 | 0.390 |
| `agents:parse:ai-ranking.md` | 2 | 0.333 | 0.333 | 0.333 |
| `agents:parse:amara.md` | 1 | 0.638 | 0.638 | 0.638 |
| `agents:parse:assessment.md` | 1 | 0.765 | 0.765 | 0.765 |
| `agents:parse:citation.md` | 2 | 0.224 | 0.224 | 0.224 |
| `agents:parse:cmo.md` | 3 | 0.585 | 1.42 | 1.42 |
| `agents:parse:content.md` | 2 | 0.365 | 0.365 | 0.365 |
| `agents:parse:edu.md` | 1 | 0.357 | 0.357 | 0.357 |
| `agents:parse:enrollment.md` | 1 | 0.303 | 0.303 | 0.303 |
| `agents:parse:forum.md` | 2 | 0.314 | 0.314 | 0.314 |
| `agents:parse:full.md` | 2 | 0.280 | 0.280 | 0.280 |
| `agents:parse:mktg.md` | 1 | 0.379 | 0.379 | 0.379 |
| `agents:parse:monthly.md` | 2 | 0.537 | 0.537 | 0.537 |
| `agents:parse:niche-dir.md` | 2 | 0.468 | 0.468 | 0.468 |
| `agents:parse:outreach.md` | 2 | 0.391 | 0.391 | 0.391 |
| `agents:parse:quick.md` | 2 | 0.209 | 0.209 | 0.209 |
| `agents:parse:sales.md` | 1 | 0.343 | 0.343 | 0.343 |
| `agents:parse:schema.md` | 2 | 0.484 | 0.484 | 0.484 |
| `agents:parse:social.md` | 4 | 0.261 | 0.315 | 0.315 |
| `agents:parse:support.md` | 2 | 0.576 | 0.576 | 0.576 |
| `agents:parse:upsell.md` | 1 | 0.321 | 0.321 | 0.321 |
| `agents:parse:welcome.md` | 1 | 0.157 | 0.157 | 0.157 |
| `agents:parse:designer.md` | 1 | 0.504 | 0.504 | 0.504 |
| `agents:parse:ehc-officer.md` | 1 | 0.396 | 0.396 | 0.396 |
| `agents:parse:engineering-director.md` | 1 | 0.672 | 0.672 | 0.672 |
| `agents:parse:eth-dev.md` | 1 | 0.450 | 0.450 | 0.450 |
| `agents:parse:founder.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:guard.md` | 1 | 0.340 | 0.340 | 0.340 |
| `agents:parse:harvester.md` | 1 | 0.169 | 0.169 | 0.169 |
| `agents:parse:ads.md` | 2 | 0.810 | 0.810 | 0.810 |
| `agents:parse:creative.md` | 1 | 0.416 | 0.416 | 0.416 |
| `agents:parse:director.md` | 3 | 0.492 | 0.598 | 0.598 |
| `agents:parse:media-buyer.md` | 1 | 0.261 | 0.261 | 0.261 |
| `agents:parse:seo.md` | 2 | 0.414 | 0.414 | 0.414 |
| `agents:parse:marketing-director.md` | 1 | 1.52 | 1.52 | 1.52 |
| `agents:parse:nanoclaw.md` | 1 | 0.318 | 0.318 | 0.318 |
| `agents:parse:ops.md` | 1 | 0.727 | 0.727 | 0.727 |
| `agents:parse:researcher.md` | 2 | 0.402 | 0.402 | 0.402 |
| `agents:parse:tutor.md` | 2 | 0.467 | 0.467 | 0.467 |
| `agents:parse:world.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:cfo.md` | 1 | 0.452 | 0.452 | 0.452 |
| `agents:parse:cto.md` | 1 | 0.349 | 0.349 | 0.349 |
| `agents:parse:router.md` | 1 | 1.21 | 1.21 | 1.21 |
| `agents:parse:sales-director.md` | 1 | 1.36 | 1.36 | 1.36 |
| `agents:parse:scout.md` | 1 | 0.412 | 0.412 | 0.412 |
| `agents:parse:service-director.md` | 1 | 0.772 | 0.772 | 0.772 |
| `agents:parse:teacher.md` | 1 | 0.593 | 0.593 | 0.593 |
| `agents:parse:moderator.md` | 1 | 0.259 | 0.259 | 0.259 |
| `agents:parse:writer.md` | 2 | 0.514 | 0.514 | 0.514 |
| `agents:parse:testnet-buyer.md` | 1 | 0.203 | 0.203 | 0.203 |
| `agents:parse:trader.md` | 1 | 0.420 | 0.420 | 0.420 |
| `agents:parse:you.md` | 1 | 0.387 | 0.387 | 0.387 |
| `signalSender:mark` | 1 | 0.028 | 0.028 | 0.028 |
| `edge:cache:hit:sync-path` | 1 | 3.85e-5 | 3.85e-5 | 3.85e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1613/1642 tests · 64348ms across 127 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `chairman-chain.test.ts` | 27 | 18893ms |
| `phase2-keypair-derivation.test.ts` | 14 | 18140ms |
| `llm.test.ts` | 14 | 6078ms |
| `llm-router.test.ts` | 12 | 3727ms |
| `register-wallet.test.ts` | 5 | 1560ms |
| `agents.test.ts` | 5 | 1417ms |
| `chat-chairman-integration.test.ts` | 6 | 1238ms |
| `system-speed.test.ts` | 15 | 1129ms |
| `tick.test.ts` | 9 | 946ms |
| `api-endpoints.test.ts` | 21 | 657ms |

---

_Report generated 2026-04-20T04:11:56.739Z._
