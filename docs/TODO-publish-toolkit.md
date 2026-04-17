---
title: TODO — Pre-publish audit + feature upgrade + npm release
type: roadmap
version: 2.0.0
priority: Wire → Prove → Grow
total_tasks: 28
completed: 0
status: READY
---

# TODO: Publish oneie + @oneie/* to npm

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Goal:** Ship `oneie@3.7.0`, `@oneie/sdk@0.2.0`, `@oneie/mcp@0.1.0`,
> `@oneie/templates@0.2.0` to npm — gaps fixed, P0 features built, all
> smoke tests green, published in dep order.
>
> **Source of truth:**
> - [one-toolkit-features.md](one-toolkit-features.md) — full feature inventory + gap analysis (P0/P1/P2/P3)
> - [TODO-copy-toolkit.md](TODO-copy-toolkit.md) — what was built (3 cycles, done)
> - [pricing.md](pricing.md) — 5 tiers (Free/Builder/Scale/World/Enterprise), 3 deploy options
> - [infra-models.md](infra-models.md) — BaaS / CF Pages / Managed / Detached
> - [DSL.md](DSL.md) — signal language, `{ receiver, data }`, mark/warn/fade
> - [dictionary.md](dictionary.md) — canonical names (locked dimension names)
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark
>
> **Shape:** 3 cycles. Cycle 1 fixes the 5 blocker gaps. Cycle 2 builds
> P0 features (SubstrateClient + preset expansion + buildWorld). Cycle 3
> bumps versions and ships. Haiku reads, Opus decides, Sonnet writes,
> Sonnet checks.
>
> **What's in scope:** npm packages only. This TODO publishes the SDK,
> MCP, CLI, and templates. The BaaS platform infrastructure (metering,
> dashboard, billing, WfP, CF for SaaS) is in [TODO-platform-baas.md](TODO-platform-baas.md).
> The packages published here are the client libraries developers use to
> call the BaaS.

---

## Gaps + Features (from one-toolkit-features.md)

### Blockers fixed in Cycle 1

| # | Gap | Fix |
|---|-----|-----|
| G1 | `cli/one/` scaffold: `connections`, `people`, `knowledge` (dead names) | Rename → `paths`, `actors`, `learning` |
| G2 | `cli/package.json` `files` lists missing `TESTING-ONBOARDING.md` + `llms.txt` | Remove from array |
| G3 | `@oneie/*` missing `prepublishOnly: "bun run build"` | Add to all 3 |
| G4 | `packages/templates/README.md` missing | Write it |
| G5 | `cli/package.json` repo URL → `one-ie/one.git` (wrong) | Update to envelopes |
| G6 | SDK is HTTP utils only — no substrate calls possible from code | → Cycle 2 |

### P0 features built in Cycle 2

| # | Feature | Why P0 |
|---|---------|--------|
| F1 | `SubstrateClient` in `@oneie/sdk` — 12 typed methods | Publishing SDK without this means no one can actually use it from code |
| F2 | Typed `Outcome` union (`result \| timeout \| dissolved \| failure`) | `ask()` is meaningless without typed outcomes |
| F3 | 14 new presets → 30 total (edu, edge, creative, support clusters) | Low effort, closes the gap between agents/ folder and what the package exposes |
| F4 | `buildWorld(name, presets[])` + `buildTeam(role, size)` in templates | Teams are the real unit of deployment; single-agent scaffolding is only half the picture |

### P1 deferred → [TODO-platform-baas.md](TODO-platform-baas.md)

BaaS infrastructure (metering, dashboard, billing, webhook hosting) · CF Pages template for developers · Workers for Platforms managed tier · CF for SaaS custom domains · CLI observability (`status`, `list`, `logs`, `pay`, `world`) · MCP Tier 3 (`deploy_agent`, `list_active`, `get_outcomes`, `pay`) · Loop gates per tier

---

## Routing

```
    signal DOWN                           result UP
    ──────────                            ─────────
    /do TODO-publish-toolkit.md           mark(fit/form/truth/taste)
         │                                     │
         ▼                                     │
    ┌─ CYCLE 1: CLEAN ──────────────────┐      │ L1 signal
    │ fix 5 gaps, smoke tests, pack     │──────┤ L2 trail
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ CYCLE 2: UPGRADE ────────────────┐      │ L3 fade
    │ SubstrateClient + presets +       │──────┤ L4 economic
    │ buildWorld, update docs + tests   │      │
    └──────────┬────────────────────────┘      │
               ▼                               │
    ┌─ CYCLE 3: SHIP ───────────────────┐      │
    │ version bumps, npm publish order  │──────┤  (signal on publish event)
    │ verify installs, record to substr │      │
    └───────────────────────────────────┘      │
```

---

## Dimensional Mapping

| Artifact | Dimension | Where |
|---|---|---|
| `oneie`, `@oneie/sdk`, `@oneie/mcp`, `@oneie/templates` | Actor (kind=tool) | `cli/` + `packages/*/` |
| `SubstrateClient` | Thing (skill) | `packages/sdk/src/client.ts` |
| `buildWorld`, `buildTeam` | Thing (skill) | `packages/templates/src/world.ts` |
| `agent-scaffolded`, `agent-published` | Event (signal scope=public) | `src/pages/api/signal.ts` |

---

## Testing — The Deterministic Sandwich

```
PRE  (before Cycle 1)                  POST (after each cycle)
─────────────────────                  ──────────────────────
bun run verify                         bun run verify
├── biome check .                      ├── biome check .
├── tsc --noEmit                       ├── tsc --noEmit
└── vitest run (737 baseline)          └── vitest run (≥ 737, no regressions)

                                       CYCLE 1 adds:
                                       ├── 6 existing smoke tests green
                                       └── npm pack --dry-run: 0 warnings

                                       CYCLE 2 adds:
                                       ├── test-substrate-client.mjs (new)
                                       └── test-packages-boot.mjs updated
                                           (SubstrateClient + 30 presets)

                                       CYCLE 3 adds:
                                       └── npm show <pkg> version confirms publish
```

---

## Cycle 1: CLEAN — Fix gaps + smoke-test everything

**Scope:** Rename dead scaffold folders, clean package.json configs, add
`prepublishOnly`, write templates README, run all 6 smoke tests.

**Files touched (estimated):** ~8 files.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `cli/one/` scaffold folders | Dead names → locked names | 0.40/0.20/0.30/0.10 | `ls cli/one/` shows `actors paths learning` |
| 2 | `cli/package.json` | `files` clean, repo URL correct | 0.35/0.20/0.35/0.10 | `npm pack --dry-run` 0 warnings |
| 3 | `@oneie/*` package.json ×3 | `prepublishOnly` present | 0.30/0.20/0.40/0.10 | grep finds it in all 3 |
| 4 | `packages/templates/README.md` | Consumers know what they're getting | 0.30/0.30/0.25/0.15 | file exists, ≥ 100 words |
| 5 | All 6 smoke tests | Baseline confirmed before upgrading | 0.20/0.20/0.50/0.10 | all 6 exit 0 |

---

### Wave 1 — Recon (Haiku × 5, parallel)

| Agent | Target | What to extract |
|---|---|---|
| R1 | `cli/one/` — all subdirs + contents | Exact folder names, what's inside, any content that references old names |
| R2 | `cli/package.json` + `packages/{sdk,mcp,templates}/package.json` | `files` arrays, `scripts`, `repository`, missing `prepublishOnly` |
| R3 | `packages/templates/src/index.ts` + `presets.ts` | Exported surface (for README writing) |
| R4 | `packages/sdk/src/index.ts` + `handoff.ts` + `launch.ts` | SDK public surface today |
| R5 | `scripts/smoke-tests/` — all 6 `.mjs` files | What each tests, assertions that break after rename |

### Wave 2 — Decide (Opus, 1 pass)

Key decisions:
1. **Scaffold rename:** `connections/` → `paths/`, `people/` → `actors/`, `knowledge/` → `learning/`. Update any content inside those dirs referencing old names.
2. **CLI `files` array:** remove `TESTING-ONBOARDING.md` + `llms.txt`. Keep only files confirmed on disk.
3. **`prepublishOnly`:** `"prepublishOnly": "bun run build"` in all 3 `@oneie/*` package.json files.
4. **Repository URL:** `cli/package.json` → `git+https://github.com/one-ie/envelopes.git`, `directory: "cli"`.
5. **Smoke test assertion check:** if `test-packages-boot.mjs` asserts folder names, update accordingly.

### Wave 3 — Edits (Sonnet × 6, parallel)

| Task id | File / artifact | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P1-01 | Rename `cli/one/connections/` → `paths/`, `people/` → `actors/`, `knowledge/` → `learning/` + update any internal content using old names | fix | scaffold, dead-names | T-P3-* |
| T-P1-02 | `cli/package.json` — remove missing files from `files[]`; update `repository.url` + `directory` | fix | config, publish | T-P3-* |
| T-P1-03 | `packages/sdk/package.json`, `packages/mcp/package.json`, `packages/templates/package.json` — add `"prepublishOnly": "bun run build"` | fix | config, publish | T-P3-* |
| T-P1-04 | `packages/templates/README.md` — create: name + install + `listPresets()` + `generate()` usage + 5-line example + link to docs | new | docs, templates | — |
| T-P1-05 | `docs/sdk-reference.md` — add "Design boundary" section: HTTP wrapper, not local runtime; what's coming in 0.2.0 (SubstrateClient) | edit | docs, sdk | — |
| T-P1-06 | Run all 6 smoke tests (`node scripts/smoke-tests/<file>.mjs`), confirm exit 0. Fix failures in-place. | verify | smoke, test | T-P2-01 |

### Wave 4 — Verify (Sonnet × 3, parallel)

| Shard | Owns |
|---|---|
| V1 | Dead-name audit: grep `cli/one/` + `packages/` for `connections\|people\|knowledge` as dir names — 0 hits |
| V2 | Package configs: `files` refs exist; `prepublishOnly` in all 3 `@oneie/*`; repo URL correct |
| V3 | All 6 smoke tests exit 0; `npm pack --dry-run` clean across all 4 packages |

### Cycle 1 Gate

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
[ ] cli/package.json files array: 0 missing files, repo URL → envelopes.git
[ ] prepublishOnly: "bun run build" in all 3 @oneie/* package.json files
[ ] packages/templates/README.md exists, ≥ 100 words
[ ] docs/sdk-reference.md has "Design boundary" section
[ ] all 6 smoke tests exit 0
[ ] npm pack --dry-run: 0 warnings across all 4 packages
[ ] 737+ tests pass, 0 new failures
```

---

## Cycle 2: UPGRADE — P0 features (SubstrateClient + preset expansion)

**Scope:** Build `SubstrateClient` in `@oneie/sdk` (12 typed methods, typed
`Outcome` union). Expand templates to 30 presets (+14 new). Add `buildWorld()`
+ `buildTeam()`. Update smoke tests and docs to match.

**Depends on:** Cycle 1 gate green — scaffold names correct, packages build clean.

**Why before publish:** shipping `@oneie/sdk` without a substrate API client means
external developers can't actually call `signal`, `ask`, or any substrate verb
from code. The SDK would be utils + launch only. That's not a SDK.

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `SubstrateClient` class | Programmatic substrate calls from code | 0.40/0.20/0.30/0.10 | `new SubstrateClient().ask(...)` returns typed Outcome |
| 2 | Typed `Outcome` union | `ask()` result is typed, not `any` | 0.30/0.20/0.40/0.10 | tsc resolves `outcome.result \| outcome.timeout \| ...` |
| 3 | 30 presets (was 16) | Templates library covers real use cases | 0.35/0.20/0.35/0.10 | `listPresets().length === 30` |
| 4 | `buildWorld()` + `buildTeam()` | Teams are the unit of deployment | 0.40/0.20/0.30/0.10 | `buildTeam('marketing', 5)` returns 5 agent markdowns |
| 5 | `test-substrate-client.mjs` | Smoke test the new surface | 0.20/0.20/0.50/0.10 | exits 0 |

---

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `src/pages/api/` — signal.ts, ask.ts, loop/mark-dims.ts, decay-cycle.ts, memory/reveal.ts, hypotheses.ts, loop/highways.ts, loop/stage.ts | Exact request/response shape for each of the 12 substrate endpoints (for SubstrateClient method signatures) |
| R2 | `packages/sdk/src/{types,urls,storage,launch}.ts` | Where to extend: which file holds types, how auth is passed, error handling pattern |
| R3 | `agents/**/*.md` + `packages/templates/src/presets.ts` | Which agents in the repo don't have a preset yet — gap list for the +14 |
| R4 | `packages/templates/src/{generator,registry,people}.ts` | Existing builder surface — where to add `buildWorld` + `buildTeam` without breaking existing exports |

### Wave 2 — Decide (Opus, 1 pass)

Key decisions:
1. **SubstrateClient shape:** class vs plain functions. Decision: class with constructor `({ apiKey?, baseUrl? })`. Instance methods match verb names exactly: `signal`, `ask`, `mark`, `warn`, `fade`, `select`, `recall`, `reveal`, `forget`, `frontier`, `know`, `highways`.
2. **Outcome typing:** discriminated union — `{ result: unknown; latency: number } | { timeout: true; latency: number } | { dissolved: true; latency: number } | { failure: true; latency: number }`. Lives in `types.ts`.
3. **Preset selection (+14):** from the agents/ folder: `tutor`, `researcher`, `coach` (edu); `telegram-bot`, `discord-bot`, `notifier` (edge); `creative-director`, `copywriter` (creative); `concierge`, `classifier`, `triage`, `escalation` (support); `data-analyst`, `qa-engineer` (tech). Total: 30.
4. **`buildWorld` signature:** `buildWorld(name: string, presets: Array<Preset | {preset: string, name?: string, group?: string}>)` → `{ worldName, agents: GenerateResult[], deployInstructions: string }`.
5. **`buildTeam` signature:** `buildTeam(cluster: 'csuite' | 'marketing' | 'support' | 'edu' | 'creative' | 'edge', size?: number)` → `GenerateResult[]`. Uses predefined cluster compositions.
6. **File layout:** `client.ts` for SubstrateClient, `world.ts` in templates for buildWorld/buildTeam. Both exported from their package `index.ts`.

### Wave 3 — Edits (Sonnet × 10, parallel)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P2-01 | `packages/sdk/src/types.ts` — add `Outcome` discriminated union + `SubstrateSignal`, `SubstrateEdge`, `MemoryCard`, `Insight` response types | new | sdk, types | T-P2-02 |
| T-P2-02 | `packages/sdk/src/client.ts` — `SubstrateClient` class: constructor `({apiKey?, baseUrl?})`, 12 methods each calling one API endpoint, typed return per method | new | sdk, client | T-P2-03 |
| T-P2-03 | `packages/sdk/src/index.ts` — export `SubstrateClient`, `Outcome`, new response types alongside existing exports | edit | sdk | T-P2-08 |
| T-P2-04 | `packages/sdk/package.json` — bump version `0.1.0` → `0.2.0`; add `"./client"` to exports map | edit | sdk, version | T-P3-* |
| T-P2-05 | `packages/templates/src/presets.ts` — add 14 new presets (edu: tutor/researcher/coach; edge: telegram-bot/discord-bot/notifier; creative: creative-director/copywriter; support: concierge/classifier/triage/escalation; tech: data-analyst/qa-engineer) | edit | templates, presets | T-P2-07 |
| T-P2-06 | `packages/templates/src/world.ts` — `buildWorld(name, presets[])` + `buildTeam(cluster, size?)` + cluster definitions for csuite/marketing/support/edu/creative/edge | new | templates, world | T-P2-07 |
| T-P2-07 | `packages/templates/src/index.ts` — export `buildWorld`, `buildTeam`, cluster types from world.ts | edit | templates | T-P2-08 |
| T-P2-08 | `packages/templates/package.json` — bump version `0.1.0` → `0.2.0`; add `"./world"` to exports map | edit | templates, version | T-P3-* |
| T-P2-09 | `scripts/smoke-tests/test-substrate-client.mjs` — new smoke: instantiate `SubstrateClient`, call each of 12 methods with a mock server or assert the method exists + correct signature; assert Outcome union discriminates correctly | new | test, smoke, sdk | — |
| T-P2-10 | `scripts/smoke-tests/test-packages-boot.mjs` — update: add `SubstrateClient` assertion; update preset count assertion from 16 → 30; add `buildWorld` + `buildTeam` assertions | edit | test, smoke | — |

### Wave 4 — Verify (Sonnet × 3, parallel)

| Shard | Owns |
|---|---|
| V1 | TypeScript: `tsc --noEmit` clean in `packages/sdk/` + `packages/templates/`; `SubstrateClient` methods all typed, no `any` returns; `Outcome` union exhaustively handled |
| V2 | Smoke tests: `test-substrate-client.mjs` + updated `test-packages-boot.mjs` both exit 0; `listPresets().length === 30` confirmed; `buildTeam('marketing', 5)` returns 5 results |
| V3 | Docs updated: `docs/sdk-reference.md` shows `SubstrateClient` usage; `docs/one-toolkit-features.md` surface map updated to reflect 0.2.0 state |

### Cycle 2 Gate

```bash
bun run verify
bun run build --workspace packages/sdk                    # builds clean
bun run build --workspace packages/templates              # builds clean
node -e "import('@oneie/sdk').then(m => { console.log(typeof m.SubstrateClient); })"
# → 'function'
node -e "import('@oneie/templates').then(m => { console.log(m.listPresets().length, typeof m.buildTeam); })"
# → 30 'function'
node scripts/smoke-tests/test-substrate-client.mjs        # ✓
node scripts/smoke-tests/test-packages-boot.mjs           # ✓ (30 presets)
node scripts/smoke-tests/test-no-mint-code.mjs            # ✓
```

```
[ ] SubstrateClient class: 12 methods, all typed, no `any` returns
[ ] Outcome discriminated union: result | timeout | dissolved | failure
[ ] 30 presets total: listPresets().length === 30
[ ] buildWorld(name, presets[]) returns { worldName, agents[], deployInstructions }
[ ] buildTeam(cluster, size?) returns GenerateResult[]
[ ] test-substrate-client.mjs exits 0
[ ] test-packages-boot.mjs exits 0 (updated assertions)
[ ] @oneie/sdk version bumped to 0.2.0
[ ] @oneie/templates version bumped to 0.2.0
[ ] 737+ tests pass, 0 new failures
```

---

## Cycle 3: SHIP — Version bump + npm publish

**Scope:** Bump `oneie` to 3.7.0. `@oneie/mcp` stays at 0.1.0 (no MCP
changes this cycle). `@oneie/sdk` and `@oneie/templates` already bumped in
Cycle 2. Publish in dep order. Verify installs. Record to substrate.

**Depends on:** Cycle 2 gate green — SubstrateClient typed, 30 presets, smoke tests pass.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `oneie@3.7.0` on npm | 12 new substrate verbs + fixed scaffold | 0.40/0.15/0.35/0.10 | `npm show oneie version` = 3.7.0 |
| 2 | `@oneie/sdk@0.2.0` on npm | SubstrateClient available to all | 0.35/0.15/0.40/0.10 | `npm show @oneie/sdk version` = 0.2.0 |
| 3 | `@oneie/mcp@0.1.0` on npm | 15 substrate tools via MCP | 0.35/0.15/0.40/0.10 | `npm show @oneie/mcp version` = 0.1.0 |
| 4 | `@oneie/templates@0.2.0` on npm | 30 presets + buildWorld available | 0.35/0.15/0.40/0.10 | `npm show @oneie/templates version` = 0.2.0 |

---

### Wave 1 — Recon (Haiku × 3, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `npm pack --workspace cli --dry-run` output | Exact tarball: 17 cmds in dist/commands/, scaffold actors/paths/learning, no .ts source |
| R2 | `npm pack --workspace packages/sdk --dry-run` + mcp + templates | dist/ present, README in templates, SubstrateClient in sdk dist, 30 presets in templates dist |
| R3 | `npm show oneie` + `npm show @oneie/sdk` + `npm show @oneie/templates` + `npm show @oneie/mcp` | Current published versions, org access for `@oneie/*` scope |

### Wave 2 — Decide (Opus, 1 pass)

Lock: publish order, `--access public` requirement for scoped packages, changelog entries, npm org verification.

Key decisions:
1. **Publish order:** `@oneie/templates@0.2.0` → `@oneie/sdk@0.2.0` → `@oneie/mcp@0.1.0` → `oneie@3.7.0`
2. **Scoped access:** `--access public` required on first publish for all `@oneie/*`
3. **oneie version:** 3.6.40 → 3.7.0 (minor: 12 new substrate verbs, fixed scaffold)
4. **Changelog:** brief `## 3.7.0` / `## 0.2.0` entries — one line per major change
5. **npm org:** confirm `@oneie` org exists + publish rights before running

### Wave 3 — Edits (Sonnet × 2, parallel)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-P3-01 | `cli/package.json` — bump `version` → `3.7.0` | fix | version, publish | T-P3-03 |
| T-P3-02 | `cli/CHANGELOG.md` — add `## 3.7.0`: 12 substrate verbs, scaffold dimension names fixed; `packages/sdk/CHANGELOG.md` — add `## 0.2.0`: SubstrateClient; `packages/templates/CHANGELOG.md` — add `## 0.2.0`: 30 presets, buildWorld/buildTeam | new | docs, changelog | T-P3-03 |

### Wave 4 — Verify + Ship (Sonnet × 2, then publish sequence)

**Pre-publish verification (parallel):**

| Shard | Owns |
|---|---|
| V1 | `npm pack` tarball review for cli: 17 commands in dist/commands/, scaffold shows actors/paths/learning, no .ts source files |
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

# Step 5 — verify clean installs
npm install -g oneie@3.7.0
oneie --version                     # → 3.7.0
oneie --help                        # → 17 verbs
oneie init --dry-run                # scaffold shows actors/ paths/ learning/

node -e "import('@oneie/sdk@0.2.0').then(m => console.log(typeof m.SubstrateClient))"
# → 'function'

node -e "import('@oneie/templates@0.2.0').then(m => console.log(m.listPresets().length))"
# → 30

# Step 6 — emit agent-published signal
curl -X POST https://api.one.ie/api/signal \
  -H "Content-Type: application/json" \
  -d '{"receiver":"substrate:agent-published","data":{"tags":["publish","npm","oneie"],"content":{"packages":["oneie@3.7.0","@oneie/sdk@0.2.0","@oneie/mcp@0.1.0","@oneie/templates@0.2.0"]}}}'
```

### Cycle 3 Gate

```bash
npm show oneie version              # 3.7.0
npm show @oneie/sdk version         # 0.2.0
npm show @oneie/mcp version         # 0.1.0
npm show @oneie/templates version   # 0.2.0
oneie --version                     # 3.7.0 (from npm)
oneie --help | grep -c "signal\|ask\|mark\|warn\|fade\|recall\|reveal\|forget\|frontier\|know\|highways\|select\|launch"
# → 13+
node -e "import('@oneie/sdk').then(m=>console.log(m.SDK_VERSION))"   # 0.2.0
node -e "import('@oneie/templates').then(m=>console.log(m.listPresets().length))"  # 30
```

```
[ ] oneie@3.7.0 published, installs clean globally
[ ] @oneie/sdk@0.2.0 published — SubstrateClient accessible via npm
[ ] @oneie/mcp@0.1.0 published — 15 tools callable
[ ] @oneie/templates@0.2.0 published — 30 presets + buildWorld
[ ] oneie --help enumerates ≥ 17 verbs
[ ] oneie init scaffold: actors/ events/ groups/ learning/ paths/ things/
[ ] new SubstrateClient() works from a clean npm install
[ ] agent-published signal emitted to substrate
[ ] 737+ tests still pass
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Rough share |
|---|---|---|---|---|
| 1 | W1 | 5 | Haiku | 3% |
| 1 | W2 | 1 | Opus | 8% |
| 1 | W3 | 6 | Sonnet | 12% |
| 1 | W4 | 3 | Sonnet | 6% |
| 2 | W1 | 4 | Haiku | 3% |
| 2 | W2 | 1 | Opus | 10% |
| 2 | W3 | 10 | Sonnet | 20% |
| 2 | W4 | 3 | Sonnet | 8% |
| 3 | W1 | 3 | Haiku | 2% |
| 3 | W2 | 1 | Opus | 5% |
| 3 | W3 | 2 | Sonnet | 3% |
| 3 | W4 | 2 | Sonnet | 5% |
| Ship | — | — | — | 15% (manual publish steps) |

**Hard stop:** any W4 that loops > 3 times → halt, escalate.

---

## Status

- [ ] **Cycle 1: CLEAN** — fix gaps, smoke-test, pack dry-run
  - [ ] W1 — Recon (Haiku × 5, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 6, parallel)
  - [ ] W4 — Verify (Sonnet × 3, parallel by shard)
- [ ] **Cycle 2: UPGRADE** — SubstrateClient + 30 presets + buildWorld
  - [ ] W1 — Recon (Haiku × 4, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 10, parallel)
  - [ ] W4 — Verify (Sonnet × 3, parallel by shard)
- [ ] **Cycle 3: SHIP** — version bumps, publish, verify installs
  - [ ] W1 — Recon (Haiku × 3, parallel)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 2, parallel)
  - [ ] W4 — Verify + ship (Sonnet × 2, then publish sequence)

---

## Execution

```bash
/do TODO-publish-toolkit.md          # advance current wave
/do TODO-publish-toolkit.md --auto   # run W1→W4 continuously until gate
/see tasks --tag publish             # open publish tasks
/see tasks --tag sdk                 # SubstrateClient tasks
/see highways                        # proven paths
/close T-P1-01                       # mark task done
```

---

## See Also

- [TODO-platform-baas.md](TODO-platform-baas.md) — BaaS platform infrastructure (depends on this TODO)
- [one-toolkit-features.md](one-toolkit-features.md) — full feature inventory + P0/P1/P2/P3 matrix
- [TODO-copy-toolkit.md](TODO-copy-toolkit.md) — what was built (3 cycles, done)
- [pricing.md](pricing.md) — 5 tiers, 3 deploy options, loop gates
- [infra-models.md](infra-models.md) — BaaS / CF Pages / Managed / Detached
- [cli-reference.md](cli-reference.md) — 17 verbs (current)
- [sdk-reference.md](sdk-reference.md) — SDK surface + design boundary
- [mcp-tools.md](mcp-tools.md) — 15 MCP tools
- [launch-handoff.md](launch-handoff.md) — the agent-launch contract
- [dictionary.md](dictionary.md) — locked dimension names
- [rubrics.md](rubrics.md) — fit/form/truth/taste
- [TODO-template.md](TODO-template.md) — wave pattern used here

---

*3 cycles. 12 waves. 28 tasks. Fix first, upgrade second, ship third.
`oneie@3.7.0` · `@oneie/sdk@0.2.0` · `@oneie/mcp@0.1.0` · `@oneie/templates@0.2.0`.*
