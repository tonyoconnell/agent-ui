# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T03:01:12.022Z |
| Test run at | 2026-04-20T03:00:55.690Z |
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
| `routing:select:100` | 0.005ms | 0.019 | 0.019 | 0.019 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.248 | 0.248 | 0.248 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.014 | 0.014 | 0.014 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.001 | 0.001 | 0.001 | 1 | ◐ pass (within 3× scale) | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 6.36e-4 | 6.36e-4 | 6.36e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 1.13e-4 | 1.13e-4 | 1.13e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.431 | 0.431 | 0.431 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 4.02e-4 | 4.02e-4 | 4.02e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.061 | 0.061 | 0.061 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 7.57 | 7.57 | 7.57 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 6.69 | 6.69 | 6.69 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 3.98e-4 | 3.98e-4 | 3.98e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.037 | 0.037 | 0.037 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 1.13 | 1.13 | 1.13 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.148 | 0.148 | 0.148 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.023 | 0.023 | 0.023 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 9.61 | 9.61 | 9.61 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 7.24e-4 | 7.24e-4 | 7.24e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.026 | 0.026 | 0.026 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 4.65e-4 | 4.65e-4 | 4.65e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 6.89 | 6.89 | 6.89 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 5.35e-4 | 5.35e-4 | 5.35e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 3.43e-4 | 3.43e-4 | 3.43e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 2.02e-4 | 2.02e-4 | 2.02e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 1.31 | 1.31 | 1.31 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.037 | 0.037 | 0.037 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.041 | 0.041 | 0.041 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 9.93e-5 | 9.93e-5 | 9.93e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.214 | 0.214 | 0.214 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.194 | 0.194 | 0.194 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 6.30 | 6.30 | 6.30 |
| `agents:parse:analyst.md` | 2 | 0.763 | 0.763 | 0.763 |
| `agents:parse:asi-builder.md` | 1 | 0.784 | 0.784 | 0.784 |
| `agents:parse:ceo.md` | 4 | 0.931 | 1.19 | 1.19 |
| `agents:parse:coder.md` | 1 | 0.899 | 0.899 | 0.899 |
| `agents:parse:community-director.md` | 1 | 0.871 | 0.871 | 0.871 |
| `agents:parse:community.md` | 2 | 0.629 | 0.629 | 0.629 |
| `agents:parse:concierge.md` | 3 | 0.542 | 0.676 | 0.676 |
| `agents:parse:classify.md` | 1 | 0.312 | 0.312 | 0.312 |
| `agents:parse:valence.md` | 1 | 0.313 | 0.313 | 0.313 |
| `agents:parse:bob.md` | 1 | 0.623 | 0.623 | 0.623 |
| `agents:parse:lexi.md` | 1 | 0.438 | 0.438 | 0.438 |
| `agents:parse:david.md` | 1 | 0.494 | 0.494 | 0.494 |
| `agents:parse:ai-ranking.md` | 2 | 0.585 | 0.585 | 0.585 |
| `agents:parse:amara.md` | 1 | 0.808 | 0.808 | 0.808 |
| `agents:parse:assessment.md` | 1 | 1.22 | 1.22 | 1.22 |
| `agents:parse:citation.md` | 2 | 0.552 | 0.552 | 0.552 |
| `agents:parse:cmo.md` | 3 | 0.805 | 0.879 | 0.879 |
| `agents:parse:content.md` | 2 | 0.666 | 0.666 | 0.666 |
| `agents:parse:edu.md` | 1 | 0.649 | 0.649 | 0.649 |
| `agents:parse:enrollment.md` | 1 | 0.667 | 0.667 | 0.667 |
| `agents:parse:forum.md` | 2 | 0.521 | 0.521 | 0.521 |
| `agents:parse:full.md` | 2 | 0.506 | 0.506 | 0.506 |
| `agents:parse:mktg.md` | 1 | 0.569 | 0.569 | 0.569 |
| `agents:parse:monthly.md` | 2 | 0.482 | 0.482 | 0.482 |
| `agents:parse:niche-dir.md` | 2 | 0.591 | 0.591 | 0.591 |
| `agents:parse:outreach.md` | 2 | 0.474 | 0.474 | 0.474 |
| `agents:parse:quick.md` | 2 | 0.572 | 0.572 | 0.572 |
| `agents:parse:sales.md` | 1 | 0.675 | 0.675 | 0.675 |
| `agents:parse:schema.md` | 2 | 0.515 | 0.515 | 0.515 |
| `agents:parse:social.md` | 4 | 0.431 | 0.628 | 0.628 |
| `agents:parse:support.md` | 2 | 0.710 | 0.710 | 0.710 |
| `agents:parse:upsell.md` | 1 | 0.536 | 0.536 | 0.536 |
| `agents:parse:welcome.md` | 1 | 0.293 | 0.293 | 0.293 |
| `agents:parse:designer.md` | 1 | 0.566 | 0.566 | 0.566 |
| `agents:parse:ehc-officer.md` | 1 | 0.758 | 0.758 | 0.758 |
| `agents:parse:engineering-director.md` | 1 | 0.877 | 0.877 | 0.877 |
| `agents:parse:eth-dev.md` | 1 | 0.773 | 0.773 | 0.773 |
| `agents:parse:founder.md` | 1 | 0.629 | 0.629 | 0.629 |
| `agents:parse:guard.md` | 1 | 0.687 | 0.687 | 0.687 |
| `naming:scan-src` | 1 | 357 | 357 | 357 |
| `agents:parse:harvester.md` | 1 | 0.408 | 0.408 | 0.408 |
| `agents:parse:ads.md` | 2 | 0.574 | 0.574 | 0.574 |
| `agents:parse:creative.md` | 1 | 0.437 | 0.437 | 0.437 |
| `agents:parse:director.md` | 3 | 0.573 | 0.577 | 0.577 |
| `agents:parse:media-buyer.md` | 1 | 0.687 | 0.687 | 0.687 |
| `agents:parse:seo.md` | 2 | 0.603 | 0.603 | 0.603 |
| `agents:parse:marketing-director.md` | 1 | 0.867 | 0.867 | 0.867 |
| `agents:parse:nanoclaw.md` | 1 | 0.671 | 0.671 | 0.671 |
| `agents:parse:ops.md` | 1 | 1.14 | 1.14 | 1.14 |
| `agents:parse:researcher.md` | 2 | 0.328 | 0.328 | 0.328 |
| `agents:parse:tutor.md` | 2 | 0.378 | 0.378 | 0.378 |
| `agents:parse:world.md` | 1 | 0.091 | 0.091 | 0.091 |
| `agents:parse:cfo.md` | 1 | 0.889 | 0.889 | 0.889 |
| `agents:parse:cto.md` | 1 | 0.655 | 0.655 | 0.655 |
| `agents:parse:router.md` | 1 | 0.528 | 0.528 | 0.528 |
| `agents:parse:sales-director.md` | 1 | 2.47 | 2.47 | 2.47 |
| `agents:parse:scout.md` | 1 | 0.629 | 0.629 | 0.629 |
| `agents:parse:service-director.md` | 1 | 0.900 | 0.900 | 0.900 |
| `agents:parse:teacher.md` | 1 | 0.858 | 0.858 | 0.858 |
| `agents:parse:moderator.md` | 1 | 0.562 | 0.562 | 0.562 |
| `agents:parse:writer.md` | 2 | 0.822 | 0.822 | 0.822 |
| `agents:parse:testnet-buyer.md` | 1 | 0.528 | 0.528 | 0.528 |
| `agents:parse:trader.md` | 1 | 0.504 | 0.504 | 0.504 |
| `agents:parse:you.md` | 1 | 0.618 | 0.618 | 0.618 |
| `signalSender:mark` | 1 | 0.047 | 0.047 | 0.047 |
| `edge:cache:hit:sync-path` | 1 | 8.14e-5 | 8.14e-5 | 8.14e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1614/1637 tests · 46494ms across 126 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 11405ms |
| `llm.test.ts` | 14 | 6144ms |
| `llm-router.test.ts` | 12 | 3902ms |
| `system-speed.test.ts` | 15 | 3431ms |
| `tick.test.ts` | 9 | 1853ms |
| `api-endpoints.test.ts` | 21 | 1711ms |
| `sui-speed.test.ts` | 7 | 1230ms |
| `sui.test.ts` | 6 | 1230ms |
| `learning-acceleration.test.ts` | 20 | 1081ms |
| `speed-lifecycle.test.ts` | 14 | 1016ms |

---

_Report generated 2026-04-20T03:01:12.038Z._
