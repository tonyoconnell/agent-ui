---
title: TODO — @oneie/mcp Feature Parity
type: roadmap
version: 0.1.0
priority: Wire lifecycle → Prove commerce → Grow observability
total_tasks: 25
completed: 0
status: PLANNED
---

# TODO: @oneie/mcp Feature Parity

> **Time units:** plan in **tasks → waves → cycles** only. Never days,
> hours, weeks, or sprints. (See `.claude/rules/engine.md` → Locked Rule 2.)
>
> **Parallelism directive:** every wave must fan out to the natural width
> of the work, in a **single message** with multiple tool calls.
> Sequential between waves, maximum parallel within waves.
>
> **Goal:** Every substrate operation that exists as an HTTP endpoint
> becomes a native MCP tool in `@oneie/mcp`, so a human using Claude Code
> / Cursor can drive the full lifecycle → commerce → learning flow in
> natural language without falling back to `curl`.
>
> **Source of truth:**
> [cli-reference.md](cli-reference.md) — the authoritative 17-verb surface the CLI already covers; MCP must match,
> [src/pages/api/CLAUDE.md](../src/pages/api/CLAUDE.md) — endpoint catalog grouped by the 6 dimensions,
> [DSL.md](one/DSL.md) — signal grammar every tool must speak,
> [dictionary.md](dictionary.md) — canonical names (match CLI verbs exactly),
> [rubrics.md](rubrics.md) — quality scoring for W4,
> [buy-and-sell.md](buy-and-sell.md) — commerce tools this TODO adds (pay, hire, bounty, escrow),
> [tutorial-assisted.md](tutorial-assisted.md) — the human+agent tutorial whose `curl` fallbacks this TODO eliminates.
>
> **Shape:** 3 cycles, four waves each. Haiku reads endpoint contracts,
> Opus decides tool surface, Sonnet writes wrappers + schemas, Sonnet
> verifies. Same loop as the substrate.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1–W4), `task-context` (doc keys), `blocks` relation. Each
> new MCP tool creates a matching `skill` on `oneie-mcp:<tool>`.

---

## Why this TODO exists

`docs/tutorial-assisted.md` (commit `e004578`) documented the concrete
gap: **`@oneie/mcp@0.1.0` exposes 12 substrate + 3 template tools (15
total), but readers must drop to `curl` for identity, publish,
skill-discovery, and payment** — the four load-bearing lifecycle steps.
Every subsequent user of Claude Code + ONE hits the same wall. This TODO
closes it.

Beyond the 5 lifecycle tools, two adjacent cliffs:

- **Commerce** — claw deploy, commend/flag, capability publish, hire/bounty. The marketplace isn't MCP-native.
- **Observability** — stats, revenue, health, global frontiers, intent learning. Power users can't ask "how's the substrate doing?" without curl.

Closing all three cliffs = ~25 new tools.

---

## Current state (verified from `packages/mcp/src/`)

### Existing tools (15)

| Bundle | Tool | Endpoint | Source |
|---|---|---|---|
| substrate | `signal` | `POST /api/signal` | `tools/substrate.ts:18` |
| substrate | `ask` | `POST /api/ask` | `tools/substrate.ts:28` |
| substrate | `mark` | `POST /api/loop/mark-dims` | `tools/substrate.ts:38` |
| substrate | `warn` | `POST /api/loop/mark-dims` (neg) | `tools/substrate.ts:48` |
| substrate | `fade` | `POST /api/decay-cycle` | `tools/substrate.ts:58` |
| substrate | `select` | `GET /api/loop/stage` | `tools/substrate.ts:65` |
| substrate | `recall` | `GET /api/hypotheses` | `tools/substrate.ts:76` |
| substrate | `reveal` | `GET /api/memory/reveal/:uid` | `tools/substrate.ts:87` |
| substrate | `forget` | `DELETE /api/memory/forget/:uid` | `tools/substrate.ts:93` |
| substrate | `frontier` | `GET /api/memory/frontier/:uid` | `tools/substrate.ts:100` |
| substrate | `know` | `POST /api/tick?loops=L6` | `tools/substrate.ts:107` |
| substrate | `highways` | `GET /api/loop/highways` | `tools/substrate.ts:117` |
| discovery | `scaffold_agent` | `@oneie/templates` (local) | `tools/discovery.ts:5` |
| discovery | `list_agents` | `@oneie/templates` (local) | `tools/discovery.ts:20` |
| discovery | `get_agent` | `@oneie/templates` (local) | `tools/discovery.ts:29` |

---

## Cycle 1 — WIRE: Lifecycle (5 tools)

Unblocks the assisted tutorial's `curl` fallbacks.

### Cycle 1 Deliverables

| # | Deliverable | Endpoint | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|---|---|---|---|---|
| 1 | `auth_agent` | `POST /api/auth/agent` | 0.40/0.20/0.30/0.10 | returns uid+wallet+apiKey via stdio | `oneie-mcp:auth_agent` |
| 2 | `sync_agent` | `POST /api/agents/sync` | 0.40/0.15/0.35/0.10 | {markdown} → {ok, uid, wallet, skills} | `oneie-mcp:sync_agent` |
| 3 | `discover_skill` | `GET /api/agents/discover?skill=X` | 0.35/0.20/0.35/0.10 | {skill: "copy"} returns ranked list | `oneie-mcp:discover_skill` |
| 4 | `register` | `POST /api/agents/register` | 0.35/0.20/0.35/0.10 | {uid, capabilities} → {ok} | `oneie-mcp:register` |
| 5 | `pay` | `POST /api/pay` | 0.40/0.15/0.40/0.05 | {from, to, task, amount} → {ok, sui?} | `oneie-mcp:pay` |

### Cycle 1 Waves

**W1 — Recon (Haiku × 5, parallel)** — one agent per endpoint. Read the route, document body shape in, response shape out, auth requirements, known error cases. Report ≤ 300 words with `file:line` citations.

| Agent | Target |
|---|---|
| R1 | `src/pages/api/auth/agent.ts` |
| R2 | `src/pages/api/agents/sync.ts` |
| R3 | `src/pages/api/agents/discover.ts` |
| R4 | `src/pages/api/agents/register.ts` |
| R5 | `src/pages/api/pay.ts` |

**W2 — Decide (Opus × 1)** — 5 findings fit one context. Produce tool spec per endpoint: name (matching CLI verb), inputSchema (JSON Schema), handler body (single `apiCall`), `index.ts` registration. Decide file location: new `tools/lifecycle.ts` vs merging into `substrate.ts`. Recommend lifecycle.ts for semantic clarity.

**W3 — Edit (Sonnet × 3, parallel by file)**

| Job | File | Edits |
|---|---|---|
| E1 | `packages/mcp/src/tools/lifecycle.ts` | create, 5 tools |
| E2 | `packages/mcp/src/index.ts` | export + `MCP_TOOLS.lifecycle` + register |
| E3 | `packages/mcp/README.md` | document 5 new tools |

**W4 — Verify (Sonnet × 3, parallel by check type)**

| Shard | Owns |
|---|---|
| V1 | `cd packages/mcp && bun run build` clean; tsc passes |
| V2 | Each tool callable via stdio: `echo '{"jsonrpc":"2.0",...}' \| npx @oneie/mcp` returns expected shape |
| V3 | `docs/tutorial-assisted.md` updated — remove curl fallback for these 5 |

**Cycle 1 Gate**

```bash
# Tool count: was 15, should be 20
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx @oneie/mcp | jq '.result.tools | length'
# 20

# No curl fallback in tutorial-assisted.md for these operations
grep -c "curl.*auth/agent\|curl.*agents/sync\|curl.*discover\|curl.*register\|curl.*api/pay" docs/tutorial-assisted.md
# 0
```

---

## Cycle 2 — PROVE: Commerce + Governance (10 tools)

Depends on Cycle 1 (identity + sync must work before commerce).

### Cycle 2 Deliverables

| # | Deliverable | Endpoint | Rubric | Skill |
|---|---|---|---|---|
| 6 | `claw` | `POST /api/claw` | 0.35/0.20/0.35/0.10 | `oneie-mcp:claw` |
| 7 | `commend` | `POST /api/agents/:id/commend` | 0.35/0.20/0.35/0.10 | `oneie-mcp:commend` |
| 8 | `flag` | `POST /api/agents/:id/flag` | 0.35/0.20/0.35/0.10 | `oneie-mcp:flag` |
| 9 | `status` | `POST /api/agents/:id/status` | 0.30/0.20/0.40/0.10 | `oneie-mcp:status` |
| 10 | `capabilities_list` | `GET /api/agents/:id/capabilities` | 0.35/0.20/0.35/0.10 | `oneie-mcp:capabilities_list` |
| 11 | `capabilities_publish` | `POST /api/capabilities/publish` | 0.35/0.20/0.35/0.10 | `oneie-mcp:capabilities_publish` |
| 12 | `hire` | `POST /api/buy/hire` | 0.40/0.15/0.35/0.10 | `oneie-mcp:hire` |
| 13 | `bounty` | `POST /api/buy/bounty` | 0.35/0.20/0.35/0.10 | `oneie-mcp:bounty` |
| 14 | `escrow_create` | `POST /api/escrow/create` | 0.40/0.15/0.40/0.05 | `oneie-mcp:escrow_create` |
| 15 | `harden` | `POST /api/harden` | 0.35/0.20/0.35/0.10 | `oneie-mcp:harden` |

### Cycle 2 Waves

**W1 — Recon (Haiku × 10, parallel)** — same pattern as Cycle 1, one agent per endpoint.

**W2 — Decide (Opus × 2 shards)** — 10 findings exceed the one-shard threshold. Shard by category: owner-side tools (claw, status, capabilities_publish, bounty, hire, escrow_create, harden) and reputation-side tools (commend, flag, capabilities_list).

**W3 — Edit (Sonnet × 3)**

| Job | File | Edits |
|---|---|---|
| E1 | `packages/mcp/src/tools/commerce.ts` | create, 10 tools |
| E2 | `packages/mcp/src/index.ts` | register |
| E3 | `packages/mcp/README.md` | document commerce bundle |

**W4 — Verify (Sonnet × 3)** — same three shards + cross-reference against `buy-and-sell.md` § Four Steps.

**Cycle 2 Gate** — the marketplace flow (list → discover → hire → settle → commend) runs end-to-end via MCP tools only. Tool count: 20 → 30.

---

## Cycle 3 — GROW: Observability + Ingestion (10 tools)

Depends on Cycle 2 (commerce must work before we measure it).

### Cycle 3 Deliverables

| # | Deliverable | Endpoint | Rubric | Skill |
|---|---|---|---|---|
| 16 | `stats` | `GET /api/stats` | 0.30/0.20/0.40/0.10 | `oneie-mcp:stats` |
| 17 | `health` | `GET /api/health` | 0.30/0.20/0.40/0.10 | `oneie-mcp:health` |
| 18 | `revenue` | `GET /api/revenue` | 0.35/0.20/0.35/0.10 | `oneie-mcp:revenue` |
| 19 | `frontiers_global` | `GET /api/frontiers` | 0.35/0.20/0.35/0.10 | `oneie-mcp:frontiers_global` |
| 20 | `hypotheses_global` | `GET /api/hypotheses` | 0.30/0.20/0.40/0.10 | `oneie-mcp:hypotheses_global` |
| 21 | `export_units` | `GET /api/export/units` | 0.25/0.25/0.40/0.10 | `oneie-mcp:export_units` |
| 22 | `export_highways` | `GET /api/export/highways` | 0.25/0.25/0.40/0.10 | `oneie-mcp:export_highways` |
| 23 | `intent_learn` | `POST /api/intents/learn` | 0.40/0.15/0.35/0.10 | `oneie-mcp:intent_learn` |
| 24 | `ingest_event` | `POST /api/ingest/:kind` | 0.40/0.15/0.35/0.10 | `oneie-mcp:ingest_event` |
| 25 | `chat_turn` | `POST /api/chat/turn` | 0.40/0.20/0.30/0.10 | `oneie-mcp:chat_turn` |

### Cycle 3 Waves

**W1** — Haiku × 10 per endpoint.
**W2** — Opus × 2 shards: measurement (stats, health, revenue, exports, globals) vs. action (intent_learn, ingest_event, chat_turn).
**W3** — Sonnet × 3: `tools/observability.ts` + `index.ts` + README.
**W4** — Sonnet × 3 + a fourth check: full `tutorial-assisted.md` can be rewritten with zero `curl` calls. When that's true, Cycle 3 is done.

**Cycle 3 Gate** — 40 tools total; assisted tutorial has zero curl fallbacks anywhere.

---

## Routing

```
    signal DOWN                     result UP            feedback UP
    ──────────                      ─────────            ───────────
    /do TODO-mcp.md                 result + 4 tagged    tagged strength
         │                          marks                signal → substrate
         ▼                               │                    ▲
    ┌─────────┐                          │                    │
    │  W1     │  Haiku × N per cycle    │ mark(fit)           │
    │  recon  │  → endpoint contracts    │ mark(form)          │
    └────┬────┘                          │ mark(truth)         │
         │ findings                      │ mark(taste)         │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W2     │  Opus shard(s)           │                    │
    │  design │  → tool spec per endpt   │                    │
    └────┬────┘                          │                    │
         │                               │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W3     │  Sonnet × 3 files        │                    │
    │  write  │  → ts + index + README   │                    │
    └────┬────┘                          │                    │
         │                               │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W4     │  Sonnet × 3 checks ──────┘                    │
    │  verify │  → build + stdio + docs                        │
    │         │  → feedback signal ─────────────────────────►─┘
    └─────────┘    tags: ['mcp', 'lifecycle'|'commerce'|'obs']
                   strength: rubricAvg
```

---

## Canonical decisions (loaded in every W2)

| Item | Canonical | Exceptions |
|------|-----------|------------|
| tool name | match CLI verb exactly (`pay` not `payment`, `hire` not `hire_agent`) | none — divergence is a rename tax |
| wrapper style | single `apiCall(env.baseUrl, env.apiKey, path, init)` per handler | streaming endpoints (chat stream) use SSE handler |
| inputSchema | JSON Schema draft-07, `required` array explicit | optional args omitted from `required` |
| description | one sentence, imperative ("Emit a signal into the substrate.") | no emoji, no prose |
| file location | lifecycle → `lifecycle.ts`, commerce → `commerce.ts`, observability → `observability.ts` | merge only if a file drops below 3 tools |

---

## Testing — The Deterministic Sandwich

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    cd packages/mcp                    cd packages/mcp
    bun install                        bun run build        (compiles clean)
    bun run build                       tsc --noEmit         (no TS errors)
    stdio: list tools → 15/20/30        stdio: list tools → 20/30/40
```

### Cycle Gate checklist (run after every cycle)

- [ ] `bun run build` clean in packages/mcp
- [ ] `tsc --noEmit` passes
- [ ] Tool count matches expected (20 / 30 / 40 per cycle)
- [ ] Every new tool has a stdio smoke-call that returns a non-error response
- [ ] `docs/tutorial-assisted.md` has zero `curl` references for operations in this cycle's scope

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Share |
|-------|------|--------|-------|-------|
| 1 | W1 | 5 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~15% |
| 1 | W3 | 3 | Sonnet | ~10% |
| 1 | W4 | 3 | Sonnet | ~10% |
| 2 | W1 | 10 | Haiku | ~5% |
| 2 | W2 | 2 | Opus | ~20% |
| 2 | W3 | 3 | Sonnet | ~10% |
| 2 | W4 | 3 | Sonnet | ~10% |
| 3 | W1 | 10 | Haiku | ~5% |
| 3 | W2 | 2 | Opus | ~15% |
| 3 | W3 | 3 | Sonnet | ~10% |
| 3 | W4 | 3 | Sonnet | ~10% |

Hard stop: any W4 looping more than 3 times → halt, escalate.

---

## Status

- [x] **Cycle 1: WIRE — Lifecycle (5 tools)**
  - [x] W1 — Recon (Haiku × 5, one per endpoint)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 3, one per file)
  - [x] W4 — Verify (Sonnet × 3, by check type)
- [x] **Cycle 2: PROVE — Commerce (10 tools)**
  - [x] W1 — Recon (Haiku × 10, one per endpoint)
  - [x] W2 — Decide (Opus × 2 shards)
  - [x] W3 — Edits (Sonnet × 3, one per file)
  - [x] W4 — Verify (Sonnet × 3, by check type)
- [x] **Cycle 3: GROW — Observability (10 tools)**
  - [x] W1 — Recon (Haiku × 10, one per endpoint)
  - [x] W2 — Decide (Opus × 2 shards)
  - [x] W3 — Edits (Sonnet × 3, one per file)
  - [x] W4 — Verify (Sonnet × 3, by check type)

---

## Execution

```bash
/do docs/TODO-mcp.md              # advance the next wave
/do docs/TODO-mcp.md --auto       # run W1→W4 continuously until a cycle completes
```

After each cycle, publish the new MCP version:

```bash
cd packages/mcp
npm version minor                  # 0.1.0 → 0.2.0 (Cycle 1), 0.3.0 (Cycle 2), 0.4.0 (Cycle 3)
npm publish
```

---

## The shape of the finished surface

After all three cycles, `@oneie/mcp@0.4.0` ships with **40 native tools**
across six bundles:

| Bundle | Tools | Concerns |
|---|---|---|
| runtime (12 existing) | signal, ask, mark, warn, fade, select, recall, reveal, forget, frontier, know, highways | event / path / memory operations |
| lifecycle (+5) | auth_agent, sync_agent, discover_skill, register, pay | identity, publish, marketplace entry |
| commerce (+10) | claw, commend, flag, status, capabilities_list, capabilities_publish, hire, bounty, escrow_create, harden | marketplace, governance, hardening |
| observability (+10) | stats, health, revenue, frontiers_global, hypotheses_global, export_units, export_highways, intent_learn, ingest_event, chat_turn | measurement + ingestion |
| templates (3 existing) | scaffold_agent, list_agents, get_agent | offline template generation |

Every CLI verb in `cli-reference.md` has a matching MCP tool.

---

## Out of scope (deliberately)

These endpoints exist but are **not** MCP tool candidates — they stay
CLI- or HTTP-only for safety or surface reasons:

| Endpoint | Why excluded |
|---|---|
| `POST /api/query` | Raw TypeQL; too easy to DoS or leak data through LLM-generated queries |
| `POST /api/tick` | Runtime orchestration; should run on its schedule, not user-triggered |
| `POST /api/tasks/*` | Execution queue — belongs to the wave runner, not end users |
| `POST /api/absorb` | Sui event poller — infrastructure, not user-facing |
| `POST /api/auth/api-keys` | Key rotation belongs in the dashboard, not an LLM |
| `POST /api/intents/seed` | Bulk-seed operation, CI-only |
| `POST /api/faucet-internal` | Internal testnet fund; not end-user |
| `src/pages/api/g/[gid]/*` | Group-scoped operations; tool must carry gid — reconsider in v0.5.0 |
| `src/pages/api/waves/*` | Wave execution control; internal |

Lines drawn on safety + surface area + audience.

---

## Upstream follow-ups

Each MCP wrapper forces a re-read of the underlying endpoint — which may
surface drift between contract and implementation (same pattern as the
agent tutorial audit uncovering bugs #3, #4, #2a + three idempotency
bugs). Expected:

1. **`sync_agent`** — verify the idempotency fixes work under MCP's batched calls (repeated sync_agent → no `@unique` collision).
2. **`discover_skill`** — should surface that the three-stage planner workaround (commit `2bb8fed`) holds under MCP's invocation pattern.
3. **`pay`** — may surface that Sui settlement is dormant on localhost (`sui: null`); document explicitly in tool description.
4. **`commend` / `flag`** — may surface that governance role checks reject `agent`-tier API keys. Document the permission tier in each tool.
5. **`ingest_event`** — verify whether `ingest/email` / `ingest/stripe` / `ingest/analytics` / `ingest/rating` handlers are fully implemented.

Each is a **good outcome** — drift caught early at the doc-building layer.

---

## See Also

- [cli-reference.md](cli-reference.md) — CLI surface MCP mirrors
- [tutorial-assisted.md](tutorial-assisted.md) — consumer doc this TODO unblocks
- [src/pages/api/CLAUDE.md](../src/pages/api/CLAUDE.md) — endpoint catalog
- [packages/mcp/README.md](../packages/mcp/README.md) — package consumer docs (updated per cycle)
- [DSL.md](one/DSL.md) — signal grammar (loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring (loaded in W2)
- [TODO-template.md](one/TODO-template.md) — template this doc follows
- [loop-close.md](loop-close.md) — cycle close protocol

---

*3 cycles. 25 tools. Four waves each. When done, every CLI verb has a native MCP tool and every `curl` in the human+agent tutorial collapses to a natural-language prompt.*
