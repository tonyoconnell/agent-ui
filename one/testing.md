# Testing Strategy

Tests live **inside** the AI edit loop. Every wave runs `bun run verify` before
it starts (W0) and before it closes (W4). Green → `mark()`. Red → `warn()`.
That's why the suite has to be fast, focused, and honest.

> **Two axes, one gate:** every test earns its keep by raising **routing
> accuracy** or **routing speed**. Nothing else. No coverage-for-coverage,
> no slow/flaky suites in the W0 gate.
>
> **Every test records its duration.** Accuracy without speed is half a
> signal. A test that passes but slows the gate is a `warn()` on itself.

See also: [speed.md](one/speed.md), [rubrics.md](rubrics.md),
[TODO-testing.md](TODO-testing.md) (the full execution plan).

---

## The Gate

One command. Same locally and in CI.

```bash
bun run verify       # biome + tsc + vitest — the W0/W4 gate
bun vitest watch     # dev loop
PERF_SCALE=1 bun vitest run   # strict timing (CI / idle hardware)
```

| Tool | Role | Why |
|------|------|-----|
| **biome** | format + lint + unused check | Catches dead code, enforces style, zero config drift |
| **tsc** | type check | Types are the cheapest test — they run at compile time |
| **vitest** | unit + behavior | Fast, ESM-native, same syntax as the runtime |

**Rule:** if `bun run verify` takes longer than ~10s, we've added the wrong test.
The gate must stay inside the edit loop's attention span.

---

## What We Test (and Why)

Tests exist to answer one of two questions:

```
ACCURACY                              SPEED
─────────                             ─────
Did the signal reach the right        Did it stay inside budget?
receiver with the right data?
                                      (budget = pheromone can still
(outcome = mark() vs warn())          calibrate meaningfully)
```

Everything the engine does maps to one of these. If a test doesn't, delete it.

---

## Four Layers of the Sandwich

```
LAYER              SCOPE                 WHERE                 BUDGET
─────              ─────                 ─────                 ──────
1. Type            compile time          tsc                   instant
2. Lint            file-local rules      biome                 <1s
3. Unit            one handler / fn      vitest (*.test.ts)    <7s total
4. Integration     signal → outcome      vitest + tunnel/e2e   on demand
```

Layers 1–3 are the **W0/W4 gate**. Layer 4 runs before deploy, not on every
edit — too slow for the inner loop.

---

## Unit Tests (The Core)

**320 tests across 19 files. <7 seconds total.** This is the inner loop.

```bash
bun vitest run src/engine/routing.test.ts
```

What they cover:

| Area | What it proves |
|------|----------------|
| `routing.test.ts` | `select()` follows strength − resistance, ties break deterministically |
| `pheromone.test.ts` | `mark()` / `warn()` / `fade()` math, asymmetric decay (resistance 2× faster) |
| `world.test.ts` | unit add/remove, queue drain order, signal dispatch |
| `persist.test.ts` | TypeDB sandwich: isToxic, capability check, dissolve |
| `loop.test.ts` | L1–L7 tick ordering, chain depth, 4 outcome types |
| `llm.test.ts` | adapter contract (openrouter / anthropic / openai) |
| `agent-md.test.ts` | markdown → AgentSpec → TQL inserts |

Each test pins a **behavior**, not an implementation. If the internal data
structure changes but the routing outcome doesn't, the test stays green.

---

## Testing Humans and Agents (Same Harness)

Humans and agents are both **units** in the substrate. A test that exercises
a handler works identically whether that handler is a function, an LLM call,
or a person on Telegram.

```typescript
// Agent unit — LLM under the hood
test('creative:copy produces headline on valid brief', async () => {
  const { result, dissolved } = await net.ask({
    receiver: 'creative:copy',
    data: { tags: ['headline'], content: brief },
  })
  expect(dissolved).toBeFalsy()
  expect(result).toMatchObject({ headline: expect.any(String) })
})

// Human unit — mocked inbox, same shape
test('donal:approve marks path on ack', async () => {
  const human = mockHuman('donal')
  net.signal({ receiver: 'donal:approve', data: proposal })
  human.ack()
  expect(net.sense('creative→donal')).toBeGreaterThan(0)
})
```

The harness doesn't care what's behind the unit. That's the point: **the
contract is the signal, not the implementation.**

For LLM units, we pin the **contract** (shape, tags, non-empty result) not
the prose. Prompts evolve (L5 loop); tests must survive generation bumps.

---

## Speed Is Always Recorded

**Every test records its duration.** Not just "speed tests" — every test.
Speed is an accuracy signal: a correct result that missed its budget still
breaks the loop, because downstream asks time out and `warn()` fires on
paths that didn't actually fail.

Vitest records per-test duration by default. We amplify this in three ways:

### 1. Per-test timing → JSON artifact

`vitest.config.ts` enables the JSON reporter on every run. Every `bun run verify`
drops `.vitest/results.json` — per-file, per-test, duration in ms. The deploy
script can read it and emit `test:timing` signals so pheromone accumulates on
**fast test paths** the way it does on fast routing paths.

### 1b. Named speed samples → `measure()` helper

For inner measurements that survive test renames, use the helper:

```ts
import { measure, measureSync } from '@/__tests__/helpers/speed'

// async — returns per-iteration ms
const ms = await measure('edge:cache:hit', () => getPaths(kv), 10_000)

// sync — for hot loops
const perOp = measureSync('routing:select', () => net.select(), 10_000)
```

Samples append to `.vitest/speed.ndjson` (NDJSON, safe for parallel workers).
Each entry: `{ name, ms, total, iters, at }`. Aggregate with
`readSamples()` from the same helper.

### 1c. Auto-generated System Speed Report

After **every** `vitest` run (pass or fail), a global teardown regenerates
[docs/speed-test.md](speed-test.md) — the **System Speed Report**. This
measures the *production substrate's* speed (routing, pheromone, signals,
cache, identity), NOT the test harness. The report:

- Groups benchmarks by layer (routing / pheromone / signal / identity / edge)
- Compares p50/p95 against budgets sourced from [speed.md](one/speed.md)
- Shows verdict: ✓ pass · ◐ pass within PERF_SCALE · ✗ over
- Appends ad-hoc samples that lack a budget

The benchmark tests (`src/__tests__/bench/system-speed.test.ts`) **record,
they don't gate** — absolute-threshold assertions flake under concurrent
suite load. Pass/fail lives in the report, not the test.

Extending: call `measure('<layer>:<op>', fn, iters)` from any test; add a
budget in `scripts/speed-report.ts` to get the verdict column.

Manual refresh: `bun run scripts/speed-report.ts`.

### 2. Benchmarks use p50/p95, not thresholds

```typescript
import { bench, describe } from 'vitest'

describe('routing budget', () => {
  bench('select() on 100-unit world', () => {
    net.select('process')
  }, { iterations: 10_000 })
})
```

`vitest bench` records p50/p95/p99 across iterations. Report the
distribution, don't assert a single number. Real hardware has GC, context
switches, CPU scaling — `PERF_SCALE=3` (default) tolerates noisy laptops;
CI runs `PERF_SCALE=1` on idle runners. See [speed.md](one/speed.md).

### 3. Integration tests log latency per hop

E2E tests log the time for each boundary crossing (browser → Pages → Gateway
→ TypeDB) so regressions are attributable. A doubled round-trip in one hop
is invisible if you only measure end-to-end.

**Enforcement:** the W0 gate fails if total `bun run verify` exceeds a soft
budget (~10s). Adding tests is cheap; keeping the gate fast is the discipline.

update speed.md with test results
---

## Integration — VCR Cassettes

**Layer 4 integration tests.** Record real TypeDB interactions once; replay from
disk in all future runs. No network, no credentials, no Docker. Fast.

```bash
# Replay (CI / local — no credentials needed)
bun vitest run src/__tests__/integration/signal-flow.test.ts
bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
bun vitest run src/__tests__/integration/memory-reveal.test.ts
# → 6 tests, ~377ms, zero network
```

**Schema staleness detection.** Each cassette stores a hash of `world.tql`.
On replay, if the schema changed, the cassette throws immediately:

```
Error: Cassette 'path-roundtrip' is stale — schema has changed.
  Recorded against schema: f121c9727aa0
  Current schema:          3a8b21c44d91
Re-record with: RECORD=1 GATEWAY_API_KEY=<key> ...
```

**To re-record** (only needed when `world.tql` changes):

```bash
TYPEDB_DIRECT_URL="" TYPEDB_DIRECT_USERNAME="" TYPEDB_DIRECT_PASSWORD="" TYPEDB_DIRECT_DATABASE="" \
  GATEWAY_API_KEY="<your-api.one.ie-key>" \
  PUBLIC_GATEWAY_URL="https://api.one.ie" \
  RECORD=1 bun vitest run src/__tests__/integration/<test>.test.ts
```

Cassettes live in `src/__tests__/cassettes/`. The helper is
`src/__tests__/helpers/cassette.ts`. Full spec: `one/integration-tests.md`.

---

## E2E

Runs before deploy, not on every edit. Validates the real wire:
browser → Pages → Gateway → TypeDB.

```bash
# With dev servers running
bash scripts/e2e-test.sh
```

Checks: CORS, TypeQL round-trip, signal writes, aggregation queries, full-stack
latency. Last run: 100% pass, average 1019ms, p95 2100ms. TypeDB Cloud is
80–90% of that — not something tests can fix, but something they must **measure**
so we route around it.

See [e2e-test-quickstart.md](e2e-test-quickstart.md) and
[e2e-test-report.md](e2e-test-report.md) for the full breakdown.

---

## How Tests Feed the Loop

This is why testing strategy matters to AI codegen specifically:

```
W1 recon     →  Haiku reads failing test + the file under test
W2 decide    →  Opus chooses the fix (DSL.md + dictionary.md loaded)
W3 edit      →  Sonnet writes the patch
W4 verify    →  bun run verify — green is mark(), red is warn()
                                     │
                                     └──► pheromone on (persona → pattern)
                                          next cycle picks the stronger path
```

**Tests are the deterministic half of the sandwich around the LLM.** They're
why the system can't get dumber on average — every cycle either strengthens a
path that worked or weakens one that didn't. Without tests, `mark()` is vibes.

---

## What NOT to Test

- **Implementation details** (internal Map keys, private fn names) — brittle, blocks refactor
- **The LLM's prose** — generations change; pin shape + tags instead
- **Absolute timings in ms** — use p50/p95 with `PERF_SCALE`
- **Third-party guarantees** (TypeDB quorum, CF queue ordering) — their job, not ours
- **Coverage for coverage's sake** — if a test doesn't raise accuracy or speed, delete it

---

## Known-Flaky Allowlist

A small set of stochastic tests (LLM sampling, network timing) are flagged
in the deploy script. They can fail without blocking deploy, but they can't
`mark()` either — they're muted, not trusted. Audit them every cycle; either
fix them or delete them. Flaky-forever is worse than missing.

---

## Quick Reference

```bash
bun run verify                              # the gate
bun vitest watch                            # dev
bun vitest run src/engine/routing.test.ts   # focused
PERF_SCALE=1 bun vitest run                 # strict (CI)
bash scripts/e2e-test.sh                    # pre-deploy
```

**Last core run:** 320/320 pass, <7s. **Last e2e:** 18/18 pass, p95 2100ms.
Timing artifact: `.vitest/results.json` (regenerated every run).

---

## See Also

- [speed.md](one/speed.md) — the benchmarks tests verify
- [rubrics.md](rubrics.md) — quality scoring (fit / form / truth / taste)
- [TODO-testing.md](TODO-testing.md) — execution plan, 3 cycles, W1–W4
- [routing.md](routing.md) — the sandwich pattern tests extend
- [DSL.md](one/DSL.md) — signal language tests speak
- [dictionary.md](dictionary.md) — canonical names

---

*Two axes: accuracy and speed. One gate: `bun run verify`. Tests inside the
loop, not beside it.*
