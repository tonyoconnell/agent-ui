# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T01:53:40.596Z |
| Test run at | 2026-04-20T01:53:30.226Z |
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
| `routing:select:100` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.100 | 0.100 | 0.100 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 5.39e-4 | 5.39e-4 | 5.39e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 3.92e-4 | 3.92e-4 | 3.92e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.17e-5 | 5.17e-5 | 5.17e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.172 | 0.172 | 0.172 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.54e-4 | 1.54e-4 | 1.54e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.96 | 2.96 | 2.96 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 4.11e-4 | 4.11e-4 | 4.11e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.96 | 3.96 | 3.96 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.72e-4 | 1.72e-4 | 1.72e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 6.64e-4 | 6.64e-4 | 6.64e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.474 | 0.474 | 0.474 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.073 | 0.073 | 0.073 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.68 | 5.68 | 5.68 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.93e-4 | 3.93e-4 | 3.93e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.14e-4 | 2.14e-4 | 2.14e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.26 | 3.26 | 3.26 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 7.26e-4 | 7.26e-4 | 7.26e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 5.01e-4 | 5.01e-4 | 5.01e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.18e-4 | 2.18e-4 | 2.18e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.22e-4 | 1.22e-4 | 1.22e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 8.73e-5 | 8.73e-5 | 8.73e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.275 | 0.275 | 0.275 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 8.96e-5 | 8.96e-5 | 8.96e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.114 | 0.114 | 0.114 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.102 | 0.102 | 0.102 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 3.16 | 3.16 | 3.16 |
| `agents:parse:analyst.md` | 2 | 0.237 | 0.237 | 0.237 |
| `agents:parse:asi-builder.md` | 1 | 0.289 | 0.289 | 0.289 |
| `agents:parse:ceo.md` | 4 | 0.296 | 0.537 | 0.537 |
| `agents:parse:coder.md` | 1 | 0.360 | 0.360 | 0.360 |
| `agents:parse:community-director.md` | 1 | 0.655 | 0.655 | 0.655 |
| `agents:parse:community.md` | 2 | 0.790 | 0.790 | 0.790 |
| `agents:parse:concierge.md` | 3 | 0.198 | 0.213 | 0.213 |
| `agents:parse:classify.md` | 1 | 0.102 | 0.102 | 0.102 |
| `agents:parse:valence.md` | 1 | 0.152 | 0.152 | 0.152 |
| `agents:parse:bob.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:lexi.md` | 1 | 0.151 | 0.151 | 0.151 |
| `agents:parse:david.md` | 1 | 0.141 | 0.141 | 0.141 |
| `agents:parse:ai-ranking.md` | 2 | 0.231 | 0.231 | 0.231 |
| `agents:parse:amara.md` | 1 | 0.355 | 0.355 | 0.355 |
| `agents:parse:assessment.md` | 1 | 0.497 | 0.497 | 0.497 |
| `agents:parse:citation.md` | 2 | 0.220 | 0.220 | 0.220 |
| `agents:parse:cmo.md` | 3 | 0.474 | 0.720 | 0.720 |
| `agents:parse:content.md` | 2 | 0.286 | 0.286 | 0.286 |
| `agents:parse:edu.md` | 1 | 0.235 | 0.235 | 0.235 |
| `agents:parse:enrollment.md` | 1 | 0.366 | 0.366 | 0.366 |
| `agents:parse:forum.md` | 2 | 0.191 | 0.191 | 0.191 |
| `agents:parse:full.md` | 2 | 0.180 | 0.180 | 0.180 |
| `agents:parse:mktg.md` | 1 | 0.234 | 0.234 | 0.234 |
| `agents:parse:monthly.md` | 2 | 0.253 | 0.253 | 0.253 |
| `agents:parse:niche-dir.md` | 2 | 0.375 | 0.375 | 0.375 |
| `agents:parse:outreach.md` | 2 | 0.182 | 0.182 | 0.182 |
| `agents:parse:quick.md` | 2 | 0.244 | 0.244 | 0.244 |
| `agents:parse:sales.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:schema.md` | 2 | 0.173 | 0.173 | 0.173 |
| `agents:parse:social.md` | 4 | 0.229 | 0.413 | 0.413 |
| `agents:parse:support.md` | 2 | 0.326 | 0.326 | 0.326 |
| `agents:parse:upsell.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:welcome.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:designer.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:ehc-officer.md` | 1 | 0.421 | 0.421 | 0.421 |
| `agents:parse:engineering-director.md` | 1 | 0.732 | 0.732 | 0.732 |
| `agents:parse:eth-dev.md` | 1 | 0.773 | 0.773 | 0.773 |
| `agents:parse:founder.md` | 1 | 0.256 | 0.256 | 0.256 |
| `agents:parse:guard.md` | 1 | 0.474 | 0.474 | 0.474 |
| `agents:parse:harvester.md` | 1 | 0.229 | 0.229 | 0.229 |
| `agents:parse:ads.md` | 2 | 0.304 | 0.304 | 0.304 |
| `agents:parse:creative.md` | 1 | 0.303 | 0.303 | 0.303 |
| `agents:parse:director.md` | 3 | 0.232 | 0.265 | 0.265 |
| `agents:parse:media-buyer.md` | 1 | 0.318 | 0.318 | 0.318 |
| `agents:parse:seo.md` | 2 | 0.270 | 0.270 | 0.270 |
| `agents:parse:marketing-director.md` | 1 | 0.513 | 0.513 | 0.513 |
| `agents:parse:nanoclaw.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:ops.md` | 1 | 0.288 | 0.288 | 0.288 |
| `agents:parse:researcher.md` | 2 | 0.189 | 0.189 | 0.189 |
| `agents:parse:tutor.md` | 2 | 0.232 | 0.232 | 0.232 |
| `agents:parse:world.md` | 1 | 0.047 | 0.047 | 0.047 |
| `agents:parse:cfo.md` | 1 | 0.237 | 0.237 | 0.237 |
| `agents:parse:cto.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:router.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:sales-director.md` | 1 | 0.360 | 0.360 | 0.360 |
| `agents:parse:scout.md` | 1 | 0.334 | 0.334 | 0.334 |
| `agents:parse:service-director.md` | 1 | 0.640 | 0.640 | 0.640 |
| `agents:parse:teacher.md` | 1 | 0.391 | 0.391 | 0.391 |
| `agents:parse:moderator.md` | 1 | 0.252 | 0.252 | 0.252 |
| `agents:parse:writer.md` | 2 | 0.742 | 0.742 | 0.742 |
| `agents:parse:testnet-buyer.md` | 1 | 0.303 | 0.303 | 0.303 |
| `agents:parse:trader.md` | 1 | 0.267 | 0.267 | 0.267 |
| `agents:parse:you.md` | 1 | 0.298 | 0.298 | 0.298 |
| `naming:scan-src` | 1 | 116 | 116 | 116 |
| `signalSender:mark` | 1 | 0.033 | 0.033 | 0.033 |
| `edge:cache:hit:sync-path` | 1 | 3.56e-5 | 3.56e-5 | 3.56e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1614/1637 tests · 29747ms across 126 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 10045ms |
| `llm.test.ts` | 14 | 6065ms |
| `llm-router.test.ts` | 12 | 3428ms |
| `system-speed.test.ts` | 15 | 1376ms |
| `sui-speed.test.ts` | 7 | 721ms |
| `sui.test.ts` | 6 | 686ms |
| `adl-llm.test.ts` | 5 | 640ms |
| `learning-acceleration.test.ts` | 20 | 407ms |
| `adl-cache.test.ts` | 38 | 357ms |
| `agents.test.ts` | 5 | 318ms |

---

_Report generated 2026-04-20T01:53:40.598Z._
