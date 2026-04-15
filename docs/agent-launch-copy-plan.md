# ONE Toolkit: Copy Plan

**Goal:** merge `../ONE/cli` (live `oneie` npm pkg, v3.6.40) + DX patterns from `../agent-launch-toolkit/` into ONE so the substrate ships with a polished CLI/SDK/MCP/templates stack. **Scope excludes token minting and bonding curves — those stay in agent-launch.** ONE calls agent-launch's HTTP endpoints via a single `launch` verb when a user wants to tokenize.

**Method:** this doc is the map. Haiku agents fan out per surface, read every file, produce a per-surface TODO wired into ONE's dimensions. No code moves until the scans complete.

---

## Division of Labor

```
┌───────────────────────────────────────────────────────────────────┐
│ ONE (this repo) — everything except minting                       │
│                                                                    │
│   oneie CLI          → scaffold, deploy, claw, wallet, signal,    │
│                        ask, recall, reveal, forget, highways,     │
│                        frontier, know, pay, launch                │
│   @oneie/sdk         → engine wrapper (world, unit, persist, ask) │
│   @oneie/mcp         → 12 substrate verbs as MCP tools            │
│   @oneie/templates   → 15+ agent.md presets                       │
│   Sui wallet-auth    → Ed25519 challenge/response (already live)  │
│   Agent deploy       → nanoclaw + Agentverse bridge               │
│   Substrate          → signal routing, pheromone, 7 loops         │
│                                                                    │
└──────────────────────────────┬────────────────────────────────────┘
                               │  oneie launch <agent>
                               │  (HTTP → agent-launch endpoints)
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ agent-launch (external) — minting only                            │
│                                                                    │
│   create_token, buy, sell, holders, bonding curve, token.move     │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

**The handoff:** `oneie launch <agent>` POSTs the agent's Sui address + metadata to agent-launch's API, receives back a token id + tx digest, emits a `token-launched` signal into the substrate for path tracking. That's the only cross-boundary call.

---

## Source inventory (what we're copying from)

### `../ONE/cli/` — the live `oneie` package (merge target)

```
../ONE/cli/
├── package.json             # name: "oneie", bin: one + oneie, v3.6.40
├── src/
│   ├── index.ts             # entry
│   ├── banner.ts
│   ├── commands/            # init, agent
│   ├── admin/               # admin subcommands
│   ├── clone-docs.ts
│   ├── clone-web.ts
│   ├── sync-agents.ts
│   ├── sync-ontology.ts
│   ├── create-org-profile.ts
│   ├── create-user-profile.ts
│   ├── copy-claude-config.ts
│   ├── lib/
│   └── utils/
├── bin/
├── test/
└── one/                     # bundled scaffolds
```

This is the **anchor**. We clone it into `envelopes/cli/`, keep the published name `oneie`, extend with substrate verbs + DX patterns below.

### `../agent-launch-toolkit/` — DX patterns to adopt (NOT mint code)

```
../agent-launch-toolkit/
├── packages/
│   ├── cli/          # scaffolder, config, http, lib — copy patterns, not tokenize/trade
│   ├── mcp/          # tool router shape — copy skeleton, not bonding curve tools
│   ├── sdk/          # claude-context, urls, storage, handoff — copy pure utils
│   └── templates/    # presets + generator — copy wholesale (presets only)
├── skill/SKILL.md    # Claude Code skill shape — adopt
├── scripts/          # smoke-tests harness — adopt
└── docs/             # 70+ docs — mine for doc shapes, drop Fetch/EVM/Cosmos content
```

### What we DO NOT copy

```
✗ CLI:  tokenize, buy, sell, holders, pay-to-mint, claim, alliance, marketing
✗ SDK:  agentlaunch, tokens, trading, onchain, commerce, market, delegation
✗ MCP:  custodial, trading, tokenize, commerce
✗ Move: bonding curve, Coin<Token>, linear-type token logic
✗ Docs: Fetch-specific growth, Agentverse HTTP, EVM/Cosmos wallet flows, bonding math
```

All of the above remain in agent-launch. We call them over HTTP.

---

## Target surfaces in ONE (what we copy onto)

| Surface | Source | ONE home | npm name |
|---|---|---|---|
| **CLI (merge target)** | `../ONE/cli/` | `cli/` in envelopes | `oneie` (bare) |
| **CLI DX patterns** | toolkit `packages/cli/src/{config,http,lib}` | `cli/src/lib/` | — |
| **SDK** | `src/engine/` + toolkit `{urls,storage,handoff,claude-context}` | new `packages/sdk/` | `@oneie/sdk` |
| **MCP** | toolkit `packages/mcp/` (shape only) | new `packages/mcp/` | `@oneie/mcp` |
| **Templates** | toolkit `packages/templates/` + `agents/**/*.md` | new `packages/templates/` | `@oneie/templates` |
| **Skill** | toolkit `skill/SKILL.md` | `.claude/skills/oneie.md` | — |
| **Wallet-auth** | already in `src/lib/sui.ts` | — | — (reused) |
| **Agent deploy** | already in `/deploy`, `/claw`, `nanoclaw/` | — | — (reused) |
| **Launch handoff** | NEW | `cli/src/commands/launch.ts` + `packages/sdk/src/launch.ts` | — |
| **Substrate verbs** | already in `src/engine/` | CLI + MCP wrappers | — |
| **Smoke tests** | toolkit `scripts/smoke-tests/` | `scripts/smoke-tests/` | — |

---

## Canonical verbs on `oneie`

Twelve substrate verbs + five deployment verbs + one handoff. Every verb maps to engine primitives or an existing ONE slash command.

```
# Substrate (wrap @oneie/sdk → src/engine)
oneie signal <receiver> [data...]       # L1 emit
oneie ask <receiver> [data...]          # L1 emit + wait (4 outcomes)
oneie mark <from> <to> [strength]       # L2 strengthen path
oneie warn <from> <to> [strength]       # L2 weaken path
oneie recall [match]                    # L6 query hypotheses
oneie reveal <uid>                      # memory card
oneie forget <uid>                      # GDPR erase
oneie frontier <uid>                    # L7 unexplored tags
oneie know                              # L6 promote highways
oneie highways [--limit N]              # top weighted paths
oneie fade [rate]                       # L3 decay
oneie select [type] [--explore]         # probabilistic route

# Deployment (extend existing)
oneie init                              # existing — scaffold project
oneie agent <name>                      # existing — create agent
oneie deploy                            # wraps /deploy
oneie claw <agent>                      # wraps /claw
oneie sync [agents|ontology|docs]       # existing — sync to TypeDB

# Handoff to agent-launch (the one cross-boundary call)
oneie launch <agent> [--name] [--supply]   # POST to agent-launch API
```

**Explicitly NOT on `oneie`:** `tokenize`, `buy`, `sell`, `holders`, `trade`, `claim`. Users who want those run `npx agentlaunch <verb>` after `oneie launch` — we link to it from `oneie launch --help`.

---

## The four waves (structural, not calendar)

### W1 — Recon (haiku agents, parallel)

```
agent-cli-live    scans ../ONE/cli/**                   → live CLI file map + extension points
agent-cli-dx      scans toolkit packages/cli/src/lib/** → DX patterns worth adopting (config, http, scaffolder)
agent-sdk         scans src/engine/** + toolkit sdk utils → SDK public surface
agent-mcp         scans toolkit packages/mcp/ (shape)    → tool router skeleton (no tokenize tools)
agent-templates   scans toolkit templates + agents/**    → preset merge plan
agent-launch-api  scans agent-launch HTTP endpoints      → request/response shapes for `launch`
agent-skill       scans toolkit skill/ + scripts/        → SKILL.md + smoke harness adoption
```

Each report must include:
- File list with line counts
- Public API surface (exports, commands, tools)
- What we keep, what we drop (tokenize/bonding code → dropped)
- Substrate equivalent if ONE already has it
- Tag list for downstream routing

### W2 — Decide (opus, one pass)

Merge reports → single `docs/TODO-copy-toolkit.md`. Each task gets `id`, `value`, `effort`, `phase`, `persona`, `blocks`, `exit`, `tags`, mapped to a dimension. Key decisions to lock:

1. **CLI merge strategy:** clone `../ONE/cli/` wholesale into `envelopes/cli/`, keep `oneie` pkg name, add verbs as new files in `src/commands/`. Preserve existing `init` + `agent` verbs.
2. **Monorepo shape:** `cli/` (root — keeps `oneie` as live npm) + `packages/{sdk,mcp,templates}` for new scoped packages. Root `package.json` workspaces field.
3. **Namespace:** `oneie` (CLI, bare — already published) vs `@oneie/sdk`, `@oneie/mcp`, `@oneie/templates` (new scoped). No `@one/*`.
4. **MCP shape:** expose substrate primitives directly (T1: 12 verbs). T2: discovery (scaffold, list, get). No T3 Sui tier — dropped; `launch` is a CLI-only verb.
5. **Launch handoff contract:** HTTP POST to agent-launch. Request: `{agent_uid, sui_address, name, symbol, supply, metadata}`. Response: `{token_id, tx_digest, launchpad_url}`. ONE emits `token-launched` signal on success.

### W3 — Edit (sonnet, parallel per task)

Execute W2 tasks. Each closes its loop: `/close <id>` on success, `--dissolved` if dependency missing, `--fail` if exit criteria miss.

### W4 — Verify (sonnet)

`bun run verify` + smoke each new surface:
- `oneie --help` runs, enumerates all verbs
- MCP server boots, each T1 verb returns a signal
- SDK `ask()` round-trip < 7s (per `reference_speed`)
- End-to-end: `oneie agent tutor && oneie deploy && oneie launch tutor --dry-run` returns a mock token_id from agent-launch's sandbox
- At least one agent scaffolded end-to-end: markdown → TypeDB → nanoclaw → Sui address → Telegram reply

Rubric >= 0.65 or loop repeats.

---

## Copy categories

### 1. Lift-and-shift (rename + rewire)
Substrate-agnostic TypeScript. From `../ONE/cli`: whole tree. From toolkit: `urls.ts`, `storage.ts`, `calculate.ts`, `claude-context.ts`, scaffolder logic, smoke-test harness, `config.ts`, `http.ts`.

### 2. Rewrite against substrate
Anything in the toolkit that talks to Agentverse HTTP. Becomes a `persist()` flow: signal → route via pheromone → mark/warn on outcome. The toolkit's `agents.ts`, `list.ts`, `status.ts`, `discovery.ts` collapse into substrate verbs we already have.

### 3. HTTP-bridge to agent-launch
**Only `launch`.** `packages/sdk/src/launch.ts` exports `launchToken(agent, opts)` that POSTs to agent-launch. `cli/src/commands/launch.ts` wraps it. On response, emit `token-launched` signal.

### 4. Drop
Token minting, bonding curve, buy/sell, holders, claim, alliance, marketing, EVM, Cosmos, BSC, Fetch-growth tactics, Agentverse HTTP shapes for anything other than the already-built bridge.

### 5. Already exists in ONE — extend, don't duplicate
`connect` ≈ `/claw`. `deploy` ≈ `/deploy`. `scaffold` ≈ `/create agent` + existing `oneie agent`. `pay` ≈ `/sync pay`. `status` ≈ `/see`. Haiku agent must flag these so W2 decides "wrap" vs "replace".

---

## Launch handoff — the one cross-boundary call

```typescript
// packages/sdk/src/launch.ts
export async function launchToken(agent: string, opts: LaunchOpts) {
  const unit = await recall({ subject: agent })
  const res = await fetch(`${AGENT_LAUNCH_URL}/v1/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-ONE-Agent': agent },
    body: JSON.stringify({
      agent_uid: unit.uid,
      sui_address: unit.sui_address,
      name: opts.name,
      symbol: opts.symbol,
      supply: opts.supply,
      metadata: { source: 'oneie', version: pkg.version }
    })
  })
  const { token_id, tx_digest, launchpad_url } = await res.json()
  await signal({ receiver: `substrate:token-launched`, data: {
    tags: ['token', 'launch', 'agent-launch'],
    content: { agent, token_id, tx_digest }
  }})
  return { token_id, tx_digest, launchpad_url }
}
```

Every launch deposits a signal. Pheromone on the `agent → token-launched` path accumulates. L4 revenue loop can later absorb trading fees via bridge if agent-launch streams them back — but that's a future optional, not part of this copy plan.

---

## Deterministic exit criteria

```
✓ 7 recon reports exist in docs/copy-reports/
✓ docs/TODO-copy-toolkit.md exists with ~35 tasks, every task tagged + dimensioned
✓ envelopes/cli/ merged from ../ONE/cli/, still publishes as `oneie`
✓ oneie --help enumerates 17 verbs (12 substrate + 5 deploy + launch-handoff)
✓ @oneie/mcp boots, ≥ 12 T1 verbs callable via claude mcp
✓ @oneie/sdk exports ask/signal/recall/launchToken, tested ≤ 7s
✓ @oneie/templates exports 15+ presets
✓ One agent scaffolded → deployed → `launch --dry-run` returns mock token_id
✓ 0 tokenize/buy/sell/holders/bonding-curve code in envelopes/
✓ All 320 existing tests still green; ≥ 15 new tests added
✓ docs/ dedupe: no new doc duplicates content in CLAUDE.md
```

---

## See Also

- `docs/TODO-template.md` — structure every new TODO must follow
- `docs/TODO-copy-toolkit.md` — the executable task graph
- `docs/DSL.md`, `docs/naming.md`, `src/schema/one.tql` — canonical vocab
- `docs/AUTONOMOUS_ORG.md` — how task graphs run on pheromone
- `../ONE/cli/README.md` — live CLI ground truth (merge target)
- `../ONE/cli/package.json` — `oneie` published manifest
- `../agent-launch-toolkit/docs/cli-reference.md` — CLI DX patterns (exclude mint verbs)
- `../agent-launch-toolkit/docs/mcp-tools.md` — MCP shape (exclude tokenize tools)
- `../agent-launch-toolkit/skill/SKILL.md` — skill shape
