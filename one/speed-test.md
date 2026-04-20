# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T05:29:22.718Z |
| Test run at | 2026-04-20T05:28:58.924Z |
| Benchmarks measured | 112 named ops, 142 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **43 pass** · **2 over** · 0 missing |
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
| `routing:select:100` | 0.005ms | 0.024 | 0.024 | 0.024 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.287 | 0.287 | 0.287 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.027 | 0.027 | 0.027 | 1 | ✗ over |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.002 | 0.002 | 0.002 | 1 | ◐ pass (within 3× scale) | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 5.95e-4 | 5.95e-4 | 5.95e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.73e-4 | 4.73e-4 | 4.73e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.542 | 0.542 | 0.542 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 4.46e-4 | 4.46e-4 | 4.46e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.063 | 0.063 | 0.063 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 7.74 | 7.74 | 7.74 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 8.49e-4 | 8.49e-4 | 8.49e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 8.40 | 8.40 | 8.40 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 4.85e-4 | 4.85e-4 | 4.85e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.044 | 0.044 | 0.044 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 1.33 | 1.33 | 1.33 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.168 | 0.168 | 0.168 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.053 | 0.053 | 0.053 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 14.75 | 14.75 | 14.75 | 1 | ◐ pass (within 3× scale) | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 9.88e-4 | 9.88e-4 | 9.88e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.039 | 0.039 | 0.039 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 8.78 | 8.78 | 8.78 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 4.62e-4 | 4.62e-4 | 4.62e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.68e-4 | 2.68e-4 | 2.68e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.48e-4 | 7.48e-4 | 7.48e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.775 | 0.775 | 0.775 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.040 | 0.040 | 0.040 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.028 | 0.028 | 0.028 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 8.74e-5 | 8.74e-5 | 8.74e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.299 | 0.299 | 0.299 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.295 | 0.295 | 0.295 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 6.79 | 6.79 | 6.79 |
| `naming:scan-src` | 1 | 410 | 410 | 410 |
| `agents:parse:analyst.md` | 2 | 0.657 | 0.657 | 0.657 |
| `agents:parse:asi-builder.md` | 1 | 0.655 | 0.655 | 0.655 |
| `agents:parse:ceo.md` | 4 | 0.809 | 1.10 | 1.10 |
| `agents:parse:coder.md` | 1 | 0.520 | 0.520 | 0.520 |
| `agents:parse:community-director.md` | 1 | 1.23 | 1.23 | 1.23 |
| `agents:parse:community.md` | 2 | 0.737 | 0.737 | 0.737 |
| `agents:parse:concierge.md` | 3 | 0.437 | 0.611 | 0.611 |
| `agents:parse:classify.md` | 1 | 0.279 | 0.279 | 0.279 |
| `agents:parse:valence.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:bob.md` | 1 | 0.627 | 0.627 | 0.627 |
| `agents:parse:lexi.md` | 1 | 0.445 | 0.445 | 0.445 |
| `agents:parse:david.md` | 1 | 0.410 | 0.410 | 0.410 |
| `agents:parse:ai-ranking.md` | 2 | 0.944 | 0.944 | 0.944 |
| `agents:parse:amara.md` | 1 | 0.858 | 0.858 | 0.858 |
| `agents:parse:assessment.md` | 1 | 0.972 | 0.972 | 0.972 |
| `agents:parse:citation.md` | 2 | 0.524 | 0.524 | 0.524 |
| `agents:parse:cmo.md` | 3 | 0.836 | 0.843 | 0.843 |
| `agents:parse:content.md` | 2 | 0.618 | 0.618 | 0.618 |
| `agents:parse:edu.md` | 1 | 0.686 | 0.686 | 0.686 |
| `agents:parse:enrollment.md` | 1 | 0.897 | 0.897 | 0.897 |
| `agents:parse:forum.md` | 2 | 0.492 | 0.492 | 0.492 |
| `agents:parse:full.md` | 2 | 0.446 | 0.446 | 0.446 |
| `agents:parse:mktg.md` | 1 | 0.533 | 0.533 | 0.533 |
| `agents:parse:monthly.md` | 2 | 0.396 | 0.396 | 0.396 |
| `agents:parse:niche-dir.md` | 2 | 0.557 | 0.557 | 0.557 |
| `agents:parse:outreach.md` | 2 | 0.442 | 0.442 | 0.442 |
| `agents:parse:quick.md` | 2 | 0.402 | 0.402 | 0.402 |
| `agents:parse:sales.md` | 1 | 0.430 | 0.430 | 0.430 |
| `agents:parse:schema.md` | 2 | 0.485 | 0.485 | 0.485 |
| `agents:parse:social.md` | 4 | 0.643 | 0.859 | 0.859 |
| `agents:parse:support.md` | 2 | 0.940 | 0.940 | 0.940 |
| `agents:parse:upsell.md` | 1 | 0.767 | 0.767 | 0.767 |
| `agents:parse:welcome.md` | 1 | 0.585 | 0.585 | 0.585 |
| `agents:parse:designer.md` | 1 | 0.790 | 0.790 | 0.790 |
| `agents:parse:ehc-officer.md` | 1 | 0.763 | 0.763 | 0.763 |
| `agents:parse:engineering-director.md` | 1 | 1.17 | 1.17 | 1.17 |
| `agents:parse:eth-dev.md` | 1 | 0.872 | 0.872 | 0.872 |
| `agents:parse:founder.md` | 1 | 0.673 | 0.673 | 0.673 |
| `agents:parse:guard.md` | 1 | 0.713 | 0.713 | 0.713 |
| `agents:parse:harvester.md` | 1 | 0.352 | 0.352 | 0.352 |
| `agents:parse:ads.md` | 2 | 0.704 | 0.704 | 0.704 |
| `agents:parse:creative.md` | 1 | 0.635 | 0.635 | 0.635 |
| `agents:parse:director.md` | 3 | 0.674 | 0.724 | 0.724 |
| `agents:parse:media-buyer.md` | 1 | 0.741 | 0.741 | 0.741 |
| `agents:parse:seo.md` | 2 | 0.824 | 0.824 | 0.824 |
| `agents:parse:marketing-director.md` | 1 | 0.944 | 0.944 | 0.944 |
| `agents:parse:nanoclaw.md` | 1 | 0.617 | 0.617 | 0.617 |
| `agents:parse:ops.md` | 1 | 0.613 | 0.613 | 0.613 |
| `agents:parse:researcher.md` | 2 | 0.601 | 0.601 | 0.601 |
| `agents:parse:tutor.md` | 2 | 0.488 | 0.488 | 0.488 |
| `agents:parse:world.md` | 1 | 0.335 | 0.335 | 0.335 |
| `agents:parse:cfo.md` | 1 | 0.668 | 0.668 | 0.668 |
| `agents:parse:cto.md` | 1 | 0.708 | 0.708 | 0.708 |
| `agents:parse:router.md` | 1 | 0.571 | 0.571 | 0.571 |
| `agents:parse:sales-director.md` | 1 | 1.49 | 1.49 | 1.49 |
| `agents:parse:scout.md` | 1 | 0.419 | 0.419 | 0.419 |
| `agents:parse:service-director.md` | 1 | 0.943 | 0.943 | 0.943 |
| `agents:parse:teacher.md` | 1 | 1.12 | 1.12 | 1.12 |
| `agents:parse:moderator.md` | 1 | 0.673 | 0.673 | 0.673 |
| `agents:parse:writer.md` | 2 | 1.01 | 1.01 | 1.01 |
| `agents:parse:testnet-buyer.md` | 1 | 0.547 | 0.547 | 0.547 |
| `agents:parse:trader.md` | 1 | 0.680 | 0.680 | 0.680 |
| `agents:parse:you.md` | 1 | 0.673 | 0.673 | 0.673 |
| `signalSender:mark` | 1 | 0.120 | 0.120 | 0.120 |
| `edge:cache:hit:sync-path` | 1 | 0.002 | 0.002 | 0.002 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1619/1642 tests · 53780ms across 127 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 11596ms |
| `llm.test.ts` | 14 | 6148ms |
| `system-speed.test.ts` | 15 | 3904ms |
| `llm-router.test.ts` | 12 | 3784ms |
| `tick.test.ts` | 9 | 2213ms |
| `api-endpoints.test.ts` | 21 | 2082ms |
| `sui-speed.test.ts` | 7 | 1591ms |
| `learning-acceleration.test.ts` | 20 | 1308ms |
| `sui.test.ts` | 6 | 1252ms |
| `register-wallet.test.ts` | 5 | 1149ms |

---

_Report generated 2026-04-20T05:29:22.721Z._
