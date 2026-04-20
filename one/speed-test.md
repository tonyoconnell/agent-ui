# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T03:22:32.001Z |
| Test run at | 2026-04-20T03:21:58.066Z |
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
| `routing:select:100` | 0.005ms | 0.007 | 0.007 | 0.007 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.080 | 0.080 | 0.080 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.86e-4 | 3.86e-4 | 3.86e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.12e-4 | 2.12e-4 | 2.12e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.36e-5 | 4.36e-5 | 4.36e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.144 | 0.144 | 0.144 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.21e-4 | 9.21e-4 | 9.21e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.23e-4 | 1.23e-4 | 1.23e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.79 | 2.79 | 2.79 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.81e-4 | 2.81e-4 | 2.81e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.44 | 3.44 | 3.44 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.33e-4 | 1.33e-4 | 1.33e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 5.78e-4 | 5.78e-4 | 5.78e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.349 | 0.349 | 0.349 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.044 | 0.044 | 0.044 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 3.99 | 3.99 | 3.99 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.05e-4 | 3.05e-4 | 3.05e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 1.67e-4 | 1.67e-4 | 1.67e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.57 | 2.57 | 2.57 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 4.63e-4 | 4.63e-4 | 4.63e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.41e-4 | 2.41e-4 | 2.41e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.05e-4 | 1.05e-4 | 1.05e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.46e-5 | 7.46e-5 | 7.46e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.173 | 0.173 | 0.173 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.72e-5 | 4.72e-5 | 4.72e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.088 | 0.088 | 0.088 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.081 | 0.081 | 0.081 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.62 | 2.62 | 2.62 |
| `naming:scan-src` | 1 | 106 | 106 | 106 |
| `agents:parse:analyst.md` | 2 | 0.196 | 0.196 | 0.196 |
| `agents:parse:asi-builder.md` | 1 | 0.254 | 0.254 | 0.254 |
| `agents:parse:ceo.md` | 4 | 0.426 | 0.569 | 0.569 |
| `agents:parse:coder.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:community-director.md` | 1 | 0.366 | 0.366 | 0.366 |
| `agents:parse:community.md` | 2 | 0.266 | 0.266 | 0.266 |
| `agents:parse:concierge.md` | 3 | 0.157 | 0.199 | 0.199 |
| `agents:parse:classify.md` | 1 | 0.081 | 0.081 | 0.081 |
| `agents:parse:valence.md` | 1 | 0.080 | 0.080 | 0.080 |
| `agents:parse:bob.md` | 1 | 0.456 | 0.456 | 0.456 |
| `agents:parse:lexi.md` | 1 | 0.147 | 0.147 | 0.147 |
| `agents:parse:david.md` | 1 | 0.120 | 0.120 | 0.120 |
| `agents:parse:ai-ranking.md` | 2 | 0.249 | 0.249 | 0.249 |
| `agents:parse:amara.md` | 1 | 0.666 | 0.666 | 0.666 |
| `agents:parse:assessment.md` | 1 | 0.528 | 0.528 | 0.528 |
| `agents:parse:citation.md` | 2 | 0.168 | 0.168 | 0.168 |
| `agents:parse:cmo.md` | 3 | 0.236 | 1.15 | 1.15 |
| `agents:parse:content.md` | 2 | 0.192 | 0.192 | 0.192 |
| `agents:parse:edu.md` | 1 | 0.228 | 0.228 | 0.228 |
| `agents:parse:enrollment.md` | 1 | 0.224 | 0.224 | 0.224 |
| `agents:parse:forum.md` | 2 | 0.310 | 0.310 | 0.310 |
| `agents:parse:full.md` | 2 | 0.150 | 0.150 | 0.150 |
| `agents:parse:mktg.md` | 1 | 0.226 | 0.226 | 0.226 |
| `agents:parse:monthly.md` | 2 | 0.146 | 0.146 | 0.146 |
| `agents:parse:niche-dir.md` | 2 | 0.203 | 0.203 | 0.203 |
| `agents:parse:outreach.md` | 2 | 0.214 | 0.214 | 0.214 |
| `agents:parse:quick.md` | 2 | 0.192 | 0.192 | 0.192 |
| `agents:parse:sales.md` | 1 | 0.187 | 0.187 | 0.187 |
| `agents:parse:schema.md` | 2 | 0.164 | 0.164 | 0.164 |
| `agents:parse:social.md` | 4 | 0.290 | 0.479 | 0.479 |
| `agents:parse:support.md` | 2 | 0.392 | 0.392 | 0.392 |
| `agents:parse:upsell.md` | 1 | 0.212 | 0.212 | 0.212 |
| `agents:parse:welcome.md` | 1 | 0.122 | 0.122 | 0.122 |
| `agents:parse:designer.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:ehc-officer.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:engineering-director.md` | 1 | 0.325 | 0.325 | 0.325 |
| `agents:parse:eth-dev.md` | 1 | 0.246 | 0.246 | 0.246 |
| `agents:parse:founder.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:guard.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:harvester.md` | 1 | 0.127 | 0.127 | 0.127 |
| `agents:parse:ads.md` | 2 | 0.423 | 0.423 | 0.423 |
| `agents:parse:creative.md` | 1 | 0.257 | 0.257 | 0.257 |
| `agents:parse:director.md` | 3 | 0.289 | 0.299 | 0.299 |
| `agents:parse:media-buyer.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:seo.md` | 2 | 0.389 | 0.389 | 0.389 |
| `agents:parse:marketing-director.md` | 1 | 0.463 | 0.463 | 0.463 |
| `agents:parse:nanoclaw.md` | 1 | 0.191 | 0.191 | 0.191 |
| `agents:parse:ops.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:researcher.md` | 2 | 0.166 | 0.166 | 0.166 |
| `agents:parse:tutor.md` | 2 | 0.264 | 0.264 | 0.264 |
| `agents:parse:world.md` | 1 | 0.072 | 0.072 | 0.072 |
| `agents:parse:cfo.md` | 1 | 0.260 | 0.260 | 0.260 |
| `agents:parse:cto.md` | 1 | 0.857 | 0.857 | 0.857 |
| `agents:parse:router.md` | 1 | 0.522 | 0.522 | 0.522 |
| `agents:parse:sales-director.md` | 1 | 0.554 | 0.554 | 0.554 |
| `agents:parse:scout.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:service-director.md` | 1 | 0.344 | 0.344 | 0.344 |
| `agents:parse:teacher.md` | 1 | 0.497 | 0.497 | 0.497 |
| `agents:parse:moderator.md` | 1 | 0.350 | 0.350 | 0.350 |
| `agents:parse:writer.md` | 2 | 0.392 | 0.392 | 0.392 |
| `agents:parse:testnet-buyer.md` | 1 | 0.213 | 0.213 | 0.213 |
| `agents:parse:trader.md` | 1 | 0.430 | 0.430 | 0.430 |
| `agents:parse:you.md` | 1 | 0.252 | 0.252 | 0.252 |
| `signalSender:mark` | 1 | 0.021 | 0.021 | 0.021 |
| `edge:cache:hit:sync-path` | 1 | 2.93e-5 | 2.93e-5 | 2.93e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1613/1642 tests · 69234ms across 127 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `chairman-chain.test.ts` | 27 | 29728ms |
| `phase2-keypair-derivation.test.ts` | 14 | 18480ms |
| `llm.test.ts` | 14 | 6073ms |
| `llm-router.test.ts` | 12 | 3703ms |
| `chat-chairman-integration.test.ts` | 6 | 1241ms |
| `system-speed.test.ts` | 15 | 1192ms |
| `tick.test.ts` | 9 | 812ms |
| `sui-speed.test.ts` | 7 | 614ms |
| `adl-llm.test.ts` | 5 | 491ms |
| `sui.test.ts` | 6 | 451ms |

---

_Report generated 2026-04-20T03:22:32.002Z._
