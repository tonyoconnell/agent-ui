# The Compile Pipeline

**md → ONE IR → many artifacts.**

Every agent, capability, and team in ONE starts as Markdown. The parser lifts
frontmatter + body into the [6-dimension ontology](one-ontology.md). Emitters
fan out to every registry the 2026 ecosystem expects.

## Stages

```
  agents/**/AGENTS.md       ──┐
  agents/**/SKILL.md        ──┤
  agents/**/*.agent.md      ──┤ ─► gray-matter (frontmatter)
                               │    + remark (MDAST body)
                               │    + Zod (schema validation)
                               │         │
                               │         ▼
                               │    Parsed source objects
                               │         │
                               │         ▼
                               │    ONE IR (TypeDB, 6 dimensions)
                               │       Groups · Actors · Things
                               │       Paths · Events · Learning
                               │         │
  ┌────────────────────────────┴─────────┼─────────────────────────┐
  ▼            ▼            ▼            ▼            ▼            ▼
TypeDB     AGENTS.md   A2A Agent     MCP server  Agentverse    Sui wallet
unit       symlinks    Card (JSON)   manifest    registration  (derived)
(runtime)  (20 tools)  at /.well-    (tools +    (mailbox +    (address +
           auto-detect known/         resources)  chat-proto)   keypair)
```

## Dimension → Artifact Map

The six locked dimensions from [dictionary.md](dictionary.md) drive every emission:

| Dimension | Runtime name | Compiles to (external) |
|-----------|--------------|------------------------|
| **Groups** | `group` | A2A `provider.organization`, Agentverse business handle, Sui group object |
| **Actors** | `unit` | A2A `name` + `provider`, uAgent address, Sui wallet, MCP server identity |
| **Things** | `skill` (runtime) | MCP `resources`, tool argument schemas (JSON Schema from Zod) |
| **Paths** | `path` | A2A `skills[]` (with `tags` + `examples`), runtime routing weights |
| **Events** | `signal` | MCP `prompts` / notifications, A2A task state transitions, Chat Protocol messages |
| **Learning** | `hypothesis` | SKILL.md body, Agent Card `description`, AGENTS.md sections |

The mapping is the deliverable. It makes ONE the hub; every other format is a spoke.

## Where The Code Lives

| Stage | File | What |
|-------|------|------|
| Parse | `src/engine/agent-md.ts` | `parse(md) → AgentSpec` |
| Validate | *(pending)* `src/engine/agent-zod.ts` | Zod schema covering Prompty + SKILL.md frontmatter |
| Sync to IR | `src/engine/agent-md.ts` `syncAgent()` | Inserts into TypeDB as unit + skills + capability |
| Wire runtime | `src/engine/agent-md.ts` `wireAgent()` | Adds to World as executing unit |
| Emit Agent Card | *(pending)* `scripts/emit-agent-card.ts` | Writes `/.well-known/agent-card.json` |
| Emit MCP | *(pending)* `scripts/emit-mcp.ts` | Writes MCP manifest for tool-exposing units |
| Emit Agentverse | `nanoclaw/src/lib/agentverse.ts` | POST to `/v2/agents` |
| Derive Sui | `src/lib/sui.ts` `deriveKeypair(uid)` | Deterministic Ed25519 from `SUI_SEED + uid` |

**Shipped:** parse, IR sync, Agentverse bridge, Sui derivation.
**Pending:** Zod validation, Agent Card emission, MCP manifest emission.

## Compile Triggers

Three entry points; same IR destination:

1. **CLI:** `oneie agent ./path/to/alice.agent.md` — local dev.
2. **API:** `POST /api/agents/sync` with `{ markdown }` — programmatic.
3. **Batch:** `bun run scripts/sync-agents.ts` — scan `agents/**/*.md`.

After compile, `syncAgent()` runs idempotent TypeDB inserts. The agent is
live on the next [growth tick](loop.md).

## Idempotency Guarantees

Re-compile is always safe:

- **Unit inserts** use `match ... insert` with `not` guard on `uid` — never duplicates.
- **Skill entities** are keyed by `skill-id` (composite of `group:name`).
- **Capability relations** are upsert-by-pair `(provider, offered)`.
- **Sui wallet** is deterministic — same `SUI_SEED + uid` → same keypair forever.
- **Agent Card** is rewritten atomically at build time; no partial state.

This means `bun run scripts/sync-agents.ts` is safe in a pre-commit hook, a
CI step, or a TODO wave. Pheromone on existing paths is preserved.

## What Doesn't Compile

Source formats ONE does **not** parse:
- YAML-only formats (CrewAI `agents.yaml`, MS declarative YAML)
- Code-defined agents (DSPy, Mastra TS, OpenAI Agents SDK)
- `.prompty` files (we align keys but own our loader)

If a customer brings them, we convert at the boundary — never adopt as source.

## The Loop That Closes This

The pipeline participates in the substrate's [closed loop](patterns.md):

```
compile → mark() on success    (path `md:parse → typedb:sync` strengthens)
       → warn(1) on schema error (frontmatter invalid, body missing)
       → warn(0.5) on missing file (dissolved — user pointed at nothing)
       → neutral on timeout   (TypeDB slow, not the author's fault)
```

This is why compilation itself is a substrate unit (`unit('compiler')` in
`src/engine/agent-md.ts`). Routing learns which authors produce clean specs
and which produce failures.

## See Also

- [dictionary.md](dictionary.md) — canonical dimension names
- [one-ontology.md](one-ontology.md) — 6-dimension spec
- [authoring.md](authoring.md) — what you write
- [interop.md](interop.md) — what gets emitted
- [sui.md](sui.md) — Sui-specific emission details
- [routing.md](routing.md) — how the IR drives runtime routing
- [loop.md](loop.md) — the tick that moves signals across the IR
