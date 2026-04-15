---
title: TODO — Merge ONE CLI + toolkit DX into envelopes (no minting)
type: roadmap
version: 2.0.0
priority: Wire → Prove → Grow
total_tasks: 36
completed: 0
status: READY
---

# TODO: Merge ONE CLI + toolkit DX

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Goal:** Merge `../ONE/cli` (live `oneie` npm pkg, v3.6.40) into envelopes/ and extend it with DX patterns from `../agent-launch-toolkit/` — substrate-wired, owned locally. **Minting stays in agent-launch**; ONE calls it via one `launch` verb. By cycle end: `oneie`, `@oneie/sdk`, `@oneie/mcp`, `@oneie/templates` all publishable; one agent scaffolded → deployed → launched via agent-launch HTTP (dry-run sandbox).
>
> **Source of truth:**
> - [agent-launch-copy-plan.md](agent-launch-copy-plan.md) — the plan + division of labor
> - [copy-reports/](copy-reports/) — 7 haiku recon reports
> - [DSL.md](DSL.md) — signal language, `{ receiver, data }`, mark/warn/fade
> - [dictionary.md](dictionary.md) — canonical names
> - [one-ontology.md](one-ontology.md) — 6 dimensions
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark
>
> **Shape:** 3 cycles, 4 waves each. W1 Haiku, W2 Opus, W3 Sonnet, W4 Sonnet.
>
> **What's OUT of scope:** token minting, bonding curves, buy/sell, holders, claim, trade, `token.move`, EVM, Cosmos, BSC. All of that lives in agent-launch. ONE calls its HTTP endpoints via a single `launch` verb.

---

## Routing

```
    signal DOWN                          result UP
    ──────────                           ─────────
    /do TODO-copy-toolkit.md             mark(fit/form/truth/taste)
         │                                    │
         ▼                                    │
    ┌─ CYCLE 1: WIRE ────────────────────┐    │
    │ clone ../ONE/cli → envelopes/cli/  │    │ L1 signal
    │ scaffold sdk/mcp/templates pkgs    │────┤ L2 trail
    │ lift-shift substrate-agnostic DX   │    │ L3 fade
    └──────────┬─────────────────────────┘    │
               ▼                              │
    ┌─ CYCLE 2: PROVE ───────────────────┐    │
    │ substrate verbs as CLI + MCP       │    │ L4 economic
    │ launch-handoff to agent-launch HTTP│────┤ (signal on launch event)
    │ end-to-end scaffold→deploy→launch  │    │
    └──────────┬─────────────────────────┘    │
               ▼                              │
    ┌─ CYCLE 3: GROW ────────────────────┐    │
    │ docs merge, MCP HTTP, skill polish │    │ L5 evolution
    │ agent self-improvement on outcomes │────┤ L6 know
    │                                    │    │ L7 frontier
    └────────────────────────────────────┘    │
```

---

## Dimensional Mapping

| New thing created | Dimension | Where it lives |
|---|---|---|
| `oneie` (CLI, merged), `@oneie/sdk`, `@oneie/mcp`, `@oneie/templates` | Actor (kind=tool) | `cli/` + `packages/*/` |
| Substrate verbs as CLI/MCP tools (`signal`, `ask`, `mark`, `warn`, `recall`, `reveal`, `forget`, `frontier`, `know`, `highways`, `fade`, `select`) | Thing (skill) | Offered by tool actors via `capability` |
| CLI → substrate bridge, MCP → substrate bridge, CLI → agent-launch HTTP | Path | New paths from tool actors to engine + external |
| `agent-scaffolded`, `agent-deployed`, `token-launched` | Event (signal scope=public) | `src/pages/api/signal.ts` |
| "Agents with `launch` converge on path X" | Learning (hypothesis) | Promoted via `know()` |

---

## Canonical Decisions (locked in W2, no rework without explicit override)

| Decision | Choice | Rationale |
|---|---|---|
| CLI merge target | Clone `../ONE/cli/` wholesale into `envelopes/cli/`, keep npm name `oneie` | Preserve v3.6.40 publish history, existing users continue to `npx oneie` |
| Monorepo shape | `cli/` at root + `packages/{sdk,mcp,templates}/` scoped under `@oneie/*` | CLI bare, others scoped; avoids cross-repo imports (see `feedback_no_cross_repo_imports`) |
| Namespace | `oneie` (bare) + `@oneie/{sdk,mcp,templates}` (scoped) | Matches existing npm; NOT `@one/*` |
| CLI verb count | 17 total: 12 substrate + 4 deploy (`init`, `agent`, `deploy`, `claw`, `sync`) + 1 handoff (`launch`) | `init` + `agent` already in live CLI, preserved |
| MCP tool count | 15 tools in 2 tiers | T1 substrate verbs (12), T2 discovery (3: scaffold_agent, list_agents, get_agent). No T3 Sui/mint tier. |
| SDK surface | Re-exports from `@/engine` + toolkit's pure utils + `launchToken()` HTTP wrapper | `@oneie/sdk` re-exports `world`, `unit`, `persist`, `ask`, `llm`; adds `launchToken` |
| Minting | **Out of scope.** Handled by agent-launch. Called via `oneie launch` → agent-launch HTTP | No `tokenize`, `buy`, `sell`, `holders` verbs in ONE. |
| Chain for wallet-auth | Sui only (already live in `src/lib/sui.ts`) | — |
| Agent deploy | Wrap existing `/deploy` + `/claw`, don't rewrite | Already works |
| Launch handoff | HTTP POST to agent-launch; response emits `token-launched` signal | Clean boundary, pheromone learns which agents get launched |
| Dropped (code) | `tokenize.ts`, `buy.ts`, `sell.ts`, `holders.ts`, `claim.ts`, `alliance.ts`, `marketing.ts`, `onchain.ts`, `trading.ts`, `delegation.ts`, `token.move`, ethers, @cosmjs | See `copy-reports/*` |
| Dropped (docs) | Fetch-growth, Agentverse HTTP auth, BSC, EVM/Cosmos wallet | 25 of toolkit's 70 docs stay out |

---

## Testing — The Deterministic Sandwich

```
PRE  (before each cycle)            POST (after each cycle)
────────────────────────            ─────────────────────────
bun run verify                      bun run verify
├── biome check .                   ├── biome check .          (no new lint)
├── tsc --noEmit                    ├── tsc --noEmit           (no new type errors)
└── vitest run (320 tests)          ├── vitest run             (>= 320, no regressions)
                                    ├── new smoke tests green  (CLI/MCP/SDK boot)
                                    └── exit condition hit     (per-cycle verifiable)
```

---

## Cycle 1: WIRE — Clone `../ONE/cli` + Scaffold Companion Packages

**Scope:** Clone `../ONE/cli` into `envelopes/cli/` preserving `oneie` package identity. Scaffold `packages/{sdk,mcp,templates}/` with `@oneie/*` scope. Lift substrate-agnostic DX patterns from toolkit. No substrate rewrites, no launch-handoff yet. After this cycle, `oneie --help` runs with all existing verbs intact, new verbs stubbed.

**Files touched (estimated):** ~50 new/moved files.

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | What to extract |
|---|---|---|
| R1 | `../ONE/cli/**` | Full file map, existing verb list, package.json shape, bin wiring, test harness, everything that becomes `envelopes/cli/` |
| R2 | `../agent-launch-toolkit/packages/cli/src/{config.ts,http.ts,lib/,index.ts}` | DX utils worth adopting (config loader, http wrapper, banner). Exclude tokenize/buy/sell/holders. |
| R3 | `../agent-launch-toolkit/packages/sdk/src/{client.ts,urls.ts,storage.ts,handoff.ts,claude-context.ts}` | Pure utils for `@oneie/sdk`. Drop: agentlaunch, tokens, market, commerce, onchain, trading, delegation. |
| R4 | `../agent-launch-toolkit/packages/templates/src/{presets.ts,people.ts,generator.ts,registry.ts}` + `envelopes/agents/**/*.md` | Preset merge plan — which toolkit presets land, which ONE agents become presets |

### Wave 2 — Decide (Opus, 1 pass, ~12 findings)

Produce per-file specs for the ~50 files. Resolve: root `package.json` workspaces, tsconfig references, whether `cli/` or `packages/cli/`, preserve `oneie` bin wiring, test script integration. Lock monorepo layout.

### Wave 3 — Edits (Sonnet × M)

| Task id | File / artifact | Cat | Dim tags | Tags | Blocks |
|---|---|---|---|---|---|
| T-C1-01 | Clone `../ONE/cli/**` → `envelopes/cli/**` (preserve structure, update repo field in package.json) | lift | Actor | cli, merge | T-C1-02..04 |
| T-C1-02 | Root `package.json` add workspaces: `["cli", "packages/*"]`; root build script | new | Group | monorepo | all downstream |
| T-C1-03 | `envelopes/cli/tsconfig.json` — align paths with envelopes/, reference `@oneie/sdk` | rewrite | Actor | cli, config | T-C1-05 |
| T-C1-04 | `envelopes/cli/src/commands/` — preserve existing `init.ts`, `agent.ts`; stub 13 new command files | new | Thing | cli, verb | T-C2-* |
| T-C1-05 | `packages/sdk/package.json`, `tsconfig.json`, `src/index.ts` — `@oneie/sdk` re-export from `@/engine` | new | Actor | sdk | T-C2-sdk |
| T-C1-06 | `packages/sdk/src/{urls,storage,handoff,claude-context}.ts` — lift-shift from toolkit, rewire imports | lift | Thing | sdk, handoff | T-C2-sdk |
| T-C1-07 | `packages/mcp/package.json`, `tsconfig.json`, `src/{env,serve,index}.ts` — `@oneie/mcp` skeleton | new | Actor | mcp | T-C2-mcp |
| T-C1-08 | `packages/templates/package.json`, `src/{index,registry,generator,presets,people}.ts` — lift from toolkit | lift | Actor+Thing | templates | T-C1-09 |
| T-C1-09 | Port 15+ presets (existing `agents/**/*.md` + toolkit's C-suite/marketing presets, minus any tokenize-specific ones) | rewrite | Thing | templates, agent | T-C2-* |
| T-C1-10 | Adopt toolkit DX utils into `cli/src/lib/`: `config.ts`, `http.ts`, banner patterns (only what ONE doesn't already have) | lift | Path | cli, dx | T-C2-cli |
| T-C1-11 | `scripts/smoke-tests/{test-cli,test-mcp,test-sdk-esm,test-sdk-cjs,test-templates}.mjs` — adapt from toolkit | lift | Event | test, smoke | T-C1-12 |
| T-C1-12 | `scripts/test-publish.sh` + `scripts/scan-cli-src.ts` (from extract-source-truth.js) | lift | Event | test, dev-infra | — |
| T-C1-13 | `docs/copy-reports/` — commit 7 recon reports + cross-link from `agent-launch-copy-plan.md` | lift | Learning | docs | — |

**Exit per task:** file exists, `bun run build -w <pkg>` succeeds, no cross-repo imports, no tokenize/buy/sell code introduced.

### Wave 4 — Verify (Sonnet × 4)

| Shard | Owns | Reads |
|---|---|---|
| V1 | Consistency: all imports use `@/` or `@oneie/*`, never `../ONE` or `../agent-launch-toolkit` | all new files |
| V2 | Cross-ref: workspaces wired, tsconfig references valid, `oneie` bin still points correctly | package.json + tsconfigs |
| V3 | Preservation: existing `oneie init` + `oneie agent` behaviour identical pre/post merge | cli/src/commands/{init,agent}.ts + their tests |
| V4 | Anti-mint check: grep for `tokenize|bonding|buy|sell|holders|erc20|cosmjs|ethers` — must return 0 hits | all new files |

### Cycle 1 Gate

```bash
bun run verify                                          # 320+ tests green
bun run build                                           # cli + 3 packages build
node cli/dist/index.js --help                           # oneie CLI boots, lists verbs
node cli/dist/index.js init --dry-run                   # existing verb still works
node cli/dist/index.js agent --help                     # existing verb still works
node packages/mcp/dist/index.js                         # MCP server boots
node -e "require('@oneie/sdk')"                         # SDK loads
bash scripts/smoke-tests/test-templates.mjs             # presets load
```

```
[ ] envelopes/cli/ merged from ../ONE/cli, still publishes as `oneie`
[ ] 3 @oneie/* packages scaffolded, all build
[ ] 0 imports from ../ONE or ../agent-launch-toolkit
[ ] 0 hits for tokenize|bonding|buy|sell|holders|erc20|cosmjs|ethers
[ ] Existing `oneie init` + `oneie agent` verbs unchanged
[ ] 5 smoke tests green
[ ] 320+ tests pass, no new failures
[ ] oneie --help enumerates 17 verbs (existing + new stubs)
```

---

## Cycle 2: PROVE — Substrate Verbs + Launch Handoff

**Scope:** Wire 12 substrate verbs into CLI + MCP. Implement `launch` verb that HTTP-POSTs to agent-launch. End-to-end: `oneie agent tutor && oneie deploy && oneie launch tutor --dry-run` returns a mock token_id from agent-launch sandbox and emits `token-launched` signal.

**Depends on:** Cycle 1 packages scaffolded + build green.

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `src/engine/{world,persist,loop,llm,agent-md}.ts` | Which engine functions back which substrate verbs |
| R2 | Existing slash commands `.claude/commands/{see,create,do,close,sync}.md` | Which CLI verbs wrap which slash commands vs call engine directly |
| R3 | `src/pages/api/signal.ts` + agent-launch HTTP spec (fetch live, if available, or agree on stub) | Shape of `launch` request/response + emit contract |
| R4 | Toolkit's MCP router (`packages/mcp/src/index.ts`) | Tool router skeleton to adopt, stripped of tokenize tools |

### Wave 2 — Decide (Opus, 1 pass)

Produce ~20 diff specs. Lock: substrate verb argument shapes, MCP tool schemas, `launch` HTTP contract, signal payload for `token-launched`.

### Wave 3 — Edits (Sonnet × M, M ≈ 20 files)

| Task id | File / artifact | Cat | Dim tags | Tags | Blocks |
|---|---|---|---|---|---|
| T-C2-01 | `cli/src/commands/{signal,ask}.ts` — L1 emit + ask with 4-outcome display | new | Path | cli, substrate | T-C2-02 |
| T-C2-02 | `cli/src/commands/{mark,warn,fade,select}.ts` — L2/L3 ops | new | Path | cli, substrate | — |
| T-C2-03 | `cli/src/commands/{recall,reveal,forget,frontier}.ts` — L6/L7 memory verbs | new | Learning | cli, memory | — |
| T-C2-04 | `cli/src/commands/{know,highways}.ts` — L6 learning verbs | new | Learning | cli, learning | — |
| T-C2-05 | `cli/src/commands/deploy.ts` — wrap `/deploy` (spawn bun run deploy) | rewrite | Path | cli, deploy | — |
| T-C2-06 | `cli/src/commands/claw.ts` — wrap `/claw` | rewrite | Path | cli, connect | — |
| T-C2-07 | `cli/src/commands/sync.ts` — call `/api/tick`, extend existing sync-agents + sync-ontology scripts | rewrite | Path | cli, sync | — |
| T-C2-08 | **`cli/src/commands/launch.ts`** — HTTP POST to agent-launch `/v1/tokens`, parse response, emit `token-launched` signal | new | Path | cli, launch, handoff | T-C2-09 |
| T-C2-09 | `packages/sdk/src/launch.ts` — `launchToken(agent, opts)` HTTP wrapper + signal emit | new | Thing | sdk, launch, handoff | T-C2-08 |
| T-C2-10 | `packages/sdk/src/index.ts` — export `launchToken` + re-export engine primitives (world, unit, persist, ask, llm) | rewrite | Thing | sdk | T-C2-* |
| T-C2-11 | `packages/mcp/src/index.ts` — 15-tool router (T1 substrate + T2 discovery) | rewrite | Actor | mcp, router | T-C2-12,13 |
| T-C2-12 | `packages/mcp/src/tools/substrate.ts` — 12 T1 verbs (signal, ask, mark, warn, fade, select, recall, reveal, forget, frontier, know, highways) | new | Thing | mcp, verb | — |
| T-C2-13 | `packages/mcp/src/tools/discovery.ts` — scaffold_agent, list_agents, get_agent | rewrite | Thing | mcp, discovery | T-C1-08 |
| T-C2-14 | `packages/mcp/src/tools/handoff.ts` + `scaffold.ts` + `skill.ts` — lift from toolkit (no tokenize) | lift | Thing | mcp | — |
| T-C2-15 | `.claude/commands/launch.md` — slash command shim around `oneie launch` | new | Path | slash, cli | T-C2-08 |
| T-C2-16 | New smoke: `scripts/smoke-tests/test-launch-handoff.mjs` — scaffold → deploy stub → `launch --dry-run` against agent-launch sandbox; assert token_id + signal emitted | new | Event | test, e2e, launch | T-C2-08,09 |
| T-C2-17 | New smoke: `scripts/smoke-tests/test-mcp-verbs.mjs` — boot MCP, call all 12 T1 verbs | new | Event | test, mcp | T-C2-12 |
| T-C2-18 | New smoke: `scripts/smoke-tests/test-sdk-ask-roundtrip.mjs` — ask() < 7s (per `reference_speed`) | new | Event | test, speed | T-C2-10 |
| T-C2-19 | Anti-mint regression test: `scripts/smoke-tests/test-no-mint-code.mjs` — grep cli/ + packages/ for banned terms | new | Event | test, guardrail | — |
| T-C2-20 | Update `oneie launch --help` to link to agent-launch docs for buy/sell/holders | new | Path | cli, docs | T-C2-08 |

### Wave 4 — Verify (Sonnet × 5)

| Shard | Owns |
|---|---|
| V1 | Consistency: every substrate verb resolves to engine primitive, no duplicated logic |
| V2 | Cross-ref: CLI verbs → SDK → engine. MCP verbs → SDK → engine. `launch` is the only outbound HTTP. |
| V3 | Launch handoff: `test-launch-handoff.mjs` green against agent-launch sandbox, real response parsed, signal emitted with correct payload |
| V4 | Anti-mint: `test-no-mint-code.mjs` passes (0 hits for `tokenize|bonding|buy|sell|holders|erc20|cosmjs`) |
| V5 | Rubric fit/form/truth/taste across all new files |

### Cycle 2 Gate

```bash
bun run verify
bun run build
bash scripts/smoke-tests/test-launch-handoff.mjs        # launch --dry-run returns mock token_id
bash scripts/smoke-tests/test-mcp-verbs.mjs             # 12 T1 verbs return
bash scripts/smoke-tests/test-sdk-ask-roundtrip.mjs     # < 7s
bash scripts/smoke-tests/test-no-mint-code.mjs          # 0 banned hits
oneie launch tutor --dry-run                            # real flow, sandbox response
oneie recall --subject tutor                            # memory card shows token-launched signal
```

```
[ ] All 17 CLI verbs functional (12 substrate + 4 deploy + launch)
[ ] MCP exposes 15 tools, all callable
[ ] `oneie launch` posts to agent-launch, parses response, emits token-launched signal
[ ] 0 minting code in envelopes/ (guardrail test green)
[ ] ≥ 335 tests green (320 baseline + 15+ new)
[ ] SDK `ask()` round-trip p50 < 7s
```

---

## Cycle 3: GROW — Docs + MCP HTTP + Self-Improvement

**Scope:** Port 7 essential docs (no `tokens-sui.md` — it stays in agent-launch). Expose MCP over HTTP at `api.one.ie/mcp/*`. Wire launch outcomes into L5 evolution + L6 know (which agent personas convert to launches). Skill polish.

**Depends on:** Cycle 2 end-to-end flow working + rubric ≥ 0.65.

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target |
|---|---|
| R1 | Toolkit's essential docs (architecture, cli-reference, sdk-reference, mcp-tools, FEATURES, playbook, lifecycle, workflow) — which apply to ONE minus mint content |
| R2 | Existing `docs/` canon — merge anchors, duplicate sections, drift risk |
| R3 | `src/pages/api/` — what the MCP HTTP adapter needs |
| R4 | `src/engine/loop.ts` — where L5/L6 hooks should measure launch outcomes |

### Wave 2 — Decide (Opus, 1 pass)

Per-doc merge specs. MCP HTTP shape (SSE for signal subscribe, POST for verbs). Launch-outcome signal schema for L5/L6.

### Wave 3 — Edits (Sonnet × M, M ≈ 12 files)

| Task id | File / artifact | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-C3-01 | `docs/cli-reference.md` — 17 verbs, launch links to agent-launch for mint verbs | rewrite | docs, cli | — |
| T-C3-02 | `docs/sdk-reference.md` — extend existing `docs/sdk.md` with `@oneie/sdk` surface | rewrite | docs, sdk | — |
| T-C3-03 | `docs/mcp-tools.md` — 15 tools in 2 tiers | rewrite | docs, mcp | — |
| T-C3-04 | `docs/launch-handoff.md` — new; request/response contract, signal schema, error modes, link to agent-launch | new | docs, launch | — |
| T-C3-05 | `docs/features.md` — update, exclude mint features (link out) | lift | docs | — |
| T-C3-06 | `docs/playbook.md` — merge + adapt, keep agent economy story, mint story linked out | rewrite | docs, strategy | — |
| T-C3-07 | `docs/lifecycle.md` — scaffold → deploy → launch (handoff) — mint lifecycle stays in agent-launch docs | rewrite | docs, lifecycle | — |
| T-C3-08 | `src/pages/api/mcp/[...verb].ts` — MCP HTTP adapter (SSE signal subscribe, POST verbs) | new | api, mcp | — |
| T-C3-09 | `src/engine/loop.ts` — L6 hook: `know()` promotes `agent → token-launched` patterns; "agents with personas X converge on launching" | new | engine, L6 | — |
| T-C3-10 | `src/engine/loop.ts` — L5 hook: agents with low launch-rate after N asks get prompt-evolved | new | engine, L5 | — |
| T-C3-11 | `.claude/skills/oneie.md` — merge skill shape from toolkit SKILL.md (dimensions + verbs + launch handoff) | new | skill | — |
| T-C3-12 | Update README.md + CLAUDE.md: link new docs; remove `../ONE` + `../agent-launch-toolkit` mentions (or mark historical) | lift | docs, cleanup | — |

### Wave 4 — Verify (Sonnet × 4)

| Shard | Owns |
|---|---|
| V1 | Consistency: no dead names, vocab matches `dictionary.md`, no mint claims in ONE docs |
| V2 | Cross-ref: every new doc linked from README + `docs/CLAUDE.md` |
| V3 | MCP HTTP: end-to-end via `@oneie/mcp` client hitting `api.one.ie/mcp/*` |
| V4 | Self-improvement: seed a low-launch agent, run 20+ asks, verify evolution fires |

### Cycle 3 Gate

```bash
bun run verify
bun run build
npx @oneie/mcp --http http://localhost:8787              # MCP HTTP adapter boots
curl http://localhost:8787/mcp/ask -d '...'              # HTTP MCP responds
/sync evolve                                             # L5 runs, low-launch agents evolve
/see highways                                            # paths strengthen on launched agents
bash scripts/smoke-tests/test-launch-handoff.mjs --auto 5  # 5 agents auto-launched, 0 crashes
```

```
[ ] 7 docs ported (cli-ref, sdk-ref, mcp-tools, launch-handoff, features, playbook, lifecycle)
[ ] README + docs/CLAUDE.md link every new doc; no broken xrefs
[ ] MCP exposed over HTTP at api.one.ie, all 15 tools callable remotely
[ ] L6 promotes launch patterns as hypotheses
[ ] L5 evolves at least one agent prompt based on low launch-rate
[ ] .claude/skills/oneie.md triggers on "dimension", "verb", "launch"
[ ] ≥ 345 tests green
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Rough share |
|---|---|---|---|---|
| 1 | W1 | 4 | Haiku | 2% |
| 1 | W2 | 1 | Opus | 8% |
| 1 | W3 | 13 | Sonnet | 20% |
| 1 | W4 | 4 | Sonnet | 6% |
| 2 | W1 | 4 | Haiku | 2% |
| 2 | W2 | 1 | Opus | 10% |
| 2 | W3 | 20 | Sonnet | 25% |
| 2 | W4 | 5 | Sonnet | 8% |
| 3 | W1 | 4 | Haiku | 2% |
| 3 | W2 | 1 | Opus | 5% |
| 3 | W3 | 12 | Sonnet | 10% |
| 3 | W4 | 4 | Sonnet | 2% |

**Hard stop:** any W4 loops > 3 → halt, escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — clone `../ONE/cli` + scaffold `@oneie/*` packages
  - [x] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 13)
  - [ ] W4 — Verify (Sonnet × 4)
- [ ] **Cycle 2: PROVE** — substrate verbs + launch handoff
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 20)
  - [ ] W4 — Verify (Sonnet × 5)
- [ ] **Cycle 3: GROW** — docs + MCP HTTP + self-improvement
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 12)
  - [ ] W4 — Verify (Sonnet × 4)

---

## Execution

```bash
/do TODO-copy-toolkit.md          # advance current wave
/do TODO-copy-toolkit.md --auto   # run W1→W4 continuously until rubric >= 0.65
/see tasks --tag cli              # open tasks for CLI merge
/see highways                     # which paths strengthen as work completes
/close T-C1-01                    # mark a task done
```

---

## See Also

- [agent-launch-copy-plan.md](agent-launch-copy-plan.md) — plan + division of labor (ONE vs agent-launch)
- [copy-reports/cli-live.md](copy-reports/cli-live.md) — `../ONE/cli` file map (merge target)
- [copy-reports/cli-dx.md](copy-reports/cli-dx.md) — toolkit DX patterns (no mint verbs)
- [copy-reports/mcp.md](copy-reports/mcp.md) — MCP router shape (no tokenize tools)
- [copy-reports/sdk.md](copy-reports/sdk.md) — `@oneie/sdk` surface
- [copy-reports/templates.md](copy-reports/templates.md) — preset merge plan
- [copy-reports/launch-api.md](copy-reports/launch-api.md) — agent-launch HTTP contract
- [copy-reports/skill-scripts.md](copy-reports/skill-scripts.md) — SKILL.md + smoke tests
- [TODO-template.md](TODO-template.md) — wave pattern used here
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [one-ontology.md](one-ontology.md) — 6 dimensions
- [rubrics.md](rubrics.md) — fit/form/truth/taste

---

*3 cycles. 12 waves. 36 tasks. Haiku reads, Opus decides, Sonnet writes, Sonnet checks. Outcome: `oneie` CLI merged from `../ONE/cli`, extended with substrate verbs + toolkit DX, substrate-wired, launch-handoff to agent-launch for minting. Fully owned, no cross-repo imports, zero mint code.*
