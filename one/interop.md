# Interop Emission

**The artifacts ONE generates from the IR.**

From the [6-dimension ontology](one-ontology.md), ONE emits the artifacts the
2026 agent ecosystem expects to find. Each is a static file or typed endpoint
— never hand-authored.

## 1. AGENTS.md Symlinks (Repo Guidance)

**Where:** Repo root.
**What:** Single `AGENTS.md` file plus IDE-specific symlinks.

```bash
AGENTS.md                           # canonical
CLAUDE.md                           # → AGENTS.md
.github/copilot-instructions.md     # → AGENTS.md
.cursor/rules/main.mdc              # → AGENTS.md
.windsurfrules                      # → AGENTS.md
GEMINI.md                           # → AGENTS.md
.clinerules                         # → AGENTS.md
.junie/guidelines.md                # → AGENTS.md
```

**Covers:** Codex, Cursor, Copilot, Claude Code, Gemini CLI, Junie, Zed,
Aider, Windsurf, Devin, Factory, goose, Warp, Amp, Augment — ~20 tools
auto-discover.

**ONE command:** `oneie emit agents-md` creates the symlinks after verifying
the canonical target exists.

## 2. A2A Agent Card (Discovery)

**Where:** `/.well-known/agent-card.json` served from the agent's domain.
**What:** Machine-readable description for A2A clients.

Mapping from IR:

| Agent Card field | Source dimension | Source field |
|------------------|------------------|--------------|
| `name` | Actors | `unit.name` |
| `description` | Learning | `hypothesis.summary` or SKILL.md body |
| `provider.name` | Groups | `group.name` |
| `provider.organization` | Groups | `group.org` |
| `skills[]` | Paths | paths originating at the actor, tagged + exampled |
| `securitySchemes` | — | auth config; JWS-signed |
| `supportedInterfaces` | — | MCP endpoint URL + Agentverse handle |

**Why generate, never hand-author:** 10+ required fields, nested OAuth
schemes, JWS signature. One config source of truth (the IR) → one emitted
card. No drift.

**Path:** the current A2A spec uses `/.well-known/agent-card.json`. The
legacy `/.well-known/agent.json` path is deprecated — do not serve it.

**ONE command:** `oneie emit agent-card <actor-id>` writes the JSON and
optionally publishes to `/.well-known/` via the gateway.

## 3. MCP Manifest (Tool Layer)

**Where:** MCP server on Cloudflare Workers via Streamable HTTP.
**What:** Actor's `.on()` handlers exposed as MCP tools; Things exposed
as resources.

Mapping from IR:

| MCP element | Source dimension | Source field |
|-------------|------------------|--------------|
| Server identity | Actors | `unit.uid` |
| `tools[]` | Actors | each `.on(name, fn)` handler |
| Tool input schema | — | Zod from frontmatter `inputs` |
| Tool output schema | — | Zod from frontmatter `outputs` |
| `resources[]` | Things | skills + files linked to actor |
| `prompts[]` | Learning | SKILL.md bodies associated with actor |

**Server framework:** `@modelcontextprotocol/sdk` on Workers + Durable
Objects. One DO per actor for session state.

**Discovery stop-gap:** MCP's own `.well-known/mcp.json` is on the 2026
roadmap but not shipped. Until it lands, advertise the MCP endpoint inside
the A2A Agent Card's `supportedInterfaces`.

**ONE command:** `oneie emit mcp <actor-id>` wraps the handlers as an MCP
server and deploys to `mcp.<actor>.one.ie`.

## 4. Agentverse Registration (Fetch.ai Discovery)

**Where:** `POST https://agentverse.ai/v2/agents` + on-chain Almanac.
**What:** Fetch.ai-compatible agent record for ASI:One orchestrator.

Mapping from IR:

| Agentverse field | Source |
|------------------|--------|
| `address` | Actor's Sui-or-Fetch wallet address |
| `name` | `unit.name` |
| `readme` | Generated from AGENTS.md section + Learning |
| `chat_protocol_spec` | Required; Fetch Chat Protocol v0.3 emitted automatically |
| `mailbox` | `true` (always; we handle delivery) |
| `publish_agent_details` | `true` |

**No Python sidecar.** `agentverse-bridge.ts` (118 LOC, shipped 2026-04-18)
proxies AV agents as `av:*` units in the main world. Our agents register
via REST; we handle Chat Protocol messages natively in TS.

**ONE command:** `oneie launch <actor-id>` runs registration + sets webhook
+ verifies ASI:One discoverability.

## 5. Sui Identity (On-Chain Actor)

**Where:** Sui testnet (mainnet cutover pending).
**What:** Deterministic wallet + unit object + path mirror.

Mapping from IR:

| Sui object | Source dimension | Source field |
|------------|------------------|--------------|
| `Unit` | Actors | on-chain twin of `unit` |
| `Signal` | Events | every outbound signal from the actor |
| `Path` | Paths | edges with on-chain twin (strength persists) |
| Ed25519 keypair | — | `deriveKeypair(uid)` from `SUI_SEED + uid` |

**Phase 2 shipped 2026-04-18.** 14 tests pass: determinism + uniqueness +
idempotency. See [sui.md](sui.md) for keypair derivation and bridge details.

**ONE command:** `oneie agent <actor-id>` auto-derives the wallet. Explicit
on-chain registration via `oneie sui-register <actor-id>`.

## 6. x402 Payment Routes (Monetized Endpoints)

**Where:** HTTP 402 middleware on any unit endpoint with `skills[].price > 0`.
**What:** Chain/token-agnostic payment layer; facilitator abstracted.

Mapping from IR:

| x402 element | Source dimension | Source field |
|--------------|------------------|--------------|
| Paid route | Actors + Things | `skill.price > 0` on a `capability` |
| `X-PAYMENT` header | Events | inbound signal carries payment proof |
| Facilitator | — | Coinbase on Base initially; Cloudflare when available |
| Settlement | Paths | `mark()` on successful payment, revenue on path |

**ONE command:** `oneie emit x402 <actor-id>` wraps paid skills in
`x402-express` middleware, sets facilitator URL, writes Sui escrow address
for settlement.

Integrated with the substrate's L4 economic loop: every settled payment
becomes a path strength signal. Paths that earn, compound.

## What ONE Does NOT Emit

- **ERC-8004 registration.** Ethereum standard, Draft status. We're on Sui
  and won't emit unless a customer explicitly asks. See [sui.md](sui.md)
  for rationale.
- **`.prompty` files.** We align frontmatter keys; we don't emit the file.
- **CrewAI YAML / MS Agent Framework YAML.** Framework-locked; not part of
  the standard ecosystem.
- **POML / LMQL.** No demand.
- **IBM ACP.** Deprecated, merged into A2A 2025-09.

## The Full Emission Table

| Input | Output |
|-------|--------|
| `agents/alice.agent.md` | TypeDB unit + Actor entity |
| ↓ | `AGENTS.md` root + symlinks |
| ↓ | `/.well-known/agent-card.json` (A2A) |
| ↓ | `mcp.alice.one.ie` (MCP Streamable HTTP) |
| ↓ | Agentverse registration + ASI:One-visible |
| ↓ | Sui wallet + on-chain unit object |
| ↓ | x402-gated paid endpoints (if `skills[].price > 0`) |

**One source. Six destinations. Zero drift.**

## Permission Gates on Top

Every emission inherits the [ADL integration](adl-integration.md) gates:

1. **Lifecycle:** rejected signals to retired units return 410 Gone.
2. **Network:** sender host checked against receiver's `allowedHosts`.
3. **Sensitivity:** sender-vs-receiver sensitivity audit trail (non-blocking).

These gates sit between the IR and the runtime. An emitted Agent Card describes
capabilities; the gates enforce which callers can reach them.

## See Also

- [compile.md](compile.md) — the parser and IR that feeds emission
- [authoring.md](authoring.md) — what you write
- [standards.md](standards.md) — why we emit these and not others
- [sui.md](sui.md) — identity + payments detail
- [agentverse-bridge.md](agentverse-bridge.md) — the AV bridge internals
- [mcp-tools.md](mcp-tools.md) — MCP tool catalog
- [adl-integration.md](adl-integration.md) — permission gates on top of emissions
