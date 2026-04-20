---
title: TODO — `oneie` CLI Feature Parity + UX Polish
type: roadmap
version: 3.7.0
priority: Wire commerce → Prove ergonomics → Grow interactive
total_tasks: 22
completed: 0
status: PLANNED
---

# TODO: `oneie` CLI Full-Featured

> **Time units:** plan in **tasks → waves → cycles** only. Never days,
> hours, weeks. (See `.claude/rules/engine.md` → Locked Rule 2.)
>
> **Parallelism directive:** **maximize agents per wave.** Every wave
> must fan out in a **single message** with multiple `Agent` tool calls.
> W1 ≥ 4 Haiku (one per recon target), W2 ≥ 2 Opus shards when findings
> > 20, W3 = one Sonnet per file, W4 ≥ 2 Sonnet verifiers by check type.
> Sequential only between waves.
>
> **Goal:** Bring `oneie` to full parity with the substrate's HTTP API
> (every user-facing endpoint reachable as a verb) AND ship first-class
> CLI ergonomics (config profiles, shell completion, watch mode, output
> formats, REPL) so that any operation a human would do against ONE is
> one terminal command away.
>
> **Source of truth:**
> [cli-reference.md](cli-reference.md) — the current 18-verb surface; this TODO expands it,
> [src/pages/api/CLAUDE.md](../src/pages/api/CLAUDE.md) — the endpoint catalog CLI must mirror,
> [TODO-mcp.md](TODO-mcp.md) — sibling TODO; every new CLI verb MUST share a name with the MCP tool,
> [TODO-sdk.md](TODO-sdk.md) — sibling TODO; every CLI verb wraps an SDK method,
> [DSL.md](one/DSL.md) + [dictionary.md](dictionary.md) + [rubrics.md](rubrics.md) — always loaded in W2,
> [buy-and-sell.md](buy-and-sell.md) — commerce verbs this TODO adds.
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides,
> Sonnet writes, Sonnet verifies.

---

## Why this TODO exists

The CLI is the canonical verb surface — what MCP and SDK mirror. Three
gaps block `oneie` from being "full featured":

1. **Commerce + governance verbs missing.** Current CLI has 12 substrate
   + 6 lifecycle verbs but no `pay`, `hire`, `bounty`, `commend`, `flag`,
   `status`, `capabilities`, `publish`. Buyers and sellers must curl.
2. **Observability verbs missing.** No `stats`, `health`, `revenue`,
   `export`. Power users can't see substrate state in-terminal.
3. **UX is stuck at "run one verb per invocation".** No config profiles
   (`~/.config/oneie/profiles/*`), no shell completion, no watch mode
   (`oneie agent --watch agents/*.md`), no output formats (`--json`,
   `--yaml`, `--table`), no REPL, no batch ops.

Closing these three brings `oneie` to 40 verbs + modern CLI ergonomics.

---

## Current state (verified from `cli/src/`)

### Existing verbs (18)

| Bundle | Verbs | Source |
|---|---|---|
| substrate (12) | `signal`, `ask`, `mark`, `warn`, `fade`, `select`, `recall`, `reveal`, `forget`, `frontier`, `know`, `highways` | `cli/src/commands/` |
| lifecycle (6) | `init`, `agent`, `deploy`, `claw`, `sync`, `launch` | `cli/src/commands/` |

### Config today

- `ONEIE_API_KEY` env → `ONE_API_KEY` env → `~/.config/oneie/config.json`
- Base URL via `ONEIE_API_URL` env or config `baseUrl`
- No profile switching; no alias mapping

---

## Cycle 1 — WIRE: Commerce + Governance + Observability verbs (12 new)

Closes the verb gap between CLI and the HTTP API / MCP. Every new verb
matches its MCP tool name exactly (loaded in W2 as the naming rule).

### Cycle 1 Deliverables

| # | Verb | Endpoint | Rubric (fit/form/truth/taste) | Skill |
|---|---|---|---|---|
| 1 | `pay` | `POST /api/pay` | 0.40/0.15/0.40/0.05 | `oneie-cli:pay` |
| 2 | `hire` | `POST /api/buy/hire` | 0.40/0.15/0.35/0.10 | `oneie-cli:hire` |
| 3 | `bounty` | `POST /api/buy/bounty` | 0.35/0.20/0.35/0.10 | `oneie-cli:bounty` |
| 4 | `commend` | `POST /api/agents/:id/commend` | 0.35/0.20/0.35/0.10 | `oneie-cli:commend` |
| 5 | `flag` | `POST /api/agents/:id/flag` | 0.35/0.20/0.35/0.10 | `oneie-cli:flag` |
| 6 | `status` | `POST /api/agents/:id/status` | 0.30/0.20/0.40/0.10 | `oneie-cli:status` |
| 7 | `capabilities` | `GET /api/agents/:id/capabilities` | 0.35/0.20/0.35/0.10 | `oneie-cli:capabilities` |
| 8 | `publish` | `POST /api/capabilities/publish` | 0.35/0.20/0.35/0.10 | `oneie-cli:publish` |
| 9 | `stats` | `GET /api/stats` | 0.30/0.20/0.40/0.10 | `oneie-cli:stats` |
| 10 | `health` | `GET /api/health` | 0.30/0.20/0.40/0.10 | `oneie-cli:health` |
| 11 | `revenue` | `GET /api/revenue` | 0.35/0.20/0.35/0.10 | `oneie-cli:revenue` |
| 12 | `export` | `GET /api/export/<kind>` | 0.35/0.20/0.35/0.10 | `oneie-cli:export` |

### Cycle 1 Waves

**W1 — Recon (Haiku × 12, parallel)** — one agent per endpoint + matching existing CLI command pattern. Each reads the route handler, reports body shape, response shape, error cases, auth. ≤ 300 words, `file:line` citations.

All 12 spawned in a single message. Batching targets into one agent serializes work.

| Agent | Endpoint | Sibling CLI pattern to match |
|---|---|---|
| R1 | `src/pages/api/pay.ts` | `cli/src/commands/signal.ts` |
| R2 | `src/pages/api/buy/hire.ts` | `cli/src/commands/signal.ts` |
| R3 | `src/pages/api/buy/bounty.ts` | `cli/src/commands/signal.ts` |
| R4-R6 | `agents/:id/{commend,flag,status}.ts` | `cli/src/commands/mark.ts` |
| R7-R8 | `agents/:id/capabilities.ts`, `capabilities/publish.ts` | `cli/src/commands/highways.ts` |
| R9-R11 | `stats.ts`, `health.ts`, `revenue.ts` | `cli/src/commands/highways.ts` |
| R12 | `export/*.ts` | `cli/src/commands/highways.ts` |

**W2 — Decide (Opus × 1)** — 12 findings fit one context. Produce per-verb spec: argv parsing (`parseArgs` + `requireArg`), `apiRequest` call, output format, error handling. Every new verb follows the same idiom as existing commands (line 10–30 of `commands/mark.ts` is the canonical pattern).

**W3 — Edit (Sonnet × 13, parallel by file)**

| Job | File | Notes |
|---|---|---|
| E1–E12 | `cli/src/commands/<verb>.ts` | One new file per verb (12 total) |
| E13 | `cli/src/index.ts` | Register all 12 verbs in the routing table |

Never batch files into one agent; never split one file across agents.

**W4 — Verify (Sonnet × 3, parallel)**

| Shard | Owns |
|---|---|
| V1 | `cd cli && bun run build` clean; `bun run typecheck` passes |
| V2 | Each new verb callable: `npx oneie <verb> --help` prints usage; smoke-run with minimal args returns non-error against local substrate |
| V3 | `docs/cli-reference.md` updated — every new verb in a new row, matching MCP tool name from TODO-mcp.md |

**Cycle 1 Gate:**

```bash
# 18 → 30 verbs
npx oneie --help 2>&1 | grep -c "^ *[a-z][a-z-]* *$"
# 30

# Every new verb has a matching MCP tool
for v in pay hire bounty commend flag status capabilities publish stats health revenue export; do
  grep -q "\"$v\"" packages/mcp/src/tools/ && echo "$v ✓" || echo "$v ✗"
done
```

---

## Cycle 2 — PROVE: CLI Ergonomics (6 features)

Moves `oneie` from "one-shot verb runner" to "professional CLI". Depends
on Cycle 1 (need the full verb surface before polishing its ergonomics).

### Cycle 2 Deliverables

| # | Feature | What it does | Rubric | Exit |
|---|---|---|---|---|
| 13 | `oneie config` | Manage profiles in `~/.config/oneie/profiles/<name>.json` | 0.30/0.25/0.35/0.10 | `oneie config add prod --url X --key Y`, `oneie --profile prod signal ...` |
| 14 | `oneie completion` | Emit bash/zsh/fish completion scripts | 0.25/0.30/0.35/0.10 | `oneie completion zsh > ~/.zsh/_oneie`; tab-complete works |
| 15 | `oneie <verb> --output <json\|yaml\|table>` | Structured output formats | 0.35/0.20/0.35/0.10 | `oneie highways --output table` renders ASCII table |
| 16 | `oneie agent --watch <glob>` | Watch filesystem, auto-sync changed agent markdown | 0.40/0.15/0.35/0.10 | edit `agents/x.md`, see re-sync fire within 500ms |
| 17 | `oneie <verb> --dry-run` | Print what would happen, don't execute | 0.35/0.20/0.40/0.05 | `oneie pay --dry-run` prints payload without POSTing |
| 18 | `oneie doctor` | Diagnose config, auth, substrate reachability, CLI version | 0.35/0.25/0.30/0.10 | Returns colored pass/fail grid covering: config found, API key valid, substrate reachable, TypeDB reachable, CLI up-to-date |

### Cycle 2 Waves

**W1 — Recon (Haiku × 6, parallel)** — one agent per feature area. Targets:

| Agent | Research |
|---|---|
| R1 | How existing CLI reads config (`cli/src/lib/config.ts`) — structure for profile extension |
| R2 | Prior-art: how `gh`, `kubectl`, `aws` ship shell completion — which lib we'd vendor or implement |
| R3 | JSON/YAML/table output in CLI — prior-art patterns (`--output=jsonpath`, `--format=table`) |
| R4 | Filesystem watcher lib options (`chokidar` vs native fs.watch) — already in deps? |
| R5 | Existing `--dry-run` patterns in `scripts/deploy.ts` — reuse the flag parsing |
| R6 | `bun run verify` sub-commands for doctor's substrate-reachability checks |

**W2 — Decide (Opus × 1)** — 6 findings fit one context. Produce design per feature: command structure, flag names, error modes. Key decision: is profile a flag (`--profile prod`) or a subcommand (`oneie profile use prod && oneie signal ...`)? Recommend flag — matches `gh --repo`, `kubectl --context`.

**W3 — Edit (Sonnet × 7, parallel)**

| Job | File |
|---|---|
| E1 | `cli/src/commands/config.ts` — `config add`, `config list`, `config use`, `config rm` |
| E2 | `cli/src/commands/completion.ts` — bash/zsh/fish script generator |
| E3 | `cli/src/lib/output.ts` — JSON/YAML/table formatters (pure functions) |
| E4 | `cli/src/commands/agent.ts` — add `--watch` flag + chokidar integration |
| E5 | `cli/src/lib/args.ts` — add `--dry-run` to the shared flag parser |
| E6 | `cli/src/commands/doctor.ts` — diagnostic grid command |
| E7 | `cli/src/index.ts` — register new commands, wire `--profile` global flag, wire `--output` global flag |

**W4 — Verify (Sonnet × 3, parallel)**

| Shard | Owns |
|---|---|
| V1 | Build + typecheck; every new file compiles |
| V2 | Functional: `oneie config add`, `oneie --profile X signal`, `oneie completion zsh`, `oneie agent --watch`, `oneie pay --dry-run`, `oneie doctor` — each returns expected outcome |
| V3 | Docs: `cli-reference.md` gets three new sections (profiles, output formats, doctor); root README mentions shell completion install |

**Cycle 2 Gate:** every feature ergonomically complete AND backward-compatible (no existing flag or verb broken).

---

## Cycle 3 — GROW: Interactive + Batch (4 features)

Moves from "many one-shot invocations" to "one interactive session".
Depends on Cycle 2 (profiles + output formats needed before REPL).

### Cycle 3 Deliverables

| # | Feature | What it does | Rubric | Exit |
|---|---|---|---|---|
| 19 | `oneie repl` | Interactive shell: verbs as commands, output in selected format, history, `.help` | 0.35/0.25/0.30/0.10 | `oneie repl` drops into prompt; `signal ...` / `discover ...` / `exit` work |
| 20 | `oneie agent <dir>` | Batch sync all `*.md` in a directory | 0.40/0.15/0.35/0.10 | `oneie agent agents/marketing/` syncs all files in parallel, reports aggregate result |
| 21 | `oneie pipe` | Stream mode: newline-delimited JSON in, emit signals, stream results out | 0.35/0.20/0.35/0.10 | `cat signals.ndjson \| oneie pipe` processes each line, outputs NDJSON results |
| 22 | `oneie tail` | Live-tail substrate events (WS or SSE) in terminal | 0.35/0.20/0.35/0.10 | `oneie tail --tag payment` streams signals matching the filter |

### Cycle 3 Waves

**W1 — Recon (Haiku × 4, parallel)**

| Agent | Research |
|---|---|
| R1 | REPL prior-art — `node --repl`, `python3`, `psql` — command parsing + history + readline |
| R2 | Batch sync — does `/api/agents/sync` accept multi-markdown body? Current shape + changes needed |
| R3 | NDJSON patterns — Node streams, `Readable.from(process.stdin)` + line split |
| R4 | Live-tail backend — WebSocket at `/api/ws` + SSE at `/api/stream` + what tags exist today |

**W2 — Decide (Opus × 1)**

**W3 — Edit (Sonnet × 5, parallel)**

| Job | File |
|---|---|
| E1 | `cli/src/commands/repl.ts` — readline loop + verb dispatch |
| E2 | `cli/src/commands/agent.ts` — add directory-batch branch |
| E3 | `cli/src/commands/pipe.ts` — NDJSON in/out |
| E4 | `cli/src/commands/tail.ts` — WS/SSE client |
| E5 | `cli/src/index.ts` — register new commands |

**W4 — Verify (Sonnet × 3)**

Cycle 3 Gate: all four features functional; `oneie --help` shows 36+ verbs; a first-time user can onboard via `oneie repl` alone.

---

## Routing

```
    /do TODO-cli.md
         │
         ▼
    ┌─────────┐
    │  W1     │  Haiku × N per cycle  → endpoint + pattern recon
    └────┬────┘
         ▼
    ┌─────────┐
    │  W2     │  Opus × 1 or 2 shards → verb specs (matching MCP names)
    └────┬────┘
         ▼
    ┌─────────┐
    │  W3     │  Sonnet × M files    → one new command file per verb
    └────┬────┘
         ▼
    ┌─────────┐
    │  W4     │  Sonnet × K checks   → build + stdio smoke + cli-reference.md
    │         │  → feedback signal    → tags: ['cli', 'lifecycle'|'ergonomics'|'interactive']
    └─────────┘
```

---

## Canonical decisions (loaded in every W2)

| Item | Canonical | Exceptions |
|------|-----------|------------|
| verb name | match MCP tool name exactly (from `TODO-mcp.md`); match dictionary.md verb | none |
| argv parsing | `parseArgs` + `requireArg` from `cli/src/lib/args.ts` | none |
| HTTP client | `apiRequest` from `cli/src/lib/http.ts` | streaming verbs (`tail`, `pipe`) use raw fetch |
| output format | JSON to stdout by default; `--output yaml\|table` switches | `doctor` has its own colored grid |
| error handling | `{ error: string }` to stdout; non-zero exit on failure | `tail` stays running on transient errors |
| file location | one command per file in `cli/src/commands/` | helpers in `cli/src/lib/` |

---

## Cross-coordination with `TODO-mcp.md` and `TODO-sdk.md`

**Every new CLI verb lands alongside its MCP tool + SDK method.** The
three packages move in lockstep:

| Stage | CLI verb | MCP tool | SDK method |
|---|---|---|---|
| Cycle 1 | `pay` | `pay` | `client.pay()` |
| Cycle 1 | `hire` | `hire` | `client.hire()` |
| ... | ... | ... | ... |

When `/do TODO-cli.md` advances Cycle 1 W3 (creates `cli/src/commands/pay.ts`),
the same cycle in `TODO-mcp.md` and `TODO-sdk.md` is expected to ship
the matching tool + method. Three checkboxes flip together.

Cycle 2 (ergonomics) is CLI-specific — no mirror in MCP/SDK.
Cycle 3 (interactive) is mostly CLI-specific; `tail` has a sibling in SDK
(streaming helpers) but not MCP (not a tool-call pattern).

---

## Testing — The Deterministic Sandwich

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    cd cli                              cd cli
    bun install                         bun run build       (compiles clean)
    bun run build                        bun run typecheck   (no TS errors)
    npx oneie --version                 npx oneie --help    (N verbs visible)
```

### Cycle Gate checklist

- [ ] `bun run build` clean in `cli/`
- [ ] Every new verb has a `--help` entry
- [ ] Every new verb returns non-error against local substrate on minimal args
- [ ] `docs/cli-reference.md` updated with every new verb + feature
- [ ] Cross-package: MCP + SDK have matching entries (or an explicit "CLI-only" note)

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Share |
|-------|------|--------|-------|-------|
| 1 | W1 | 12 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~15% |
| 1 | W3 | 13 | Sonnet | ~10% |
| 1 | W4 | 3 | Sonnet | ~10% |
| 2 | W1 | 6 | Haiku | ~5% |
| 2 | W2 | 1 | Opus | ~15% |
| 2 | W3 | 7 | Sonnet | ~10% |
| 2 | W4 | 3 | Sonnet | ~10% |
| 3 | W1 | 4 | Haiku | ~5% |
| 3 | W2 | 1 | Opus | ~15% |
| 3 | W3 | 5 | Sonnet | ~10% |
| 3 | W4 | 3 | Sonnet | ~10% |

Hard stop: any W4 looping > 3 times → halt + escalate.

---

## Status

- [x] **Cycle 1: WIRE — Commerce + Governance + Observability (12 verbs)**
  - [x] W1 — Recon (Haiku × 12, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 13, parallel by file)
  - [x] W4 — Verify (Sonnet × 3, parallel by check type)
- [x] **Cycle 2: PROVE — Ergonomics (6 features)**
  - [x] W1 — Recon (Haiku × 6, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 7, parallel by file)
  - [x] W4 — Verify (Sonnet × 3, parallel)
- [x] **Cycle 3: GROW — Interactive + Batch (4 features)**
  - [x] W1 — Recon (Haiku × 4, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 5, parallel by file)
  - [x] W4 — Verify (Sonnet × 3, parallel)

---

## Execution

```bash
/do docs/TODO-cli.md              # advance the next wave
/do docs/TODO-cli.md --auto       # run W1→W4 until cycle completes

# After each cycle, publish a new CLI version
cd cli
npm version minor                  # 3.7.0 → 3.8.0 (C1), 3.9.0 (C2), 3.10.0 (C3)
npm publish                        # ships to npm as `oneie`
```

---

## Finished surface

After three cycles, `oneie@3.10.0` ships with:

| Bundle | Verbs | Count |
|---|---|---|
| substrate (existing) | signal, ask, mark, warn, fade, select, recall, reveal, forget, frontier, know, highways | 12 |
| lifecycle (existing) | init, agent, deploy, claw, sync, launch | 6 |
| commerce (new) | pay, hire, bounty, commend, flag, status, capabilities, publish | 8 |
| observability (new) | stats, health, revenue, export | 4 |
| meta (new) | config, completion, doctor, repl, pipe, tail | 6 |
| **total** | | **36** |

Plus global flags: `--profile`, `--output`, `--dry-run`, `--json`, `--watch`.

---

## Out of scope (deliberately)

| Feature | Why excluded |
|---|---|
| `oneie query` (raw TypeQL) | Same reasoning as TODO-mcp — DoS / data-leak surface too broad |
| `oneie tick` | Runtime orchestration; substrate schedules its own loops |
| `oneie tasks *` | Wave runner internals; not user surface |
| GUI / TUI (ncurses) | Outside CLI scope; `oneie repl` is the interactive surface |
| Plugin system | Keeps the package surface stable; revisit if demand proves it |

---

## Upstream follow-ups

Writing these verbs will force re-reads of the underlying endpoints
and may surface drift (same pattern as the tutorial audit):

1. `oneie pay` — confirm `/api/pay` accepts the `{from, to, task, amount}` shape we verified and not a competing shape.
2. `oneie hire` / `oneie bounty` — verify `/api/buy/hire` and `/api/buy/bounty` are fully implemented (may be stubs).
3. `oneie commend` / `oneie flag` — governance role checks may reject `agent`-tier keys; document tier requirement in `--help`.
4. `oneie export` — `src/pages/api/agents/list.ts` is known-broken on deployed (uses `node:fs`); verify export/* endpoints don't share the same flaw.
5. `oneie doctor` — will become the canonical smoke-test for substrate readiness; its output format should be parseable for CI.

---

## See Also

- [cli-reference.md](cli-reference.md) — current + target CLI surface
- [TODO-mcp.md](TODO-mcp.md) — sibling; every new CLI verb matches an MCP tool
- [TODO-sdk.md](TODO-sdk.md) — sibling; every new CLI verb wraps an SDK method
- [tutorial-toolkit.md](tutorial-toolkit.md) — tutorial that uses these verbs via `npx`
- [src/pages/api/CLAUDE.md](../src/pages/api/CLAUDE.md) — endpoint catalog
- [DSL.md](one/DSL.md), [dictionary.md](dictionary.md), [rubrics.md](rubrics.md) — loaded in W2
- [TODO-template.md](one/TODO-template.md) — template this doc follows
- [loop-close.md](loop-close.md) — cycle close protocol

---

*3 cycles. 22 new features (12 verbs + 10 ergonomics/interactive). When done, `oneie` ships 36 verbs + full config profiles + shell completion + watch + REPL + batch + live tail.*
