---
title: TODO — Local install, upgrade, test, publish, consume
type: roadmap
version: 3.1.0
priority: Wire → Prove → Ship → Consume → Sense
total_tasks: 46
completed: 0
status: READY
---

# TODO: Install → Test → Publish → Install → Populate

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Goal:** Ship `oneie@3.7.0`, `@oneie/sdk@0.2.0`, `@oneie/mcp@0.1.0`,
> `@oneie/templates@0.2.0` to npm — but only after proving the packed
> tarballs work locally. Then install the published artifacts globally
> and use them to seed content back into this repo.
>
> **The two-gate install pattern:**
> ```
> local install (tarball) → prove it works → npm publish → install from npm → use it to generate content
>       Cycle 3              Cycle 3 gate      Cycle 4         Cycle 5            Cycle 5 gate
> ```
>
> **Why both gates:** the source tree and the packed tarball are different artifacts.
> Dogfooding from `packages/sdk/src/` proves the code. Dogfooding from a packed
> tarball proves the `dist/`, the `files[]` array, the `exports` map, and the
> `package.json` bin entries. Only the second one is what users install.
>
> **Source of truth:**
> - [one-toolkit-features.md](one-toolkit-features.md) — full feature inventory + gap analysis
> - [TODO-copy-toolkit.md](TODO-copy-toolkit.md) — what was built (3 cycles, done)
> - [pricing.md](pricing.md) — 5 tiers (Free/Builder/Scale/World/Enterprise)
> - [infra-models.md](infra-models.md) — BaaS / CF Pages / Managed / Detached
> - [DSL.md](one/DSL.md) — signal language, `{ receiver, data }`, mark/warn/fade
> - [dictionary.md](dictionary.md) — canonical names (locked dimension names)
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark
>
> **Shape:** 5 cycles.
>   - **C1 BASELINE** — verify all Cycle-1 gaps are already closed
>   - **C2 UPGRADE** — build P0: SubstrateClient + presets + buildWorld
>   - **C3 DOGFOOD** — pack + install locally, run against dev server
>   - **C4 SHIP** — version bump, publish in dep order, verify from npm
>   - **C5 CONSUME** — install globally from npm, scaffold content into envelopes/
>
> **What's in scope:** npm packages + one proof-of-consumption artifact.
> BaaS platform infrastructure (metering, dashboard, billing, WfP, CF for SaaS)
> is in [TODO-platform-baas.md](TODO-platform-baas.md).

---

## Cycle 1 Gaps — Current Status (verified 2026-04-18)

| # | Gap | Fix | Status |
|---|-----|-----|--------|
| G1 | `cli/one/` scaffold uses dead names (`connections`, `people`, `knowledge`) | Rename → `paths`, `actors`, `learning` | ✅ DONE (`ls cli/one/` shows 6 correct names) |
| G2 | `cli/package.json` `files` lists missing `TESTING-ONBOARDING.md` + `llms.txt` | Remove from array | ✅ DONE (clean array) |
| G3 | `@oneie/*` missing `prepublishOnly: "bun run build"` | Add to all 3 | ✅ DONE (all 3 have it) |
| G4 | `packages/templates/README.md` missing | Write it | ✅ DONE (file exists) |
| G5 | `cli/package.json` repo URL → `one-ie/one.git` (wrong) | Update to envelopes | ✅ DONE (`envelopes.git`, directory `cli`) |
| G6 | SDK is HTTP utils only — no substrate calls possible from code | Build `SubstrateClient` | 🔴 PENDING → Cycle 2 |

**Conclusion:** Cycle 1 is a verify-only cycle. All code changes G1-G5 already shipped.
One wave confirms the gaps stayed closed, then we move to Cycle 2.

---

## P0 features built in Cycle 2

| # | Feature | Why P0 |
|---|---------|--------|
| F1 | `SubstrateClient` in `@oneie/sdk` — 12 typed methods | Publishing SDK without this means no one can actually use it from code |
| F2 | Typed `Outcome` union (`result \| timeout \| dissolved \| failure`) | `ask()` is meaningless without typed outcomes |
| F3 | 14 new presets → 30 total (edu, edge, creative, support clusters) | Closes the gap between `agents/` folder and package exposure |
| F4 | `buildWorld(name, presets[])` + `buildTeam(role, size)` in templates | Teams are the real unit of deployment |
| F5 | **Telemetry emitter across all 4 packages** — every CLI verb, SDK method, MCP tool emits a typed signal to api.one.ie | Install base becomes a sensor network; big intelligence emerges from many small signals; substrate routes via its own usage |

---

## Telemetry as Big Intelligence

**Principle:** the toolkit is not a tool that calls the substrate — it is a sensor
that feeds the substrate. Every verb invocation, every method call, every install,
every error becomes a signal. The substrate already has L2 trail (strength accrual),
L3 fade (asymmetric decay), L6 know (highway → hypothesis promotion). Pointing
that machinery at our own tooling turns the install base into a distributed
learning signal.

**Receiver shape (locked):**

```
toolkit:<package>:<verb>                  scope=public   data={tags, weight=1, content}
  toolkit:cli:scaffold                    tags=[scaffold, preset-tutor, node-20]
  toolkit:cli:init                        tags=[init, macos, node-20]
  toolkit:sdk:ask                         tags=[sdk, method-ask, outcome-result]
  toolkit:sdk:signal                      tags=[sdk, method-signal, 200]
  toolkit:mcp:deploy_agent                tags=[mcp, tool-deploy_agent, ok]
  toolkit:install                         tags=[install, oneie, 3.7.0, darwin]
  toolkit:error                           tags=[error, cli, ENOENT]   weight=0 (warn)
```

**What each signal carries:**

| Field | Contents | NOT contains |
|---|---|---|
| `receiver` | `toolkit:<package>:<verb>` | — |
| `data.tags` | verb name, outcome, package version, os, node major version | cwd, folder names, file contents |
| `data.weight` | 1 for success, 0 for failure (→ warn) | — |
| `data.content.latencyMs` | duration of the call | — |
| `data.content.id` | hash(machineId + session) — stable per install, anonymous | userId, email, IP |
| `data.content.preset` | preset name only (already public) | user-chosen agent name |

**Privacy defaults:**
- ON by default (loud disclosure in README + MOTD on first run)
- Opt-out: `ONEIE_TELEMETRY_DISABLE=1` env var OR `~/.oneie/config.json` `{"telemetry":false}`
- Opt-out is loud too: `oneie --version` prints `telemetry: disabled` when off
- No PII ever. Hash any user-identifying value before emit.

**What emerges (the big intelligence):**

| Highway the substrate can form | Signal source |
|---|---|
| Which presets cluster in the same scaffold call | multiple `toolkit:cli:scaffold` tags within 1s from same id |
| Which SubstrateClient methods see most timeouts | `toolkit:sdk:*` warn()s concentrated on one receiver |
| Which CLI verb follows which | `select()` on paths between sequential `toolkit:cli:*` emits |
| Which package versions adopt fastest | path strength from `toolkit:install` over time |
| Which errors block new users | `toolkit:error` near-term after first `toolkit:install` |

No separate analytics stack. The substrate IS the analytics.
`persist().know()` promotes stable toolkit paths into hypotheses the same way
it promotes agent paths. The toolkit becomes part of the same flywheel it ships.

**Cost:** 1 POST per verb × ~10ms × negligible bandwidth. Per-install cap:
100 signals/hour (token bucket in the client). Emit is async + fire-and-forget;
never blocks the user-facing verb.

---

## Routing

```
    signal DOWN                           result UP
    ──────────                            ─────────
    /do TODO-publish-toolkit.md           mark(fit/form/truth/taste)
         │                                     │
         ▼                                     │
    ┌─ C1 BASELINE ─────────────────────┐      │ L1 signal
    │ verify G1-G5 stayed closed        │──────┤ L2 trail
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ C2 UPGRADE ──────────────────────┐      │ L3 fade
    │ SubstrateClient + 30 presets +    │──────┤ L4 economic
    │ buildWorld + typed Outcome        │      │
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ C3 DOGFOOD (local) ──────────────┐      │
    │ npm pack → install tarball in     │──────┤  (signal: toolkit-verified-local)
    │ /tmp → run smoke tests + real     │      │
    │ scaffolds + SubstrateClient calls │      │
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ C4 SHIP ─────────────────────────┐      │
    │ version bumps, npm publish in     │──────┤  (signal: agent-published)
    │ dep order, verify from registry   │      │
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ C5 CONSUME ──────────────────────┐      │
    │ npm i -g oneie → use it to        │──────┤  (signal: toolkit-consumed)
    │ generate `agents/published-demo/` │      │
    │ and commit as proof-of-ship       │      │
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ continuous: TELEMETRY FIREHOSE ──┐      │
    │ every toolkit verb emits          │──────┘  toolkit:cli:*, toolkit:sdk:*,
    │ → strength accrues on paths       │         toolkit:mcp:*, toolkit:install,
    │ → highways form across install    │         toolkit:error
    │   base → know() promotes to       │
    │   hypothesis → big intelligence   │
    └───────────────────────────────────┘
```

---

## Dimensional Mapping

| Artifact | Dimension | Where |
|---|---|---|
| `oneie`, `@oneie/sdk`, `@oneie/mcp`, `@oneie/templates` | Actor (kind=tool) | `cli/` + `packages/*/` |
| `SubstrateClient` | Thing (skill) | `packages/sdk/src/client.ts` |
| `buildWorld`, `buildTeam` | Thing (skill) | `packages/templates/src/world.ts` |
| `toolkit-verified-local` | Event (signal scope=public) | `src/pages/api/signal.ts` (end of C3) |
| `agent-published` | Event (signal scope=public) | `src/pages/api/signal.ts` (end of C4) |
| `toolkit-consumed` | Event (signal scope=public) | `src/pages/api/signal.ts` (end of C5) |
| `toolkit:cli:*` | Event (signal scope=public, continuous) | `cli/src/lib/telemetry.ts` → `/api/signal` |
| `toolkit:sdk:*` | Event (signal scope=public, continuous) | `packages/sdk/src/telemetry.ts` → `/api/signal` |
| `toolkit:mcp:*` | Event (signal scope=public, continuous) | `packages/mcp/src/telemetry.ts` → `/api/signal` |
| `toolkit:install` / `toolkit:error` | Event (signal scope=public, continuous) | Any package on startup/failure |

Three public events — one per gate. The substrate learns which cycles
consistently produce healthy published artifacts.

---

## Testing — The Deterministic Sandwich

```
PRE  (before each cycle)               POST (after each cycle)
─────────────────────                  ──────────────────────
bun run verify                         bun run verify
├── biome check .                      ├── biome check .
├── tsc --noEmit                       ├── tsc --noEmit
└── vitest run (737 baseline)          └── vitest run (≥ 737, no regressions)

                                       C1 adds:
                                       └── 6 existing smoke tests green

                                       C2 adds:
                                       ├── test-substrate-client.mjs (new)
                                       └── test-packages-boot.mjs updated
                                           (SubstrateClient + 30 presets)

                                       C3 adds:
                                       ├── npm pack: 0 warnings × 4 packages
                                       ├── tarball install in /tmp/dogfood
                                       ├── smoke tests run against TARBALL
                                       │   not source
                                       └── SubstrateClient.ask() hits localhost:4321

                                       C4 adds:
                                       └── npm show <pkg> version confirms publish

                                       C5 adds:
                                       ├── npm i -g oneie@3.7.0 clean install
                                       ├── oneie init agents/published-demo works
                                       └── generated files match dimension names
```

---

## Cycle 1: BASELINE — Verify G1-G5 stayed closed

**Scope:** One recon wave confirms all Cycle-1 gaps (G1-G5) are still closed.
No edits expected. If anything regressed, fix in-place. Then run the 6 existing
smoke tests to establish the green baseline before upgrading.

**Files touched (estimated):** 0 expected, up to 8 if regression.

### C1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | G1-G5 regression check | Confirm fixes stayed | 0.20/0.20/0.50/0.10 | All 5 gates PASS |
| 2 | All 6 smoke tests | Baseline confirmed before upgrading | 0.20/0.20/0.50/0.10 | All 6 exit 0 |
| 3 | `npm pack --dry-run` × 4 | Tarball manifests clean | 0.20/0.20/0.50/0.10 | 0 warnings |

### Wave 1 — Recon (Haiku × 1)

| Agent | Target | What to extract |
|---|---|---|
| R1 | `cli/one/`, `cli/package.json`, `packages/*/package.json`, `packages/templates/README.md` | State of all 5 gaps. If any regressed, report exact file + fix |

### Wave 2 — Decide (skipped)

Verify-only cycle. If R1 returns all green, skip W2 and go to W3 = just run tests.
If R1 reports regression, W2 lists exact fixes.

### Wave 3 — Edits (Sonnet × 1, conditional)

| Task id | File / artifact | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P1-01 | If regression found: fix in-place. Else: skip. | conditional | regression | T-P1-02 |
| T-P1-02 | Run all 6 smoke tests (`node scripts/smoke-tests/<file>.mjs`), confirm exit 0 | verify | smoke, test | T-P2-01 |

### Wave 4 — Verify (Sonnet × 1)

| Shard | Owns |
|---|---|
| V1 | All 6 smoke tests exit 0; `npm pack --dry-run` clean across all 4 packages; `grep -r "connections\|people\|knowledge" cli/one/` returns 0 hits |

### C1 Gate

```bash
bun run verify
ls cli/one/                                           # actors/ events/ groups/ learning/ paths/ things/
grep -r "connections\|people\|knowledge" cli/one/     # 0 hits
npm pack --dry-run --workspace cli                    # 0 warnings
npm pack --dry-run --workspace packages/sdk           # 0 warnings
npm pack --dry-run --workspace packages/mcp           # 0 warnings
npm pack --dry-run --workspace packages/templates     # 0 warnings
node scripts/smoke-tests/test-packages-boot.mjs       # ✓
node scripts/smoke-tests/test-no-mint-code.mjs        # ✓
node scripts/smoke-tests/test-launch-handoff.mjs      # ✓
node scripts/smoke-tests/test-mcp-verbs.mjs           # ✓
node scripts/smoke-tests/test-sdk-ask-roundtrip.mjs   # ✓
node scripts/smoke-tests/test-auth-hardening.mjs      # ✓
```

```
[ ] cli/one/ shows: actors/ events/ groups/ learning/ paths/ things/
[ ] No dead names in cli/one/ or packages/
[ ] All 3 @oneie/* have prepublishOnly
[ ] packages/templates/README.md exists, ≥ 100 words
[ ] All 6 smoke tests exit 0
[ ] npm pack --dry-run: 0 warnings × 4 packages
[ ] 737+ tests pass
```

---

## Cycle 2: UPGRADE — P0 features (SubstrateClient + presets)

**Scope:** Build `SubstrateClient` in `@oneie/sdk` (12 typed methods, typed
`Outcome` union). Expand templates to 30 presets (+14 new). Add `buildWorld()`
+ `buildTeam()`. Update smoke tests and docs to match.

**Depends on:** C1 gate green.

**Why before dogfood + publish:** shipping `@oneie/sdk` without a substrate API
client means external developers can't actually call `signal`, `ask`, or any
substrate verb from code. The SDK would be utils + launch only. That's not an SDK.

### C2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `SubstrateClient` class | Programmatic substrate calls from code | 0.40/0.20/0.30/0.10 | `new SubstrateClient().ask(...)` returns typed Outcome |
| 2 | Typed `Outcome` union | `ask()` result is typed, not `any` | 0.30/0.20/0.40/0.10 | tsc resolves `outcome.result \| outcome.timeout \| ...` |
| 3 | 30 presets (was 16) | Templates library covers real use cases | 0.35/0.20/0.35/0.10 | `listPresets().length === 30` |
| 4 | `buildWorld()` + `buildTeam()` | Teams are the unit of deployment | 0.40/0.20/0.30/0.10 | `buildTeam('marketing', 5)` returns 5 agent markdowns |
| 5 | `test-substrate-client.mjs` | Smoke test the new surface | 0.20/0.20/0.50/0.10 | exits 0 |
| 6 | **Telemetry module in all 4 packages** | Every verb emits a signal to api.one.ie | 0.40/0.20/0.30/0.10 | `curl /api/events?receiver=toolkit:*&since=1m` returns emits from test run |
| 7 | **Opt-out UX** | Loud disclosure + env var toggle | 0.30/0.30/0.25/0.15 | `ONEIE_TELEMETRY_DISABLE=1 oneie --version` prints `telemetry: disabled`, no emits observed |

---

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `src/pages/api/` — signal.ts, ask.ts, loop/mark-dims.ts, decay-cycle.ts, memory/reveal.ts, hypotheses.ts, loop/highways.ts, loop/stage.ts | Exact request/response shape for each of the 12 substrate endpoints |
| R2 | `packages/sdk/src/{types,urls,storage,launch}.ts` | Where to extend: which file holds types, how auth is passed, error handling |
| R3 | `agents/**/*.md` + `packages/templates/src/presets.ts` | Which agents in the repo don't have a preset yet — gap list for the +14 |
| R4 | `packages/templates/src/{generator,registry,people}.ts` | Existing builder surface — where to add `buildWorld` + `buildTeam` without breaking exports |

### Wave 2 — Decide (Opus × 1)

Key decisions:
1. **SubstrateClient shape:** class with constructor `({ apiKey?, baseUrl? })`. Methods match verb names exactly: `signal`, `ask`, `mark`, `warn`, `fade`, `select`, `recall`, `reveal`, `forget`, `frontier`, `know`, `highways`.
2. **Outcome typing:** discriminated union — `{ result: unknown; latency: number } | { timeout: true; latency: number } | { dissolved: true; latency: number } | { failure: true; latency: number }`. Lives in `types.ts`.
3. **Preset selection (+14):** `tutor`, `researcher`, `coach` (edu); `telegram-bot`, `discord-bot`, `notifier` (edge); `creative-director`, `copywriter` (creative); `concierge`, `classifier`, `triage`, `escalation` (support); `data-analyst`, `qa-engineer` (tech). Total 30.
4. **`buildWorld` signature:** `buildWorld(name: string, presets: Array<Preset | {preset: string, name?: string, group?: string}>)` → `{ worldName, agents: GenerateResult[], deployInstructions: string }`.
5. **`buildTeam` signature:** `buildTeam(cluster: 'csuite' | 'marketing' | 'support' | 'edu' | 'creative' | 'edge', size?: number)` → `GenerateResult[]`.
6. **File layout:** `client.ts` in sdk, `world.ts` in templates. Both exported from package `index.ts`.

### Wave 3 — Edits (Sonnet × 10, parallel)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P2-01 | `packages/sdk/src/types.ts` — add `Outcome` discriminated union + response types | new | sdk, types | T-P2-02 |
| T-P2-02 | `packages/sdk/src/client.ts` — `SubstrateClient` class: 12 methods, typed return per method | new | sdk, client | T-P2-03 |
| T-P2-03 | `packages/sdk/src/index.ts` — export `SubstrateClient`, `Outcome`, new response types | edit | sdk | T-P2-08 |
| T-P2-04 | `packages/sdk/package.json` — bump `0.1.0` → `0.2.0`; add `"./client"` to exports map | edit | sdk, version | T-P3-* |
| T-P2-05 | `packages/templates/src/presets.ts` — add 14 new presets across edu/edge/creative/support/tech | edit | templates, presets | T-P2-07 |
| T-P2-06 | `packages/templates/src/world.ts` — `buildWorld` + `buildTeam` + cluster definitions | new | templates, world | T-P2-07 |
| T-P2-07 | `packages/templates/src/index.ts` — export `buildWorld`, `buildTeam`, cluster types | edit | templates | T-P2-08 |
| T-P2-08 | `packages/templates/package.json` — bump `0.1.0` → `0.2.0`; add `"./world"` to exports map | edit | templates, version | T-P3-* |
| T-P2-09 | `scripts/smoke-tests/test-substrate-client.mjs` — instantiate, call 12 methods, assert Outcome discriminates | new | test, smoke, sdk | — |
| T-P2-10 | `scripts/smoke-tests/test-packages-boot.mjs` — add SubstrateClient assertion; preset count 16 → 30; add buildWorld/buildTeam | edit | test, smoke | — |
| T-P2-11 | `packages/sdk/src/telemetry.ts` — new: `emit(receiver, tags, content?)` — anonymous id (hash of machineId+session), token-bucket rate limit (100/hr), async fetch, swallows network errors, honors `ONEIE_TELEMETRY_DISABLE`. Export from `index.ts`. | new | telemetry, sdk | T-P2-12, T-P2-13, T-P2-14 |
| T-P2-12 | `packages/sdk/src/client.ts` — wire telemetry into every `SubstrateClient` method: entry emits `toolkit:sdk:<method>` with latency + outcome tag on completion | edit | telemetry, sdk | — |
| T-P2-13 | `cli/src/lib/telemetry.ts` + `cli/src/index.ts` — wrap every CLI verb with `emit('toolkit:cli:<verb>', tags)` at entry and exit; include tags for preset names (when present), OS, node major, exit code | new+edit | telemetry, cli | — |
| T-P2-14 | `packages/mcp/src/telemetry.ts` — MCP server wraps every tool call with `emit('toolkit:mcp:<tool>', tags)`; include outcome + latency | new | telemetry, mcp | — |
| T-P2-15 | `cli/README.md` + `packages/sdk/README.md` + `packages/mcp/README.md` + `packages/templates/README.md` — add "Telemetry" section: what we send, what we don't, how to disable. Loud.  | edit | telemetry, docs | — |
| T-P2-16 | `packages/sdk/src/telemetry.test.ts` — unit test: opt-out disables emit; rate limit caps at 100/hr; anonymous id is stable per process; no PII in serialized payload | new | telemetry, test | — |

### Wave 4 — Verify (Sonnet × 3, parallel)

| Shard | Owns |
|---|---|
| V1 | TypeScript: `tsc --noEmit` clean in `packages/sdk/` + `packages/templates/`; no `any` returns; `Outcome` union exhaustively handled |
| V2 | Smoke tests: both new/updated `.mjs` exit 0; `listPresets().length === 30`; `buildTeam('marketing', 5)` returns 5 |
| V3 | Docs: `docs/sdk-reference.md` shows SubstrateClient usage; `docs/one-toolkit-features.md` surface map reflects 0.2.0; telemetry section present in all 4 package READMEs |
| V4 | Telemetry: run each package's main verb with dev server; confirm signals visible at `/api/events?receiver=toolkit:*&since=1m`; confirm opt-out silences emits; confirm no PII in any payload |

### C2 Gate

```bash
bun run verify
bun run build --workspace packages/sdk
bun run build --workspace packages/templates
node -e "import('@oneie/sdk').then(m => console.log(typeof m.SubstrateClient))"   # 'function'
node -e "import('@oneie/templates').then(m => console.log(m.listPresets().length, typeof m.buildTeam))"  # 30 'function'
node scripts/smoke-tests/test-substrate-client.mjs        # ✓
node scripts/smoke-tests/test-packages-boot.mjs           # ✓
```

```
[ ] SubstrateClient class: 12 methods, all typed, no `any` returns
[ ] Outcome discriminated union: result | timeout | dissolved | failure
[ ] 30 presets total
[ ] buildWorld + buildTeam exported
[ ] @oneie/sdk version bumped to 0.2.0
[ ] @oneie/templates version bumped to 0.2.0
[ ] Telemetry module in all 4 packages, emits to api.one.ie
[ ] toolkit:cli:*, toolkit:sdk:*, toolkit:mcp:* visible at /api/events during test run
[ ] ONEIE_TELEMETRY_DISABLE=1 silences all emits (verified by grep on events after run)
[ ] Telemetry section in all 4 package READMEs
[ ] No PII in any telemetry payload (unit test proves)
[ ] 737+ tests pass, 0 new failures
```

---

## Cycle 3: DOGFOOD (LOCAL) — Install tarballs, prove they work

**Scope:** Run `npm pack` on all 4 packages. Install the resulting tarballs
into a throwaway directory `/tmp/dogfood-toolkit/`. Run every smoke test
against the **packed artifacts** (not the source tree). Instantiate
`SubstrateClient` from the installed package and call the local dev server
at `localhost:4321`. Generate a world with `buildWorld()` from the installed
templates. If any of this fails, the published version will fail too.

**Depends on:** C2 gate green — SubstrateClient typed, 30 presets, smoke tests pass.

**Why before ship:** the source tree resolves imports differently than the
published tarball. `dist/` paths, `files[]` arrays, `exports` maps, and
binary shebangs only matter once the package is installed. Publishing an
untested tarball is publishing blind.

### C3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `scripts/dogfood-local.sh` | One-shot local install + test | 0.40/0.20/0.30/0.10 | script exits 0, logs written |
| 2 | Tarballs installed in `/tmp/dogfood-toolkit/` | Clean-room install works | 0.35/0.20/0.35/0.10 | `node_modules/` has all 4, no peer errors |
| 3 | `oneie` bin works from tarball | CLI surface intact | 0.40/0.20/0.30/0.10 | `oneie --version` = 3.7.0 (unreleased), `oneie --help` lists ≥ 17 verbs |
| 4 | `SubstrateClient` hits live dev server | End-to-end substrate call proven | 0.40/0.20/0.30/0.10 | `client.ask(...)` returns typed Outcome against `localhost:4321` |
| 5 | `buildWorld()` generates output | Templates work post-pack | 0.35/0.20/0.35/0.10 | `agents/` markdown written to tmp |
| 6 | `toolkit-verified-local` signal emitted | Substrate learns which packs passed | 0.30/0.20/0.30/0.20 | event visible in `/see events --since 1h` |
| 7 | Telemetry firehose proven from tarball install | Telemetry module survives pack+install | 0.40/0.20/0.30/0.10 | running verbs from `/tmp/dogfood-toolkit/` emits `toolkit:*` signals visible in substrate |

---

### Wave 1 — Recon (Haiku × 3, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | Output of `npm pack --workspace cli --dry-run` | Exact tarball filename, size, list of files — compare against `files[]` array |
| R2 | Output of `npm pack --dry-run` for all 3 `@oneie/*` | Same for each — dist/, README, LICENSE, no source files, no .git, no test files |
| R3 | Local dev server state | Is `bun run dev` running? Port 4321 reachable? Any auth required for `/api/ask`? |

### Wave 2 — Decide (Opus × 1)

Key decisions:
1. **Install mechanism:** prefer `npm pack` + `npm install <tarball>` over `npm link`. Reason: link uses symlinks and ignores `files[]` — pack is closer to what npm publishes.
2. **Test harness location:** `scripts/dogfood-local.sh` — shell script so it can `cd /tmp`, `mkdir`, `npm install`, run assertions, cleanup. Reports per-step timing.
3. **Dev server dependency:** C3 assumes `bun run dev` is running. Script checks `curl -fsS localhost:4321/api/health` first; if down, starts one in background for the test window, kills after.
4. **Cleanup policy:** keep `/tmp/dogfood-toolkit/` on success (for inspection), delete on clean re-run.
5. **Assertions per tarball:**
   - `oneie`: `--version`, `--help`, `init --dry-run` scaffold matches dimension names
   - `@oneie/sdk`: import `SubstrateClient`, construct, call `.health()` or `.ask()` against localhost
   - `@oneie/mcp`: import, list tools (expect 15)
   - `@oneie/templates`: import, `listPresets().length === 30`, `buildTeam('edu', 3).length === 3`
6. **Signal emission:** at end of script, POST `toolkit-verified-local` to `/api/signal` with timings + pass/fail per assertion.

### Wave 3 — Edits (Sonnet × 4, parallel)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P3-01 | `scripts/dogfood-local.sh` — new, executable, `set -euo pipefail`, traps cleanup on exit | new | dogfood, script | T-P3-04 |
| T-P3-02 | `scripts/smoke-tests/test-substrate-client-live.mjs` — new: like `test-substrate-client.mjs` but runs against resolved `@oneie/sdk` from node_modules (not source) and hits `localhost:4321` | new | test, smoke, e2e | T-P3-04 |
| T-P3-03 | `scripts/smoke-tests/test-templates-live.mjs` — new: resolves `@oneie/templates` from node_modules, asserts 30 presets + `buildTeam('marketing', 5)` writes 5 files to `/tmp/dogfood-toolkit/generated-world/` | new | test, smoke, e2e | T-P3-04 |
| T-P3-04 | `docs/one-toolkit-features.md` — new "Local dogfood" section linking `scripts/dogfood-local.sh` and the 6 C3 assertions | edit | docs, dogfood | — |

### Wave 4 — Verify (Sonnet × 2, parallel)

| Shard | Owns |
|---|---|
| V1 | Run `bash scripts/dogfood-local.sh` end-to-end; all 6 assertions pass; script exits 0; logs written to `/tmp/dogfood-toolkit/dogfood.log` |
| V2 | `toolkit-verified-local` signal visible at `/api/events?type=toolkit-verified-local&since=1h`; payload includes per-package pass/fail + timings |

### C3 Gate

```bash
bash scripts/dogfood-local.sh             # exits 0
ls /tmp/dogfood-toolkit/node_modules/     # oneie/ @oneie/sdk/ @oneie/mcp/ @oneie/templates/
/tmp/dogfood-toolkit/node_modules/.bin/oneie --version   # 3.7.0
node -e "
  process.chdir('/tmp/dogfood-toolkit');
  const m = await import('@oneie/sdk');
  const c = new m.SubstrateClient({ baseUrl: 'http://localhost:4321' });
  console.log(await c.ask({ receiver: 'ping' }));
"
# → { result: ... } | { timeout: true } | { dissolved: true }

curl -s 'http://localhost:4321/api/events?type=toolkit-verified-local&since=1h' | jq '.count'
# → ≥ 1
```

```
[ ] scripts/dogfood-local.sh exists + exits 0
[ ] /tmp/dogfood-toolkit/ has all 4 packages from tarball
[ ] oneie --version returns 3.7.0 from packed artifact
[ ] oneie --help enumerates ≥ 17 verbs from packed artifact
[ ] oneie init --dry-run shows actors/ paths/ learning/
[ ] SubstrateClient.ask() from /tmp round-trips to localhost:4321
[ ] listPresets().length === 30 from /tmp
[ ] buildTeam('marketing', 5) writes 5 files from /tmp
[ ] toolkit-verified-local signal emitted
[ ] toolkit:cli:*, toolkit:sdk:*, toolkit:templates:* signals visible during dogfood run
[ ] ONEIE_TELEMETRY_DISABLE=1 run produces zero toolkit:* signals (control)
[ ] 737+ tests still pass
```

---

## Cycle 4: SHIP — Version bump + npm publish

**Scope:** Bump `oneie` to 3.7.0. `@oneie/mcp` stays at 0.1.0 (no MCP changes
this round). `@oneie/sdk` and `@oneie/templates` already bumped in C2. Publish
in dep order. Verify from registry. Emit `agent-published` event.

**Depends on:** C3 gate green — local dogfood proved the tarballs work end-to-end.

### C4 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `oneie@3.7.0` on npm | 12 new substrate verbs + fixed scaffold | 0.40/0.15/0.35/0.10 | `npm show oneie version` = 3.7.0 |
| 2 | `@oneie/sdk@0.2.0` on npm | SubstrateClient available | 0.35/0.15/0.40/0.10 | `npm show @oneie/sdk version` = 0.2.0 |
| 3 | `@oneie/mcp@0.1.0` on npm | 15 substrate tools via MCP | 0.35/0.15/0.40/0.10 | `npm show @oneie/mcp version` = 0.1.0 |
| 4 | `@oneie/templates@0.2.0` on npm | 30 presets + buildWorld | 0.35/0.15/0.40/0.10 | `npm show @oneie/templates version` = 0.2.0 |
| 5 | `agent-published` event to substrate | Pheromone records ship success | 0.30/0.20/0.30/0.20 | event visible at `/see events` |

---

### Wave 1 — Recon (Haiku × 2, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `npm show oneie` + `npm show @oneie/sdk` + `@oneie/templates` + `@oneie/mcp` | Current published versions, org access verified |
| R2 | `.npmrc` + `npm whoami` + `npm org ls @oneie` | Auth + org membership confirmed |

### Wave 2 — Decide (Opus × 1)

Lock: publish order, `--access public` on first publish for scoped packages,
changelog entries, org verification.

Key decisions:
1. **Publish order:** `@oneie/templates` → `@oneie/sdk` → `@oneie/mcp` → `oneie` (by dep graph)
2. **Scoped access:** `--access public` on first scoped publish
3. **oneie version:** 3.6.40 → 3.7.0 (minor: 12 new substrate verbs, scaffold dimension names fixed)
4. **Changelog:** one line per major change in each package's `CHANGELOG.md`
5. **Rollback:** if step N fails, do NOT retry — `npm deprecate <pkg>@<ver>` the partial publish and restart after fix

### Wave 3 — Edits (Sonnet × 2, parallel)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P4-01 | `cli/package.json` — bump `version` → `3.7.0` | fix | version, publish | T-P4-03 |
| T-P4-02 | `cli/CHANGELOG.md` — add `## 3.7.0`; `packages/sdk/CHANGELOG.md` — `## 0.2.0`; `packages/templates/CHANGELOG.md` — `## 0.2.0` | new | docs, changelog | T-P4-03 |

### Wave 4 — Verify + Ship (Sonnet × 2, then publish sequence)

**Pre-publish verification (parallel):**

| Shard | Owns |
|---|---|
| V1 | `npm pack` tarball review for cli: 17 commands in dist/commands/, scaffold shows actors/paths/learning, no .ts source |
| V2 | `npm pack` for @oneie/*: dist/ present, READMEs included, SubstrateClient in sdk dist, 30 presets in templates dist, no symlinks |

**Publish sequence:**

```bash
# Step 1 — templates (no @oneie/* deps)
npm publish --workspace packages/templates --access public

# Step 2 — sdk (no @oneie/* deps)
npm publish --workspace packages/sdk --access public

# Step 3 — mcp (depends on @oneie/sdk)
npm publish --workspace packages/mcp --access public

# Step 4 — cli (oneie, no @oneie/* runtime deps)
npm publish --workspace cli

# Step 5 — emit agent-published signal
curl -X POST https://api.one.ie/api/signal \
  -H "Content-Type: application/json" \
  -d '{"receiver":"substrate:agent-published","data":{"tags":["publish","npm","oneie"],"content":{"packages":["oneie@3.7.0","@oneie/sdk@0.2.0","@oneie/mcp@0.1.0","@oneie/templates@0.2.0"]}}}'
```

### C4 Gate

```bash
npm show oneie version              # 3.7.0
npm show @oneie/sdk version         # 0.2.0
npm show @oneie/mcp version         # 0.1.0
npm show @oneie/templates version   # 0.2.0
curl -s 'https://api.one.ie/api/events?type=agent-published&since=1h' | jq '.count'
# → ≥ 1
```

```
[ ] oneie@3.7.0 published
[ ] @oneie/sdk@0.2.0 published
[ ] @oneie/mcp@0.1.0 published
[ ] @oneie/templates@0.2.0 published
[ ] agent-published event emitted
[ ] 737+ tests still pass
```

---

## Cycle 5: CONSUME — Install from npm, scaffold content into this repo

**Scope:** With all 4 packages live on the npm registry, install `oneie@3.7.0`
globally from npm (not from tarball, not from source). Use it to scaffold
a fresh demo world at `agents/published-demo/`. Instantiate `SubstrateClient`
in a small Node script at `scripts/consume-published.mjs` that imports from
`@oneie/sdk@0.2.0` and makes real substrate calls. Commit the generated
artifacts to the repo as proof the published toolkit works against its own
source-of-truth.

**Depends on:** C4 gate green — all 4 packages visible via `npm show`.

**Why this cycle:** publishing is not proof of utility. The only proof is
that the shipped artifact produces working output when someone who has
never touched the source tree installs it. This cycle plays the role of
that fresh user — but uses the envelopes repo as the playground so the
proof-of-ship artifact lives in git history.

### C5 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `oneie@3.7.0` installed globally from npm | Registry round-trip works | 0.40/0.15/0.35/0.10 | `which oneie` + `oneie --version` = 3.7.0 |
| 2 | `agents/published-demo/` scaffold | Proof CLI generates correct structure | 0.40/0.20/0.30/0.10 | folder exists, contains at least 3 markdown agents with correct frontmatter |
| 3 | `scripts/consume-published.mjs` | Proof SDK works against npm install | 0.40/0.20/0.30/0.10 | script exits 0, calls `.signal()`, `.ask()`, `.recall()` against api.one.ie |
| 4 | `docs/one-toolkit-features.md` — Consumer story section | Close the loop — features doc shows what a new user experiences | 0.30/0.30/0.25/0.15 | section exists with command transcript |
| 5 | `toolkit-consumed` event | Substrate learns the full round-trip | 0.30/0.20/0.30/0.20 | event visible at `/see events` |
| 6 | git commit: `chore(toolkit): proof-of-ship — oneie@3.7.0 consumed` | Audit trail of what the shipped toolkit produced | 0.30/0.20/0.30/0.20 | commit on `main` with the generated folder |
| 7 | **Live firehose watch during consume** | Prove telemetry flows from published npm install back to substrate | 0.40/0.20/0.30/0.10 | `/see events --receiver toolkit:*` during consume shows ≥ N signals with version=3.7.0 tag |
| 8 | **First highway formed on toolkit paths** | L2 trail compounds across the consume run | 0.30/0.20/0.30/0.20 | `/see highways --tag toolkit` shows at least one path (e.g. `toolkit:cli:init → toolkit:cli:scaffold`) |

---

### Wave 1 — Recon (Haiku × 3, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `npm view oneie@3.7.0 files` + tarball contents from registry (not local) | What's actually shipped — compare to local expectations |
| R2 | `agents/` folder current state | What demo agents already live here; pick a name for `published-demo/` that doesn't collide |
| R3 | `src/pages/api/signal.ts` + existing event types | Confirm `toolkit-consumed` is a valid event shape; add ADL entry if needed |

### Wave 2 — Decide (Opus × 1)

Key decisions:
1. **Install target:** `npm install -g oneie@3.7.0` (exact version pin, not `latest`, to make the cycle reproducible).
2. **Scaffold target:** `agents/published-demo/` — fresh folder under `agents/`, 3 markdown agents: `concierge.md`, `tutor.md`, `researcher.md` (from the 30-preset library). One `world.md` describing the group.
3. **Consumer script location:** `scripts/consume-published.mjs` — imports `@oneie/sdk` from node_modules (resolved to the npm-installed version), makes 3 real calls against `api.one.ie`.
4. **Network target:** production api.one.ie (not localhost). Reason: the consumer story is a new developer installing from npm and hitting the live API. Dogfood used localhost; consume uses prod.
5. **Commit policy:** commit `agents/published-demo/` + `scripts/consume-published.mjs` + docs update on `main` after all assertions pass. Commit message `chore(toolkit): proof-of-ship — oneie@3.7.0 consumed`. DO NOT force-push; create normal commit.
6. **Rollback:** if any assertion fails, do NOT commit. Instead update C4 with findings and reopen.

### Wave 3 — Edits (Sonnet × 5, parallel)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P5-01 | `scripts/consume-published.mjs` — new: install oneie@3.7.0 globally (idempotent check first), run `oneie scaffold agents/published-demo --preset concierge --preset tutor --preset researcher`, then use `@oneie/sdk` to `.signal()`, `.ask()`, `.recall()` against `api.one.ie`, log timings | new | consume, script | T-P5-03 |
| T-P5-02 | `scripts/consume-published.sh` — thin shell wrapper: checks `oneie --version` equals `3.7.0`, runs the `.mjs`, emits `toolkit-consumed` signal with pass/fail per step | new | consume, script | T-P5-03 |
| T-P5-03 | `agents/published-demo/` — generated by running `scripts/consume-published.sh` once manually; commit the resulting folder as-is | new | consume, scaffold | T-P5-05 |
| T-P5-04 | `docs/one-toolkit-features.md` — add "Consumer story" section with command transcript: install → scaffold → call SDK → event emitted | edit | docs, consume | — |
| T-P5-05 | Git commit: stage `scripts/consume-published.mjs`, `scripts/consume-published.sh`, `agents/published-demo/`, `docs/one-toolkit-features.md`. Commit with message `chore(toolkit): proof-of-ship — oneie@3.7.0 consumed` | commit | consume, ship | — |

### Wave 4 — Verify (Sonnet × 2, parallel)

| Shard | Owns |
|---|---|
| V1 | `bash scripts/consume-published.sh` exits 0 from a clean checkout (no oneie globally installed first); `agents/published-demo/` exists with ≥ 3 markdown agents; each has valid frontmatter (`name`, `model`, `skills[]`) |
| V2 | `toolkit-consumed` signal visible at `https://api.one.ie/api/events?type=toolkit-consumed&since=1h`; payload includes scaffolded agent count + SDK call latencies |

### C5 Gate

```bash
which oneie                            # /usr/local/bin/oneie (or similar)
oneie --version                        # 3.7.0 (from npm)
bash scripts/consume-published.sh      # exits 0
ls agents/published-demo/              # concierge.md tutor.md researcher.md world.md
git log -1 --oneline                   # chore(toolkit): proof-of-ship — oneie@3.7.0 consumed
curl -s 'https://api.one.ie/api/events?type=toolkit-consumed&since=1h' | jq '.count'
# → ≥ 1
```

```
[ ] oneie@3.7.0 installed globally from npm (not tarball, not source)
[ ] agents/published-demo/ contains ≥ 3 markdown agents + world.md
[ ] Each agent has valid frontmatter (name, model, skills[])
[ ] scripts/consume-published.sh exits 0 from clean environment
[ ] SubstrateClient makes real calls to api.one.ie, returns typed Outcome
[ ] toolkit-consumed event visible in substrate
[ ] Live firehose during consume shows ≥ 10 toolkit:* signals tagged version=3.7.0
[ ] `/see highways --tag toolkit` shows ≥ 1 highway formed from consume run
[ ] docs/one-toolkit-features.md has Consumer story section
[ ] git commit landed on main with generated artifacts
[ ] 737+ tests still pass
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Rough share |
|---|---|---|---|---|
| 1 | W1 | 1 | Haiku | 1% |
| 1 | W3 | 1 | Sonnet | 2% (conditional) |
| 1 | W4 | 1 | Sonnet | 2% |
| 2 | W1 | 4 | Haiku | 3% |
| 2 | W2 | 1 | Opus | 10% |
| 2 | W3 | 10 | Sonnet | 20% |
| 2 | W4 | 3 | Sonnet | 8% |
| 3 | W1 | 3 | Haiku | 2% |
| 3 | W2 | 1 | Opus | 6% |
| 3 | W3 | 4 | Sonnet | 10% |
| 3 | W4 | 2 | Sonnet | 5% |
| 4 | W1 | 2 | Haiku | 2% |
| 4 | W2 | 1 | Opus | 4% |
| 4 | W3 | 2 | Sonnet | 3% |
| 4 | W4 | 2 | Sonnet | 3% |
| Publish | — | — | — | 5% (manual publish steps) |
| 5 | W1 | 3 | Haiku | 2% |
| 5 | W2 | 1 | Opus | 5% |
| 5 | W3 | 5 | Sonnet | 7% |
| 5 | W4 | 2 | Sonnet | 3% |

**Hard stop:** any W4 that loops > 3 times → halt, escalate.

---

## Status

- [x] **C1 BASELINE** — verify gaps stayed closed, smoke tests green
  - [x] W1 — Recon (Haiku × 1) — G1-G5 all green at architectural level; folder dimensions correct
  - [x] W3 — Edits (skipped per TODO rule — no regression); 6 smoke tests exit 0 (T-P1-02); npm pack --dry-run × 4 packages: 0 warnings
  - [x] W4 — Verify (Sonnet × 1) — PASS with finding: 9 scaffold MDs under cli/one/{learning,paths,actors,things}/ still have dead-name frontmatter (`dimension: knowledge`, `related_dimensions: connections, events, people`). Doc drift only — 0 source imports from these files (verified via grep). Filed for TODO-rename (already active). Does not block C1→C2.
- [x] **C2 UPGRADE** — SubstrateClient + 30 presets + buildWorld
  - [x] W1 — Recon (Haiku × 4, parallel) — API shapes, SDK internals, preset gap (16→30), builder surface
  - [x] W2 — Decide (Sonnet × 1) — 13 edit specs: types.ts 4-branch Outcome, client.ts SubstrateClient, telemetry.ts, world.ts buildWorld/buildTeam, 14 new presets, version bumps
  - [x] W3 — Edits (Sonnet × 13, parallel) — SubstrateClient 12 methods, 30 presets, buildWorld/buildTeam, telemetry across 4 packages, 4 READMEs, 2 smoke tests
  - [x] W4 — Verify (Sonnet × 3, parallel by shard) — 1539/1539 pass, token baseline 546/546, both smoke tests exit 0
- [x] **C3 DOGFOOD (LOCAL)** — pack, install in /tmp, run against dev server
  - [x] W1 — Recon (Haiku × 3, parallel) — CLI 1200 files, SDK test artifact found, dev server up (dissolved in 293ms)
  - [x] W2 — Decide — fix .npmignore for SDK test artifacts, install from tarballs, dogfood-local.sh structure
  - [x] W3 — Edits (Sonnet × 4, parallel) — dogfood-local.sh, test-substrate-client-live.mjs, test-templates-live.mjs, .npmignore, docs section
  - [x] W4 — Verify — dogfood-local.sh exits 0, PASS=10 FAIL=0; SubstrateClient 12 methods from tarball; 30 presets from tarball; buildTeam 5 agents; 1539/1539 tests
- [x] **C4 SHIP** — version bumps, publish, verify from registry
  - [x] W1 — Recon (Haiku × 2) — oneie@3.6.40 live; @oneie/* first publish; npm whoami=oneie ✓
  - [x] W2 — Decide — publish order: templates→sdk→mcp→cli; --access public for scoped; create CHANGELOGs
  - [x] W3 — Edits (Sonnet × 2) — cli bump 3.6.40→3.7.0; CHANGELOG.md × 3 created
  - [x] W4 — Verify+Ship — all 4 published and confirmed: oneie@3.7.0 · @oneie/sdk@0.2.0 · @oneie/mcp@0.1.0 · @oneie/templates@0.2.0
- [x] **C5 CONSUME** — install from npm, scaffold into envelopes/
  - [x] W1 — Recon (Haiku × 3) — agents/ has no collision; signal needs sender+receiver; oneie globally installed
  - [x] W2 — Decide — npm install -g 3.7.0; generate via templates (no scaffold cmd); localhost:4321 for API calls
  - [x] W3 — Edits (Sonnet × 4) — consume-published.mjs + .sh; Consumer Story docs; agents/published-demo/
  - [x] W4 — Verify — SUCCESS: 4 agents generated from npm install; ask()→dissolved; recall()→0; commit 29f03c6 on main; 1539/1539 tests

---

## Execution

```bash
/do TODO-publish-toolkit.md          # advance current wave
/do TODO-publish-toolkit.md --auto   # run W1→W4 continuously until gate
/see tasks --tag publish             # open publish tasks
/see tasks --tag dogfood             # C3 tasks
/see tasks --tag consume             # C5 tasks
/see highways                        # proven paths
/close T-P3-01                       # mark task done
```

---

## See Also

- [TODO-platform-baas.md](TODO-platform-baas.md) — BaaS platform infrastructure (depends on this TODO)
- [one-toolkit-features.md](one-toolkit-features.md) — feature inventory + Consumer story (new, C5)
- [TODO-copy-toolkit.md](TODO-copy-toolkit.md) — what was built (3 cycles, done)
- [pricing.md](pricing.md) — 5 tiers, 3 deploy options
- [infra-models.md](infra-models.md) — BaaS / CF Pages / Managed / Detached
- [cli-reference.md](cli-reference.md) — 17 verbs
- [sdk-reference.md](sdk-reference.md) — SDK surface + SubstrateClient
- [mcp-tools.md](mcp-tools.md) — 15 MCP tools
- [launch-handoff.md](launch-handoff.md) — agent-launch contract
- [dictionary.md](dictionary.md) — locked dimension names
- [rubrics.md](rubrics.md) — fit/form/truth/taste
- [TODO-template.md](one/TODO-template.md) — wave pattern

---

*5 cycles + continuous. 18 waves. 46 tasks. Verify → upgrade → dogfood → ship → consume → sense.*
*`oneie@3.7.0` · `@oneie/sdk@0.2.0` · `@oneie/mcp@0.1.0` · `@oneie/templates@0.2.0`.*
*Two install gates (local tarball before publish, npm registry after publish) + continuous telemetry firehose (every toolkit verb → signal → substrate → highway → hypothesis).*
*The install base is the sensor network. Big intelligence is just many small signals kept long enough to form highways.*
