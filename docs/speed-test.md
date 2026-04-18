# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T03:07:22.508Z |
| Test run at | 2026-04-18T03:06:01.388Z |
| Benchmarks measured | 103 named ops, 121 samples |
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
| `routing:select:100` | 0.005ms | 0.132 | 0.132 | 0.132 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 1.16 | 1.16 | 1.16 | 1 | ◐ pass (within 3× scale) | search API + rank |
| `routing:follow` | 0.050ms | 0.026 | 0.026 | 0.026 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.011 | 0.011 | 0.011 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 8.08e-4 | 8.08e-4 | 8.08e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 6.13e-4 | 6.13e-4 | 6.13e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.67e-5 | 5.67e-5 | 5.67e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.778 | 0.778 | 0.778 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 7.48e-4 | 7.48e-4 | 7.48e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.044 | 0.044 | 0.044 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 4.87 | 4.87 | 4.87 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 6.50 | 6.50 | 6.50 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.74e-4 | 1.74e-4 | 1.74e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.074 | 0.074 | 0.074 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.698 | 0.698 | 0.698 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.172 | 0.172 | 0.172 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 7.18 | 7.18 | 7.18 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.41e-4 | 3.41e-4 | 3.41e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.79e-4 | 2.79e-4 | 2.79e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 8.88 | 8.88 | 8.88 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.76e-4 | 4.76e-4 | 4.76e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 9.24e-4 | 9.24e-4 | 9.24e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.28e-4 | 1.28e-4 | 1.28e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.41e-4 | 1.41e-4 | 1.41e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.449 | 0.449 | 0.449 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.032 | 0.032 | 0.032 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 9.18e-5 | 9.18e-5 | 9.18e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.273 | 0.273 | 0.273 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.194 | 0.194 | 0.194 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `agents:parse:analyst.md` | 2 | 0.870 | 0.870 | 0.870 |
| `agents:parse:asi-builder.md` | 1 | 1.43 | 1.43 | 1.43 |
| `agents:parse:coder.md` | 1 | 0.570 | 0.570 | 0.570 |
| `agents:parse:community.md` | 2 | 1.64 | 1.64 | 1.64 |
| `agents:parse:concierge.md` | 2 | 0.743 | 0.743 | 0.743 |
| `agents:parse:classify.md` | 1 | 0.305 | 0.305 | 0.305 |
| `agents:parse:valence.md` | 1 | 0.305 | 0.305 | 0.305 |
| `agents:parse:bob.md` | 1 | 0.822 | 0.822 | 0.822 |
| `agents:parse:lexi.md` | 1 | 0.256 | 0.256 | 0.256 |
| `agents:parse:ai-ranking.md` | 2 | 1.49 | 1.49 | 1.49 |
| `agents:parse:amara.md` | 1 | 32.49 | 32.49 | 32.49 |
| `agents:parse:assessment.md` | 1 | 4.46 | 4.46 | 4.46 |
| `agents:parse:ceo.md` | 2 | 2.30 | 2.30 | 2.30 |
| `agents:parse:citation.md` | 2 | 0.440 | 0.440 | 0.440 |
| `agents:parse:cmo.md` | 3 | 1.45 | 2.03 | 2.03 |
| `agents:parse:content.md` | 2 | 0.800 | 0.800 | 0.800 |
| `agents:parse:edu.md` | 1 | 0.981 | 0.981 | 0.981 |
| `agents:parse:enrollment.md` | 1 | 0.218 | 0.218 | 0.218 |
| `agents:parse:forum.md` | 2 | 3.25 | 3.25 | 3.25 |
| `agents:parse:full.md` | 2 | 5.70 | 5.70 | 5.70 |
| `agents:parse:mktg.md` | 1 | 1.04 | 1.04 | 1.04 |
| `agents:parse:monthly.md` | 2 | 1.28 | 1.28 | 1.28 |
| `agents:parse:niche-dir.md` | 2 | 0.203 | 0.203 | 0.203 |
| `agents:parse:outreach.md` | 2 | 0.898 | 0.898 | 0.898 |
| `agents:parse:quick.md` | 2 | 0.511 | 0.511 | 0.511 |
| `agents:parse:sales.md` | 1 | 0.989 | 0.989 | 0.989 |
| `agents:parse:schema.md` | 2 | 1.25 | 1.25 | 1.25 |
| `agents:parse:social.md` | 3 | 0.321 | 1.04 | 1.04 |
| `agents:parse:support.md` | 1 | 0.192 | 0.192 | 0.192 |
| `agents:parse:upsell.md` | 1 | 0.315 | 0.315 | 0.315 |
| `agents:parse:welcome.md` | 1 | 0.137 | 0.137 | 0.137 |
| `agents:parse:designer.md` | 1 | 0.610 | 0.610 | 0.610 |
| `agents:parse:ehc-officer.md` | 1 | 0.409 | 0.409 | 0.409 |
| `agents:parse:eth-dev.md` | 1 | 1.04 | 1.04 | 1.04 |
| `agents:parse:founder.md` | 1 | 1.43 | 1.43 | 1.43 |
| `agents:parse:guard.md` | 1 | 0.138 | 0.138 | 0.138 |
| `agents:parse:harvester.md` | 1 | 0.632 | 0.632 | 0.632 |
| `agents:parse:ads.md` | 1 | 0.730 | 0.730 | 0.730 |
| `agents:parse:creative.md` | 1 | 0.216 | 0.216 | 0.216 |
| `agents:parse:director.md` | 1 | 0.215 | 0.215 | 0.215 |
| `agents:parse:media-buyer.md` | 1 | 0.721 | 0.721 | 0.721 |
| `agents:parse:seo.md` | 1 | 1.37 | 1.37 | 1.37 |
| `agents:parse:nanoclaw.md` | 1 | 0.876 | 0.876 | 0.876 |
| `agents:parse:ops.md` | 1 | 1.05 | 1.05 | 1.05 |
| `agents:parse:researcher.md` | 1 | 18.97 | 18.97 | 18.97 |
| `agents:parse:cfo.md` | 1 | 1.08 | 1.08 | 1.08 |
| `agents:parse:cto.md` | 1 | 0.874 | 0.874 | 0.874 |
| `agents:parse:router.md` | 1 | 0.583 | 0.583 | 0.583 |
| `agents:parse:scout.md` | 1 | 0.520 | 0.520 | 0.520 |
| `agents:parse:teacher.md` | 1 | 1.99 | 1.99 | 1.99 |
| `agents:parse:testnet-buyer.md` | 1 | 1.17 | 1.17 | 1.17 |
| `agents:parse:trader.md` | 1 | 2.05 | 2.05 | 2.05 |
| `agents:parse:tutor.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:writer.md` | 1 | 0.179 | 0.179 | 0.179 |
| `sui:address:derive` | 1 | 3.68 | 3.68 | 3.68 |
| `naming:scan-src` | 1 | 209 | 209 | 209 |
| `signalSender:mark` | 1 | 0.056 | 0.056 | 0.056 |
| `edge:cache:hit:sync-path` | 1 | 4.79e-5 | 4.79e-5 | 4.79e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1540/1561 tests · 152232ms across 116 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `human.test.ts` | 27 | 80448ms |
| `phase2-keypair-derivation.test.ts` | 14 | 13041ms |
| `tick.test.ts` | 9 | 12141ms |
| `system-speed.test.ts` | 15 | 8680ms |
| `llm-router.test.ts` | 12 | 8283ms |
| `llm.test.ts` | 14 | 7813ms |
| `agentverse-connect.test.ts` | 9 | 4483ms |
| `adl-evolution.test.ts` | 7 | 2553ms |
| `extract.test.ts` | 10 | 1398ms |
| `sui-speed.test.ts` | 7 | 1365ms |

---

_Report generated 2026-04-18T03:07:22.514Z._
