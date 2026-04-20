# Speed Test Report

> **Auto-generated** by `scripts/speed-report.ts` from vitest artifacts.
> Do not edit by hand — rerun `bun run scripts/speed-report.ts` to refresh.

| | |
|---|---|
| Generated at | 2026-04-15T04:41:52.161Z |
| Test run at | 2026-04-15T04:41:46.017Z |
| Latest sample at | 2026-04-15T04:41:52.077Z |
| Source | `.vitest/results.json` + `.vitest/speed.ndjson` |

**Two kinds of timing, both recorded every run:**

1. **Per-test wall-clock** — Vitest's JSON reporter captures every test's
   total duration. Catches suite-wide regressions.
2. **Named inner samples** — `measure('label', fn, iters)` records per-iteration
   ms for hot paths. Survives test renames; aggregates to p50/p95.

See [testing.md](TESTING.md) for the strategy.

---

## Per-Test Wall-Clock (from Vitest)

**Totals:** ✗ 469/470 pass · 6974ms total · 31 files

### Files, slowest first

| File | Tests | Passed | Failed | Duration |
|------|------:|-------:|-------:|---------:|
| `llm-router.test.ts` | 12 | 12 | 0 | 3768ms |
| `sui.test.ts` | 6 | 5 | 1 | 1302ms |
| `api-key.test.ts` | 13 | 13 | 0 | 381ms |
| `routing.test.ts` | 54 | 54 | 0 | 286ms |
| `context.test.ts` | 29 | 29 | 0 | 187ms |
| `naming.test.ts` | 2 | 2 | 0 | 162ms |
| `lifecycle.test.ts` | 19 | 19 | 0 | 138ms |
| `agents.test.ts` | 5 | 5 | 0 | 112ms |
| `api-auth.test.ts` | 17 | 17 | 0 | 88.54ms |
| `signalSender.test.ts` | 6 | 6 | 0 | 83.94ms |
| `one.test.ts` | 25 | 25 | 0 | 68.53ms |
| `loop.test.ts` | 31 | 31 | 0 | 50.54ms |
| `task-sync.test.ts` | 13 | 13 | 0 | 41.53ms |
| `persist.test.ts` | 39 | 39 | 0 | 39.52ms |
| `parallel-sessions.test.ts` | 7 | 7 | 0 | 34.21ms |
| `wave-lock.test.ts` | 7 | 7 | 0 | 30.09ms |
| `ownership.test.ts` | 10 | 10 | 0 | 29.37ms |
| `edge.test.ts` | 8 | 8 | 0 | 27.72ms |
| `skins.test.ts` | 27 | 27 | 0 | 25.18ms |
| `intent.test.ts` | 10 | 10 | 0 | 23.09ms |
| `expire-tick.test.ts` | 8 | 8 | 0 | 18.89ms |
| `clear-owner.test.ts` | 9 | 9 | 0 | 13.63ms |
| `task-parse.test.ts` | 19 | 19 | 0 | 10.27ms |
| `builder.test.ts` | 5 | 5 | 0 | 8.21ms |
| `agent-md.test.ts` | 31 | 31 | 0 | 8.16ms |
| `guard-sync.test.ts` | 5 | 5 | 0 | 7.74ms |
| `rubric.test.ts` | 19 | 19 | 0 | 7.14ms |
| `filter-active.test.ts` | 5 | 5 | 0 | 6.63ms |
| `doc-scan.test.ts` | 17 | 17 | 0 | 6.24ms |
| `derive.test.ts` | 4 | 4 | 0 | 5.24ms |
| `subscribe.test.ts` | 8 | 8 | 0 | 3.43ms |

### Top 20 slowest individual tests

| Duration | File | Test |
|---------:|------|------|
| 3158ms | `llm-router.test.ts` | Act 1: STAN routes away from failures, toward success pheromone reflects success rate after 60 signals |
| 872ms | `sui.test.ts` | Sui identity — speed addressFor stays under routing budget |
| 440ms | `llm-router.test.ts` | Act 5: Compound effect — cost falls, quality rises, highways form simulates 200 signals and proves the cost/quality curve from the plan doc |
| 393ms | `sui.test.ts` | Sui identity — determinism addressFor(uid) is deterministic |
| 152ms | `api-key.test.ts` | Act 2: hashKey + verifyKey — round-trip and rejection two hashes of the same key differ (unique salts) |
| 141ms | `llm-router.test.ts` | Act 6: Highway formation — when the route becomes the answer proves highway threshold reached and LLM skipped (net strength >= 20) |
| 92.37ms | `naming.test.ts` | naming — dead names dead-name count does not exceed baseline |
| 90.18ms | `context.test.ts` | docIndex returns an array of DocMeta objects |
| 70.00ms | `naming.test.ts` | naming — dead names baseline stays honest — flag when offenders shrink (ratchet down) |
| 67.57ms | `api-key.test.ts` | Act 2: hashKey + verifyKey — round-trip and rejection rejects a subtly modified key (one char swapped) |
| 61.45ms | `agents.test.ts` | agents — markdown shape parse stays under budget (median) |
| 59.38ms | `api-key.test.ts` | Act 2: hashKey + verifyKey — round-trip and rejection verifies the original key against its hash |
| 54.94ms | `signalSender.test.ts` | signalSender — speed sender overhead stays trivial (pure JSON + fetch stub) |
| 54.16ms | `api-key.test.ts` | Act 2: hashKey + verifyKey — round-trip and rejection rejects a different key against the hash |
| 53.20ms | `routing.test.ts` | Act 3: Signal chains — scout → analyst → reporter emit() fans out — one signal spawns many |
| 51.98ms | `routing.test.ts` | Act 3: Signal chains — scout → analyst → reporter three agents, two continuations, pheromone on every edge |
| 50.92ms | `routing.test.ts` | Act 6: Four outcomes — every call teaches the system timeout: agent too slow → neutral, no punishment |
| 50.77ms | `one.test.ts` | ONE timers emits on schedule |
| 47.89ms | `api-auth.test.ts` | Act 1: missing or malformed header returns isValid: false when no Authorization header |
| 35.57ms | `api-key.test.ts` | Act 2: hashKey + verifyKey — round-trip and rejection hash output always starts with $pbkdf2$ sentinel |

---

## Named Speed Samples (from `measure()`)

**1 samples across 1 named measurements.**
All times in milliseconds (per-iteration for iters > 1).

| Name | Count | min | p50 | p95 | max | mean |
|------|------:|----:|----:|----:|----:|-----:|
| `sui:address:derive` | 1 | 1.88 | 1.88 | 1.88 | 1.88 | 1.88 |

---

_Report generated 2026-04-15T04:41:52.162Z._
