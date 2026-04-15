# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T10:04:16.812Z |
| Test run at | 2026-04-15T10:04:09.115Z |
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
| `routing:select:100` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.121 | 0.121 | 0.121 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.007 | 0.007 | 0.007 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.89e-4 | 3.89e-4 | 3.89e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 3.35e-4 | 3.35e-4 | 3.35e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.42e-5 | 5.42e-5 | 5.42e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.169 | 0.169 | 0.169 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 7.87e-4 | 7.87e-4 | 7.87e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.48e-4 | 1.48e-4 | 1.48e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.084 | 0.084 | 0.084 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.43 | 3.43 | 3.43 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.16e-4 | 3.16e-4 | 3.16e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.62 | 3.62 | 3.62 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.76e-4 | 1.76e-4 | 1.76e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.029 | 0.029 | 0.029 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.501 | 0.501 | 0.501 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 6.60 | 6.60 | 6.60 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.44e-4 | 3.44e-4 | 3.44e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.42e-4 | 2.42e-4 | 2.42e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.84 | 3.84 | 3.84 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 5.51e-4 | 5.51e-4 | 5.51e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 8.21e-4 | 8.21e-4 | 8.21e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 3.33e-4 | 3.33e-4 | 3.33e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.23e-4 | 1.23e-4 | 1.23e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.209 | 0.209 | 0.209 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.89e-5 | 4.89e-5 | 4.89e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.127 | 0.127 | 0.127 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.155 | 0.155 | 0.155 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 3.17 | 3.17 | 3.17 |
| `agents:parse:analyst.md` | 2 | 0.469 | 0.469 | 0.469 |
| `agents:parse:asi-builder.md` | 1 | 0.335 | 0.335 | 0.335 |
| `agents:parse:coder.md` | 1 | 0.584 | 0.584 | 0.584 |
| `agents:parse:community.md` | 1 | 0.248 | 0.248 | 0.248 |
| `agents:parse:concierge.md` | 1 | 0.237 | 0.237 | 0.237 |
| `agents:parse:classify.md` | 1 | 0.093 | 0.093 | 0.093 |
| `agents:parse:valence.md` | 1 | 0.087 | 0.087 | 0.087 |
| `agents:parse:ai-ranking.md` | 2 | 0.353 | 0.353 | 0.353 |
| `agents:parse:citation.md` | 2 | 0.421 | 0.421 | 0.421 |
| `agents:parse:cmo.md` | 2 | 0.740 | 0.740 | 0.740 |
| `agents:parse:forum.md` | 2 | 0.466 | 0.466 | 0.466 |
| `agents:parse:full.md` | 2 | 0.477 | 0.477 | 0.477 |
| `agents:parse:monthly.md` | 2 | 0.523 | 0.523 | 0.523 |
| `agents:parse:niche-dir.md` | 2 | 0.434 | 0.434 | 0.434 |
| `agents:parse:outreach.md` | 2 | 0.277 | 0.277 | 0.277 |
| `agents:parse:quick.md` | 2 | 0.308 | 0.308 | 0.308 |
| `agents:parse:schema.md` | 2 | 0.248 | 0.248 | 0.248 |
| `agents:parse:social.md` | 3 | 0.283 | 0.472 | 0.472 |
| `agents:parse:designer.md` | 1 | 0.244 | 0.244 | 0.244 |
| `agents:parse:ehc-officer.md` | 1 | 0.395 | 0.395 | 0.395 |
| `agents:parse:eth-dev.md` | 1 | 0.284 | 0.284 | 0.284 |
| `agents:parse:founder.md` | 1 | 0.258 | 0.258 | 0.258 |
| `agents:parse:guard.md` | 1 | 0.168 | 0.168 | 0.168 |
| `agents:parse:harvester.md` | 1 | 0.144 | 0.144 | 0.144 |
| `agents:parse:ads.md` | 1 | 0.221 | 0.221 | 0.221 |
| `agents:parse:content.md` | 1 | 0.219 | 0.219 | 0.219 |
| `agents:parse:creative.md` | 1 | 0.641 | 0.641 | 0.641 |
| `agents:parse:director.md` | 1 | 0.278 | 0.278 | 0.278 |
| `agents:parse:media-buyer.md` | 1 | 0.216 | 0.216 | 0.216 |
| `agents:parse:seo.md` | 1 | 0.213 | 0.213 | 0.213 |
| `agents:parse:nanoclaw.md` | 1 | 0.226 | 0.226 | 0.226 |
| `agents:parse:ops.md` | 1 | 0.248 | 0.248 | 0.248 |
| `agents:parse:researcher.md` | 1 | 0.170 | 0.170 | 0.170 |
| `agents:parse:router.md` | 1 | 0.416 | 0.416 | 0.416 |
| `agents:parse:scout.md` | 1 | 0.155 | 0.155 | 0.155 |
| `agents:parse:teacher.md` | 1 | 0.491 | 0.491 | 0.491 |
| `agents:parse:trader.md` | 1 | 0.203 | 0.203 | 0.203 |
| `agents:parse:tutor.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:writer.md` | 1 | 0.164 | 0.164 | 0.164 |
| `naming:scan-src` | 1 | 108 | 108 | 108 |
| `signalSender:mark` | 1 | 0.035 | 0.035 | 0.035 |
| `edge:cache:hit:sync-path` | 1 | 5.16e-5 | 5.16e-5 | 5.16e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 681/681 tests · 15589ms across 51 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6080ms |
| `llm-router.test.ts` | 12 | 3896ms |
| `system-speed.test.ts` | 15 | 1586ms |
| `sui-speed.test.ts` | 7 | 814ms |
| `sui.test.ts` | 6 | 743ms |
| `api-key.test.ts` | 13 | 438ms |
| `routing.test.ts` | 54 | 273ms |
| `lifecycle-speed.test.ts` | 7 | 266ms |
| `context.test.ts` | 29 | 217ms |
| `agents.test.ts` | 5 | 209ms |

---

_Report generated 2026-04-15T10:04:16.820Z._
