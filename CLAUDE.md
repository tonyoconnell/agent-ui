# ONE

Signal-based world for AI agents. 670 lines of engine. Zero returns.
The LLM is the only probabilistic component. Everything else is math.

**Ontology:** `src/schema/one.tql` — 100 lines, 6 dimensions, stable forever.
**Naming:** `docs/dictionary.md` — canonical names, retired names, never rename again.
**System context:** `CONTEXT.md` — real purpose, core abstractions, key workflows, design decisions, failure modes. Complementary to this file: CLAUDE.md defines what to do, CONTEXT.md explains why.

**Environments:**
- **Dev (live):** `dev.one.ie` — Astro Worker, every `main` deploy
- **Production (planned):** `one.ie` — custom-domain cutover pending
- **Gateway (live):** `api.one.ie` — TypeDB proxy + WsHub DO (stable across envs)
- **Edge (live):** `nanoclaw.oneie.workers.dev` — channel bots
- **Legacy idle:** `one-substrate.pages.dev` — paused Pages project, rollback only (do not deploy)
**Brain:** TypeDB Cloud (19 units, 18 skills, 19 functions)
**LLM:** All models via [OpenRouter](https://openrouter.ai) — default: `meta-llama/llama-4-maverick` (1M ctx, $0.15/M tokens)
**Bots:** @onedotbot (ONE assistant) · donal-claw (OO Marketing CMO)

## The 6 Dimensions (LOCKED)

| # | Dimension | Ontology (`one.tql`) | Runtime (`world.ts`) | Move (`one.move`)           | What |
|---|-----------|----------------------|----------------------|------------------------------|------|
| 1 | **Groups**   | `group`        | `group`        | `Colony` ⚠                    | Containers — worlds, teams, orgs |
| 2 | **Actors**   | `actor`        | `unit`         | `Unit`                        | Who acts — humans, agents, animals, worlds |
| 3 | **Things**   | `thing`        | `skill`        | — *(TQL-only)*                | What exists — skills, tasks, tokens |
| 4 | **Paths**    | `path`         | `path`         | `Path` → `Highway` on harden  | Weighted connections — strength, resistance |
| 5 | **Events**   | `signal`       | `signal`       | `Signal`                      | What happened — signals, payments |
| 6 | **Learning** | `hypothesis`   | `hypothesis`   | — *(TQL-only)*                | What was discovered — patterns |

Three of six dimensions have on-chain twins (economic, permanent). Two (Things, Learning) live only in TypeDB because they're classification/learning surfaces where writes are cheap and speculative. Move-only structs without a dimension: `Escrow` (settlement machinery), `Protocol` (treasury, fee_bps). Full bridge contract: `/sui` + `/typedb` skills.

**⚠ Colony → Group is a pending rename.** Move still has `struct Colony` (one.move:71); renaming requires a package upgrade, so TypeDB moved first. Read Move `Colony` as TQL `group` when bridging.

**Dead names (never use):** knowledge, connections, people, node, scent, alarm, trail, colony (as dimension)

## Quick Start

```bash
bun run dev      # Start dev server (localhost:4321)
bun run build    # Production build
/deploy          # Deploy all services (Gateway + Sync + NanoClaw + Workers)
```

### Dev server logs (Claude: read these to debug)

When Claude restarts the dev server it runs detached and pipes both streams to
**`/tmp/astro-dev.log`**. SSR `console.log`, Vite errors, page redirect
traces, API handler logs — all land here.

**Rule for Claude:** after the user reproduces an issue in the browser, look
at the **most recent** lines, not the whole file. The interesting events are
always at the tail.

```bash
tail -n 80 /tmp/astro-dev.log                                  # last 80 lines (default)
tail -f /tmp/astro-dev.log                                     # follow live
grep -E "\[/in\]|error|warn" /tmp/astro-dev.log | tail -50     # filter then tail

nohup npx --no-install astro dev > /tmp/astro-dev.log 2>&1 &   # restart pattern
```

`bun run dev` currently fails on this machine (`require is not defined` in
`react-dom/server.edge.js` under bun's SSR runner) — use `npx astro dev` until
that's resolved.

## Tunnels (Dev)

```bash
bun run tunnel         # Quick tunnel → random-slug.trycloudflare.com
bun run tunnel:local   # Named tunnel → local.one.ie → localhost:4321
bun run tunnel:main    # Named tunnel → main.one.ie → localhost:4321
```

| URL | Purpose | Command |
|-----|---------|---------|
| `local.one.ie` | Personal dev, webhook testing | `bun run tunnel:local` |
| `main.one.ie` | Main branch preview (until one.ie migrates) | `bun run tunnel:main` |
| `dev.one.ie` | **Dev environment (live)** — CF Workers Static Assets (`one-substrate`), deployed from `main` | — |
| `one.ie` | **Production (planned)** — custom-domain cutover pending; when live, routes to the same `one-substrate` Worker (or a `[env.production]` variant) | — |

See `docs/PLAN-tunnels.md` for setup details. Tunnels expose localhost through Cloudflare
for webhook testing (Telegram, Discord) without ngrok.

## Architecture

Two dictionaries. Arithmetic. One probabilistic step.

```
NERVOUS SYSTEM (runtime 670 lines)     BRAIN (TypeDB ~300 lines)

signal → unit → handler → result       paths persist (strength, resistance)
  → auto-reply → mark/warn             units persist (model, prompt, gen)
  → .then() → continuation             signals logged (event history)
  → fade → select → drain              skills + tags (classification)
  → ask → { result | timeout | dissolved }  learning (hypotheses, frontiers)

loops L1-L3 (ms to min)               loops L4-L7 (hours to weeks)
```

### The Deterministic Sandwich

Every LLM call is wrapped in deterministic checks:

```
PRE:   isToxic(edge)? → dissolve (no LLM call, no cost)
PRE:   capability exists? → TypeDB lookup → dissolve
LLM:   generates response (the one probabilistic step)
POST:  result? → mark(). timeout? → neutral. dissolved? → mild warn.
```

The LLM bootstraps the group. The group replaces the LLM. Security and
learning are the same mechanism: warn() is simultaneously a firewall and a lesson.

### Seven Loops

```
L1 SIGNAL     per message     signal → ask → outcome
L2 TRAIL      per outcome     mark/warn → strength/resistance accumulates
L3 FADE       every 5 min     asymmetric decay (resistance forgives 2x faster)
L4 ECONOMIC   per payment     revenue on paths (capability price) — all 5 blockers unblocked (2026-04-18)
L5 EVOLUTION  every 10 min    rewrite struggling agent prompts (24h cooldown) + emit :success signal to treasury
L6 KNOWLEDGE  every hour      know highways + auto-hypothesize + fire reflexes on confirmed patterns
L7 FRONTIER   every hour      detect unexplored tag clusters + hypothesis reflex chain closes learning loop
L8 SURFACES   per deploy      verify SEO/a11y/meta tags on live site (non-blocking)
```

**L4-L7 Integration Status (2026-04-18):**
- **L4 blockers:** Memory pricing gates ✅ · L5 signals ✅ · Toxicity exposure ✅ · Revenue feedback ✅ · Treasury fee ✅
- **L6-L7 C2:** Hypothesis reflexes ✅ (confirmed patterns auto-warn toxic paths, 12/12 tests)
- **Escrow settlement:** 50 bps protocol fee, Phase 3 W2 decisions locked, ready for W3-W4 implementation

### Four Outcome Types

```
{ result: X }        Success. mark(). Chain strengthens with depth.
{ timeout: true }    Slow, not bad. Neutral. Chain continues.
{ dissolved: true }  Missing unit/capability. Mild warn(0.5). Chain breaks.
(no result)          Failure. Full warn(1). Chain breaks.
```

## Core Concepts

### Signal
```typescript
type Signal = { receiver: string; data?: unknown; after?: number }
// data convention: { tags?: string[], weight?: number, content?: unknown }
```
The universal primitive. Receiver is `"unit"` or `"unit:skill"`.

### Unit
```typescript
unit(id, route?)
  .on(name, fn)           // define handler (task)
  .then(name, template)   // define continuation (dependency)
  .role(name, task, ctx)  // context-bound handler
```
Task signature: `(data, emit, ctx) => result`
Auto-reply: if signal has `replyTo`, result goes back automatically.

### World
```typescript
world()
  .add(id)                // create unit (drains queued signals)
  .remove(id)             // remove unit (paths remain, fade naturally)
  .signal(signal, from?)  // route signal, auto-mark pheromone
  .ask(signal, from?)     // signal + wait → { result | timeout | dissolved }
  .enqueue(signal)        // queue for later (priority-ordered drain)
  .drain()                // process highest-priority queued signal
  .mark(edge, strength?)  // strengthen path
  .warn(edge, strength?)  // weaken path
  .select(type?, explore?) // probabilistic routing (weighted by strength - resistance)
  .follow(type)           // deterministic routing (strongest path)
  .fade(rate?)            // asymmetric decay
  .highways(limit?)       // top weighted paths
```

### Persist
```typescript
persist()
  .actor(id, kind?, opts?)  // add + persist to TypeDB
  .flow(from, to)           // mark/warn wrapper
  .signal(s, from?)         // pre-checked: toxic → dissolve
  .ask(s, from?)            // pre-checked: toxic + capability → dissolve
  .open(n?)                 // top paths as {from, to, strength}
  .blocked()                // toxic paths
  .know()                   // promote highways to permanent learning (source="observed")
  .recall(match?)           // query hypotheses (string or {subject?,at?} bi-temporal)
  .hasPathRelationship(uid, from, to) // pheromone gate: did uid participate in this edge?
  .reveal(uid)              // full MemoryCard: actor+hypotheses+highways+signals+groups+capabilities+frontier
  .forget(uid)              // GDPR erasure: delete all TypeDB records + cascade + fade cleanup
  .frontier(uid)            // unexplored tag clusters: world tags minus actor-touched tags
  .load()                   // hydrate pheromone + queue from TypeDB
  .sync()                   // write all state to TypeDB
```

**Memory API routes:** `GET /api/memory/reveal/:uid` · `DELETE /api/memory/forget/:uid` · `GET /api/memory/frontier/:uid`

**Signal scope:** `private | group | public` — private signals never surface in group queries or `know()`.
**Hypothesis source:** `observed | asserted | verified` — asserted confidence capped at 0.30 until corroborated.

**Governance & Memory (locked 2026-04-18):** Permission = Role × Pheromone. No ACL table — the graph IS the security model.
- **Roles on membership:** `chairman` (all) · `board` (read-only) · `ceo` (hire/fire/tune) · `operator` (add/mark) · `agent` (own paths) · `auditor` (read-only)
- **Memory actions (C4):** `read_memory` (board+) · `delete_memory` (operator+) · `discover` (all)
- **Identity on actor:** `wallet` (Sui address) · `auth-hash` (bcrypt API key hash)
- **Scope on path/hypothesis:** `private` (sender+receiver) · `group` (members) · `public` (cross-org, Sui-hardenable)
- **Memory routes (GDPR):** `GET /api/memory/reveal/:uid` (read-memory) · `DELETE /api/memory/forget/:uid` (delete-memory, audit logged) · `GET /api/memory/frontier/:uid` (discover)
- **Federation:** `recall({federated: true})` filters scope (excludes private hypotheses from other worlds)
- **Key functions:** `roleCheck(role, action)` in `src/lib/role-check.ts` · `getRoleForUser(uid)` in `src/lib/api-auth.ts` · `hasPathRelationship(uid, from, to)` in `src/engine/persist.ts`
- **Governance UI:** `/ceo` (CEOPanel) · `/board` (BoardPanel, read-only) · `/chairman` (blocked, needs config API)

**Agent Credential Lifecycle (2026-04-20):**
- **Mint:** `POST /api/auth/agent` → `{uid, apiKey, wallet}`. First call is open. Re-mint requires proof (bearer or chairman).
- **Claim:** `POST /api/auth/agent/:uid/claim` — human cookie + agent bearer → lazy-creates `g:owns:{uid}` ownership group (group-type: "owns"), human becomes `chairman`, bootstrap key revoked, scoped key minted. Key shown once.
- **Remint gate:** `AUTH_AGENT_REMINT_MODE=audit` (log only) · `enforce` (403 without proof). Proof = possession (bearer.user === uid) OR ownership (chairman in `g:owns:{uid}`).
- **Human uid:** `deriveHumanUid({id, email})` → `"human:{slug}"` where slug is email local-part with non-alphanumeric → hyphens.
- **Sign-in options:** password (Better Auth) · Sui wallet SIWE (`suiWallet()` plugin) · Google zkLogin (`zkLogin()` plugin → Sui address).
- **Cache invalidation:** `invalidateKeyCache(keyId)` — evicts from `KEY_CACHE` via secondary `KEYID_TO_BEARER` map on key revoke.

### Tags
Flat labels on skills and units. No hierarchy. Filter with `?tag=build&tag=P0`.
```typeql
insert $s isa skill, has skill-id "api", has name "Build API",
  has tag "build", has tag "wire", has tag "P0";
```

## Agent Markdown → TypeDB

**Agents are markdown files. TypeDB is the brain. The template deploys to Cloudflare free.**

### The Format

```markdown
---
name: creative
model: claude-sonnet-4-20250514
channels: [telegram, discord]
group: marketing
skills:
  - name: copy
    price: 0.02
    tags: [creative, copy, headlines]
  - name: iterate
    price: 0.02
    tags: [creative, iteration]
sensitivity: 0.6
---

You are the Creative Director...
```

### Markdown → TypeDB

```typescript
import { parse, syncAgent, toTypeDB } from '@/engine'

// Parse markdown
const spec = parse(markdown)

// Generate TypeDB queries
const queries = toTypeDB(spec)  // Returns insert statements

// Sync to TypeDB
await syncAgent(spec)  // Executes inserts
```

### What Gets Created in TypeDB

```tql
# Unit
insert $u isa unit,
  has uid "marketing:creative",
  has name "creative",
  has model "claude-sonnet-4-20250514",
  has system-prompt "You are the Creative Director...",
  has tag "marketing";

# Skills
insert $s isa skill, has skill-id "marketing:copy", has price 0.02, has tag "creative";

# Capability (unit can do skill)
insert (provider: $u, offered: $s) isa capability, has price 0.02;

# Group membership
insert (group: $g, member: $u) isa membership;
```

### Worlds (Agent Teams)

```typescript
import { syncWorld, wireWorld, type WorldSpec } from '@/engine'

const world: WorldSpec = {
  name: 'marketing',
  description: 'Marketing team',
  agents: [directorSpec, creativeSpec, mediaSpec, ...]
}

// Sync all to TypeDB
await syncWorld(world)

// Wire into runtime
const units = wireWorld(world, net, complete)
```

### API Endpoint

```bash
# Sync single agent
curl -X POST /api/agents/sync \
  -d '{"markdown": "---\nname: tutor\n..."}'

# Sync world
curl -X POST /api/agents/sync \
  -d '{"world": "marketing", "agents": [...]}'

# Dry run (just get TypeDB queries)
curl "/api/agents/sync?markdown=..."
```

### The Full Flow

```
agents/marketing/creative.md
        │
        ├── parse() ──────────► AgentSpec
        │                           │
        │                           ├── toTypeDB() ──► TQL inserts
        │                           │
        │                           ├── syncAgent() ──► TypeDB Cloud
        │                           │
        │                           └── wireAgent() ──► Runtime unit
        │
        └── CF Worker reads ──────► Live on Telegram/Discord
                                       │
                                       └── Substrate routes via weights
```

## ADL (Agent Definition Language)

**Spec:** https://www.adl-spec.org/spec v0.2.0

ADL is a JSON "passport" for agents: identity (uid as HTTPS URI), capabilities (tools with JSON schemas), permissions (deny-by-default network/filesystem/env), data classification (public/internal/confidential/restricted), and lifecycle (status, sunset). The substrate is unchanged—ADL wraps the security layer only.

### Quick Import

```bash
# Single ADL document
curl -X POST /api/agents/adl \
  -d '{"json": {"id": "...", "name": "...", "version": "1.0.0", ...}}'

# Discover all active agents
curl /.well-known/agents.json | jq '.agents[] | {id, name, status}'
```

### Permission Gates (Automatic)

Every signal goes through three ADL gates:

1. **Lifecycle:** Reject signals to retired/deprecated units (410 Gone)
2. **Network:** Check sender against receiver's allowedHosts (403 Forbidden)
3. **Sensitivity:** Detect if sender is more sensitive than receiver (audit trail, non-blocking)

All gates cached in-process (5-min TTL) — ~300ms latency savings on cache hit (90% hit rate).

### Markdown → ADL Bridge

Markdown agents auto-convert to ADL via `adlFromAgentSpec()`:

```typescript
import { adlFromAgentSpec } from '@/engine/adl'
const adl = adlFromAgentSpec(markdownSpec)
// → ADL document with sensitivity, network permissions, tool schemas
```

Backward compatible: legacy agents work unchanged (gates pass through).

See `docs/ADL-integration.md` for full reference.

## Directory Structure

```
src/
  engine/       # Core: world.ts, persist.ts, loop.ts, boot.ts, llm.ts, agent-md.ts
  components/   # React 19 + shadcn/ui
    u/          # Universal Wallet (/u/*) — 17 pages, 38+ components
      lib/
        vault/  # AES-256-GCM + HKDF + PBKDF2 + WebAuthn PRF vault
        signer/ # Signer abstraction: vault/dapp-kit/snap/zklogin adapters + useSigner
  pages/        # Astro routes + 50+ API endpoints
    api/
      auth/
        agent.ts           # Mint credentials (AUTH_AGENT_REMINT_MODE=audit|enforce)
        agent/[uid]/claim.ts  # Human-agent claim handshake
        wallet/            # Sui wallet nonce/verify (deprecated — use Better Auth plugin)
        zklogin/           # zkLogin callback (Google OAuth → Sui address)
  pages/api/export/  # TypeDB → JSON snapshots (paths, units, skills, highways, toxic)
  layouts/      # Astro layouts
  schema/       # TypeDB schema (world.tql)
  lib/
    auth.ts              # Better Auth config + suiWallet() + zkLogin() plugins
    auth-plugins/
      sui-wallet.ts      # SIWE-style Sui wallet sign-in plugin
      zklogin.ts         # Google OAuth → Sui zkLogin plugin
    human-unit.ts        # ensureHumanUnit() — human actor + personal group + chairman role
    api-auth.ts          # Auth middleware + deriveHumanUid + invalidateKeyCache
    api-key.ts           # Key generation, PBKDF2 verify, getKeyPrefix (TQL-safe)
  __tests__/
    integration/  # 24 integration test files (vault, chains, signer, auth-claim)
                  # RULE: no vi.mock for TypeDB/Sui/external services — real data or skip
                  # Use VCR cassettes (src/__tests__/helpers/cassette.ts) for TypeDB replays
                  # Use it.skip / skipIfNoDb() guard when live service unavailable
    fixtures/     # vault-v1.json (migration test fixture)
docs/           # Architecture, deploy, cloudflare, nanoclaw, strategy
gateway/        # CF Worker: TypeDB proxy + WsHub DO (api.one.ie)
                # Routes: /typedb/query, /tasks, /ws, /broadcast, /messages, /health
                # Security: Origin check on /ws, X-Broadcast-Secret on /broadcast,
                # message type allowlist, 100-conn cap per DO
workers/sync/   # CF Worker: TypeDB → KV cron (every 1 min, hash-gated writes)
nanoclaw/       # CF Worker: Edge agents (webhooks → queue → LLM → channels)
  src/
    personas.ts       # All bot personas (model + system prompt). Add here, auto-discovered everywhere.
    workers/router.ts # Hono router: auth middleware, sync Telegram processing, queue for substrate
    channels/         # normalize/send per channel (telegram, discord, web)
    lib/              # substrate.ts, tools.ts
  wrangler.toml        # Main nanoclaw (no API key, Gemma 4 default)
  wrangler.donal.toml  # Donal's CMO bot (BOT_PERSONA=donal, API key auth)
agents/         # Markdown agent definitions
  donal/        # OO Agency Pod — 11 marketing agents (cmo, full, citation, etc.)
  marketing/    # Marketing team (8 agents)
  *.md          # Example agents (tutor, researcher, coder, writer, concierge)
migrations/     # D1 schema (signals, messages, tasks, sync_log)
.claude/
  commands/     # Slash commands: /see, /create, /do, /close, /sync
  skills/       # /sui, /deploy, /typedb, /astro, /react19, /reactflow, /shadcn, /zklogin
  rules/        # Auto-loaded rules for engine, react, astro
```

## Engine Files

| File | Lines | Purpose |
|------|------:|---------|
| `world.ts` | 225 | Unit + World + strength/resistance + queue + ask (4 outcomes) |
| `persist.ts` | 1038 | PersistentWorld = World + TypeDB sync + sandwich + know/recall/reveal/forget/frontier + hasPathRelationship (pheromone gate) |
| `loop.ts` | 164 | Growth tick: all 7 loops, chain depth, outcome handling |
| `boot.ts` | 40 | Hydrate from TypeDB, add units, start tick |
| `llm.ts` | 50 | LLM as unit: openrouter adapter (+ legacy anthropic/openai) |
| `agent-md.ts` | 280 | Parse markdown agents, sync to TypeDB, wire to runtime |
| `api.ts` | 70 | `apiUnit()` — any HTTP endpoint as a substrate unit |
| `apis/index.ts` | 45 | Pre-built: github, slack, notion, mailchimp, pagerduty, discord, stripe |
| `bridge.ts` | 150 | Sui ↔ TypeDB: mirror/absorb/resolve paths on-chain |
| `durable-ask.ts` | 120 | `durableAsk()` — pending asks in D1, survive worker restarts |
| `human.ts` | 90 | `human()` — a person as a substrate unit (Telegram, Discord) |
| `agentverse-bridge.ts` | 50 | `bridgeAgentverse()` — 2M AV agents as proxy units in main world |
| `federation.ts` | 55 | `federate()` — another ONE world as a unit in this one |
| `intent.ts` | 130 | Intent cache — typed text → canonical intent → shared D1 cache entry |
| `index.ts` | 29 | Exports |

## Owner — the substrate root

**Spec:** `/Users/toc/Server/owner.md` (read this for the full architecture)

One human per substrate. Anthony O'Connell. Apple ID + Secure Enclave. The owner's WebAuthn passkey PRF is the root from which every key descends:

| Salt | Derives | Purpose |
|---|---|---|
| `"api-key:owner:v1"` | bearer token | Owner-tier API calls; bypasses scope/network/sensitivity gates |
| `"wallet:owner:v1"` | Ed25519 seed | Owner's Sui wallet |
| `"agent-key:{uid}:v1"` | KEK | Wraps each agent's per-agent seed before D1 storage |
| `"vault-sync:v1"` | sync envelope | Encrypted blob to D1 for cross-device wallet recovery |

**Owner role properties** (per `src/lib/role-check.ts`, target):
- Bypasses scope, network, and sensitivity gates in `src/pages/api/signal.ts`
- Subject to rate ceiling regardless of role (DOS prevention)
- Every owner-tier action emits `audit:owner:{action}` to D1 *before* the bypass — no untraceable god mode
- Identified by Sui address registered at first-mint; immutable after

**Recursive spawning:** humans spawn agents (one Touch ID), agents spawn sub-agents (Move tx, no biometric), arbitrary depth. Cap inheritance via `Cap` Move objects: child cap ≤ parent remaining cap, enforced by consensus. See `agents.md` Pattern D.

**Six gaps tracked, ordered by dependency:**
1. Owner audit (must land first — no bypass without a record)
2. Strip `SUI_SEED` from workers, owner-side per-agent key registration
3. Rate ceiling for owner key
4. HKDF context versioning + rotation
5. Multi-sig recovery for tenant chairmen (not for substrate owner — single-key by design)
6. Federation: foreign signals downgraded from `owner` to `chairman` semantics

## Sui Integration (Testnet ✅)

| Component | What |
|-----------|------|
| `src/move/one/sources/one.move` | Move contract: Unit, Signal, Path, payment, fade (680 lines, 7 objects, 6 verbs) |
| `src/lib/sui.ts` | Sui client: all contract functions, keypair derivation (Phase 2 ✅), faucet |
| `src/engine/bridge.ts` | Mirror/absorb: Runtime ↔ Sui ↔ TypeDB (mark/warn auto-propagate) |
| `src/schema/world.tql` | TypeQL schema: `sui-unit-id`, `sui-path-id`, `wallet` attributes on unit/path |
| Testnet Package | `0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980` (v2) |
| Status | Phase 1-3 complete ✅ (testnet wallets live, ephemeral keypairs, GovernanceEvent on-chain). See `/sui` skill + `docs/TODO-SUI.md` |

**Phase 2 — Identity & Wallet (Complete 2026-04-18, superseded by Owner architecture):**
- `deriveKeypair(uid)` + `addressFor(uid)`: deterministic Ed25519 keypair from `SUI_SEED + uid` *(deprecated — see `/Users/toc/Server/owner.md` gap 1; SUI_SEED is being removed)*
- `syncAgentWithIdentity()`: wires wallet into agent creation, persists to TypeDB
- 14 tests pass: determinism + uniqueness + idempotency verified
- Unblocks Phase 3 (escrow on-chain) and marketplace on-chain discovery
- **Migration in flight:** `SUI_SEED` deletion + per-agent keys generated at spawn, encrypted under owner PRF, ciphertext in D1. Tracked in `owner.md` gap 1.

## Key Patterns

### Zero Returns
Missing handler? Signal dissolves. Swarm continues.
```typescript
target && target(sig)    // Good: silence is valid
if (!target) throw ...   // Bad: never throw for missing
```

### Tasks as Handlers
```typescript
const bob = net.add('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))

net.signal({ receiver: 'bob:schema', data: { spec: '...' } })
// Pheromone accumulates automatically on delivery
```

### The Closed Loop
```typescript
const { result, timeout, dissolved } = await net.ask({ receiver: next })
if (result)        net.mark(edge, chainDepth)   // success scales with chain
else if (timeout)  /* neutral — not the agent's fault */
else if (dissolved) net.warn(edge, 0.5)          // mild — path doesn't exist
else               net.warn(edge, 1)             // failure — agent produced nothing
```

### Toxicity (with cold-start protection)
```typescript
// Requires: resistance >= 10 (enough data), resistance > 2x strength (clearly bad),
// total samples > 5 (don't block new paths)
const isToxic = (edge) => r >= 10 && r > s * 2 && (r + s) > 5
```

### Agent Identity (Sui Wallets) — Owner-rooted, no master seed

**Current legacy (being removed):**
```
SUI_SEED (env) + agent UID → SHA-256 → Ed25519 keypair
```

**Target architecture (per `/Users/toc/Server/owner.md`):**
```
agent_seed = randomBytes(32)                                    // at spawn
agent_kek  = HKDF(owner_prf, "agent-key:{uid}:v1")              // owner Touch ID
ciphertext = AES-GCM(agent_seed, agent_kek)                     // wrap
D1.agent_wallet.insert({ uid, ciphertext, kdf_version: 1 })     // persist
```

Per-agent random seeds, encrypted under the owner's biometric-derived KEK, ciphertext in D1. **No `SUI_SEED` anywhere.** Loss of D1 → owner re-derives any agent (via owner PRF + uid). Loss of owner biometric → BIP39 paper recovers PRF → recovers every agent. See `owner.md` gap 1 for the migration plan.

For peer-spawned agents (parent agent spawns child without human Touch ID), child seed = `HKDF(parent_seed, "agent:{nonce}:child")` — parent recovers any descendant from its own seed + the on-chain spawn nonce. See `agents.md` Pattern D.

## Data Flow (Three Layers)

```
TypeDB (truth)     →    KV (snapshot)    →    globalThis (hot)
  ~100ms RT              ~10ms read             ~0ms
  paths persist          5 keys                 30s TTL per isolate
  full history           paths.json             parsed, ready
                         units.json
                         skills.json            KV write only if hash changed
                         highways.json          Sync triggered on every signal
                         toxic.json
```

- **`src/lib/edge.ts`** — in-process cache (`globalThis._edgeKvCache`). All KV reads are 0ms within TTL. Use `kvInvalidate(key)` after a direct KV write.
- **`workers/sync/index.ts`** — FNV-1a hash per key; skips KV write if data unchanged. Runs every 1 min via cron. Also triggered by `POST /sync` (called from `signal.ts` after every mark/warn).
- **`src/pages/api/tick.ts`** — `PersistentWorld` is module-level cached. Loaded from TypeDB once; pheromone accumulates in memory between ticks. Force reload: `?reload=1`.

## Slash Commands

Five verbs. Each takes a noun that specifies what to act on.

```
/see     tasks [--tag X]         open work + tag filter                L1
/see     highways [--limit N]    proven paths (top by strength)        L2
/see     frontiers               unexplored tag clusters                L7
/see     toxic                   blocked paths (high resistance)        L3
/see     hypotheses              what the substrate learned             L6
/see     events [--since T]      signal history / Four Outcomes audit   L1

/create  task <name> [--tags T]  atomic task into TypeDB               L1
/create  todo <source-doc?>      TODO from template or extract          L1
/create  agent <md-file>         agent.md → TypeDB unit                 L1
/create  signal <rcvr> <data>    ad-hoc signal emission (testing)       L1

/do      <TODO-file>             advance next wave                      L1
/do      <TODO> --auto           run W1→W4 continuously until done      L1
/do                              autonomous loop: pick + execute + mark  L1
/do      --once                  single iteration of autonomous loop     L1

/close   <task-id>               mark() success, unblock dependents     L2
/close   <task-id> --fail        warn(1) — deterministic failure         L2
/close   <task-id> --dissolved   warn(0.5) — missing unit/capability     L2
/close   <task-id> --timeout     neutral — slow, not bad                 L2
/close                           no-arg: record whole session outcomes   L2

/sync                            tick + scan docs + todos + agents       L3-L7
/sync    tick                    fire /api/tick (all L1-L7 loops)        L1-L7
/sync    docs                    scan docs/*.md → memory → TypeDB        L6
/sync    todos                   scan docs/TODO-*.md → tasks → TypeDB    L1
/sync    agents                  scan agents/**/*.md → units → TypeDB    L1
/sync    fade/evolve/know/frontier  individual loop invocations          L3-L7
/sync    pay <receiver> <amt>    emit payment signal (L4 economic)       L4
```

### CLI fallbacks (no dev server needed)

When the Astro dev server is down or the gateway 8s timeout blocks bulk
reads, use these direct-to-TypeDB scripts — same semantics, same writes.
Required because `/api/tasks/sync` loses context on compile errors in the
working tree and `readParsed()` times out on 1000+ row graph queries.

```
bun run scripts/sync-todos.ts            # scan TODO-*.md → TypeDB (replaces /sync todos)
bun run scripts/ready-tasks.ts [N]       # top N tasks with no open blockers
bun run scripts/close-task.ts <task-id>  # mark done + pheromone deposit + cascade
bun run scripts/close-task.ts --search "phrase"   # find by name first
```

See `docs/task-management.md § CLI Tools` for the full contract.

## The Three Locked Rules

These compound. Breaking any one breaks the flywheel.

**Rule 1 — Closed Loop.** Every signal closes its loop: `mark()` on result,
`warn()` on failure, `dissolve` on missing unit/capability. No silent returns,
no orphan signals, no handler that produces nothing without emitting a warn.
Width only compounds if every parallel branch deposits pheromone on the path
it used.

**Rule 2 — Structural Time Only.** Plan in **tasks → waves → cycles**. Never
days, hours, weeks, sprints, or any wall-clock unit. The substrate measures
width by tasks-per-wave, depth by waves-per-cycle, learning by cycles-per-path.
Calendar time can't be `mark()`d, so it doesn't compound. Only exception:
genuine external deadlines (merge freezes, release cuts, legal dates).

**Rule 3 — Deterministic Results in Every Loop.** Every loop — `/work`, `/wave`,
`/sync`, `/deploy`, `/done`, every growth tick — MUST report verified numbers,
not vibes. Tests passed/total. Build time in ms. Deploy time per service.
Health check latency. Rubric dimension scores. These are the deterministic signals
that calibrate pheromone. Path strength without verification is superstition;
with verification it's learning. If a loop can't report deterministic results,
it can't `mark()` — it's just noise.

```
✓ 320/320 tests pass     → W0 baseline green, deploy proceeds
✓ Gateway 292ms          → health within budget, mark(+depth)
⊘ 2/320 known-flaky      → stochastic, allowlisted, no warn()
✗ tsc error TS2322       → deterministic failure, warn(1), chain breaks
```

Every skill/command ends with a numbers-first report. If you can't measure it,
you can't route around it.

```
task   = atomic unit of work        (one .on() handler, one file edit, one recon query)
wave   = phase within a cycle       (W1 recon → W2 decide → W3 edit → W4 verify)
cycle  = full W0-W4 sandwich         exits at rubric >= 0.65
path   = what remembers across cycles (strength / resistance)
```

See `.claude/rules/engine.md` for code-level enforcement.

## TODO Rules

**ALWAYS use `docs/TODO-template.md` when creating any new TODO file.** Use `/todo` to create them.

Every TODO MUST have:
1. **Source of truth** referencing DSL.md, dictionary.md, rubrics.md
2. **Routing diagram** — signal flow down, quality marks up, fan-out sideways
3. **Schema reference** — tasks map to `world.tql` dimension 3b
4. **Wave structure** — W1 (Haiku recon), W2 (Opus decide), W3 (Sonnet edit), W4 (Sonnet verify)
5. **Task metadata** — id, value, effort, phase, persona, blocks, exit, tags
6. **Rubric scoring in W4** — fit/form/truth/taste as tagged edges via `markDims()`
7. **Self-checkoff** — W4 verify pass → mark done → update checkbox → unblock dependents
8. **See Also** linking DSL.md, dictionary.md, rubrics.md, TODO-template.md, TODO-task-management.md

DSL.md and dictionary.md are loaded as base context in every Wave 2 decision. Non-negotiable.

**Testing wraps every cycle** (the deterministic sandwich):
- **W0 (baseline):** `npm run verify` before starting any cycle — biome + typecheck + vitest
- **W4 (verify):** `npm run verify` after edits — no regressions, new tests for new code
- **Cycle gate:** all tests green, biome clean, types clean, rubric >= 0.65

## Tech Stack

- **Astro 5**: Islands architecture, SSR
- **React 19**: Actions, use(), transitions
- **TypeDB 3.0**: Brain — paths, classification, evolution, learning
- **Tailwind 4**: Styling
- **shadcn/ui**: Component library
- **ReactFlow**: Graph visualization

## Path Aliases

```typescript
import { world } from "@/engine"
import { group, unit } from "@/engine/world"
import { Card } from "@/components/ui/card"
```

## SDK

`@oneie/sdk` is workspace-linked. **Browser and scripts only** — server-side Astro routes must call the engine directly (fetch → own endpoint is pointless latency).

```typescript
// Browser React: import the singleton (same-origin via window.location.origin)
import { sdk } from "@/lib/sdk"
const stats = await sdk.stats()
const highways = await sdk.highways(10)
const data = await sdk.exportData("units")

// React hooks: wrap island in <SdkProvider>, then use hooks
import { SdkProvider } from "@/components/providers/SdkProvider"
import { useAgentList, useHighways, useStats } from "@oneie/sdk/react"

function MyComponent() {
  const { data, loading, refetch } = useAgentList()
  const { data: highways } = useHighways(10)
}

// Scripts: construct an explicit client
import { SubstrateClient } from "@oneie/sdk"
const client = new SubstrateClient({ baseUrl: process.env.ONE_API_URL })
```

**React Hooks:** `useAgent(uid)`, `useAgentList()`, `useDiscover(skill)`, `useHighways(limit)`, `useStats()`, `useHealth()`, `useRevenue()`, `useRecall(status?)`

**CLI uses SDK internally:** `packages/cli` imports `@oneie/sdk` — commands call `getClient().<method>()`. See `one/sdk-cli-integration.md`.

Every SDK call emits `toolkit:sdk:<method>` to `/api/signal` — pheromone tracks which client surfaces are used.

## Telemetry

**Every surface emits signals. The graph learns what works.**

| Surface | Receiver Pattern | Tags | File |
|---------|------------------|------|------|
| SDK | `toolkit:sdk:<method>` | `[telemetry, ...]` | `packages/sdk/src/telemetry.ts` |
| CLI | `toolkit:cli:<verb>` | `[telemetry, cli, verb, node-N, platform]` | `packages/cli/src/lib/telemetry.ts` |
| MCP | `toolkit:mcp:<tool>` | `[telemetry, mcp, tool]` | `packages/mcp/src/telemetry.ts` |
| UI | `ui:<surface>:<action>` | `[ui, click, surface, action]` | `src/lib/ui-signal.ts` |
| API | `api:<route>:<method>` | `[telemetry, api, method, status]` | `src/lib/telemetry.ts` |

Tags become paths. Paths become highways. The install base IS the learning signal.
Rate limit: 100-500/hour per session. Opt-out: `ONEIE_TELEMETRY_DISABLE=1` or `~/.oneie/config.json`.

See `one/telemetry.md` for full architecture.

## Deploy

**One script. Same code path locally and in CI. `wrangler` CLI direct + async parallel workers.**

> **Migration complete (2026-04-18):** Astro 6 + `@astrojs/cloudflare@13` + CF Workers
> with Static Assets. `dev.one.ie` serves the `one-substrate` Worker; 140 units healthy.
> Pages project paused at `one-substrate.pages.dev` as rollback safety net.

### Deploy
```bash
bun run deploy              # full pipeline, prompts "yes" on main
bun run deploy -- --dry-run       # verify without deploying
bun run deploy -- --strict        # no flaky test allowance
bun run deploy -- --preview-only  # build + smoke only
bun run deploy -- --skip-tests    # skip W0 (risky)
DEPLOY_CONFIRM=yes bun run deploy # non-interactive approval (CI)
```

### GitHub Actions (CI) — `.github/workflows/deploy.yml`
```
push feature/**  →  `bun run deploy` (auto-approves non-main branches)
push main        →  `environment: production` reviewer gate → DEPLOY_CONFIRM=yes → `bun run deploy`
```
Required secrets: `CLOUDFLARE_GLOBAL_API_KEY`, `CLOUDFLARE_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`.
`CLOUDFLARE_API_TOKEN` is explicitly blanked. CI invokes the exact same `bun run deploy` you run locally — no drift.

### The 8-step pipeline (`scripts/deploy.ts`)
1. W0 baseline — biome + tsc + vitest (known-flaky allowlist)
2. Changes — git diff summary
3. Build — NODE_ENV=production astro build
4. Credentials — auto-enforce Global API Key, unset `CLOUDFLARE_API_TOKEN`
5. Smoke — verify dist/ + 3 wrangler.toml
6. Approval — `main` prompts "yes"; other branches auto
7. Deploy — Gateway + Sync + NanoClaw **parallel** (24s), then Astro Worker (~16s)
8. Health — 3 retries with backoff + record to substrate via `/api/signal`

**Verified speed (2026-04-15):** 74.9s total.
Workers parallel 16.7s (vs ~42s sequential — 2.5× speedup) • Astro Worker 29.6s • health 4/4 in 287-666ms.
Preview URL: `📎 https://one-substrate.<account>.workers.dev`

**CF bundle size — LOCKED rules (do not revert, apply to Pages AND Workers):**
Three rules keep the SSR worker under the CF free-tier limit (~10 MiB uncompressed):
1. `markdown: { syntaxHighlight: false }` — kills ~5.8 MiB of Shiki grammars from worker
2. `ssr.external: ["shiki", "@mysten/sui", "@mysten/bcs", "node:async_hooks"]` — bare import references without inlining; safe only when the package is never called server-side (`shiki` callers are all `client:only`)
3. Pure-shell pages use `export const prerender = true` + `client:only="react"` — component tree stays out of worker, page handler collapses to 63-byte stub
Verified 2026-04-15: 21 MiB → 9.5 MiB. Workers deploy: ✓. Full diagnosis: `docs/deploy.md` § Bundle Size.

**Auth is non-negotiable:** Global API Key only. `.env` stores it as `CLOUDFLARE_GLOBAL_API_KEY`, script maps to `CLOUDFLARE_API_KEY` for wrangler and blanks `CLOUDFLARE_API_TOKEN` in the spawned env. Scoped tokens are forbidden — they lack permissions for workers + custom domains. See `/cloudflare` skill.

**Substrate records itself:** every deploy posts `deploy:success` or `deploy:degraded` to `/api/signal` with branch, per-service timings, health latencies. Pheromone learns which deploy patterns produce healthy production.

**Live URLs:**

| Service | URL |
|---------|-----|
| Astro Worker | https://dev.one.ie (CF Workers custom domain, cut over 2026-04-18) |
| Astro Worker (direct) | https://one-substrate.oneie.workers.dev (workers.dev fallback) |
| Pages (legacy idle) | https://one-substrate.pages.dev (old Pages project, kept as rollback safety net) |
| Gateway | https://api.one.ie/health |
| Sync | https://one-sync.oneie.workers.dev |
| NanoClaw | https://nanoclaw.oneie.workers.dev/health |
| Donal-Claw | https://donal-claw.oneie.workers.dev/health |
| TypeDB | `flsiu1-0.cluster.typedb.com:1729` |

**Key facts:**
- TypeDB Cloud port is **1729** (not 80 or 443)
- TypeDB API prefix is `/v1/` (signin, query, databases)
- Always use `CLOUDFLARE_GLOBAL_API_KEY`, never scoped tokens
- Credentials in `.env` only — never hardcode in CLAUDE.md or wrangler.toml
- `SYNC_WORKER_URL` — sync worker base URL (default: `https://one-sync.oneie.workers.dev`). Set in `.env` to trigger KV refresh from signal.ts after path changes.
- `BROADCAST_SECRET` — Gateway `/broadcast` auth. Set in both `.env` (for `ws-server.ts relayToGateway()`) and Gateway (`wrangler secret put BROADCAST_SECRET`). Generate with `openssl rand -hex 32`.

## Live Task Updates (WebSocket)

TaskBoard receives mark/warn/complete events in real time via the Gateway's WsHub Durable Object:

```
Pages API (complete/persist) → wsManager.broadcast() + relayToGateway(msg, X-Broadcast-Secret)
                                        ↓
Gateway /broadcast → validates auth + type → DO.fetch('/send')
                                        ↓
WsHub DO (hibernation) → state.getWebSockets() → ws.send(message)
                                        ↓
Browser useTaskWebSocket hook → switch(msg.type) → setTasks(prev.map(...))
```

- Single DO named `"global"` shared across all CF isolates (fixes cross-isolate delivery)
- Client resilience: exp backoff reconnect (1s→30s), 45s heartbeat, 5s polling fallback after 3 fails
- `useDeferredValue` debounces rapid bursts so phase sidebar stays responsive
- Run `bun run scripts/test-ws-integration.ts` to verify (11/11 tests)

## NanoClaw API

Edge agents on Cloudflare. Each worker is a persona — same codebase, different config.
Telegram webhooks process **synchronously** (~3s). Queue used only for substrate signals.

### Live Workers

| Worker | URL | Persona | Auth |
|--------|-----|---------|------|
| nanoclaw | `nanoclaw.oneie.workers.dev` | Default (Gemma 4) | Open |
| donal-claw | `donal-claw.oneie.workers.dev` | OO Marketing CMO | API key |

**@onedotbot** on Telegram → `nanoclaw.oneie.workers.dev/webhook/telegram-one` (ONE assistant persona)

### Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/health` | GET | Public | Status check |
| `/webhook/:channel` | POST | Public | Telegram/Discord webhooks |
| `/message` | POST | API key* | Send message, instant response |
| `/messages/:group` | GET | API key* | Conversation history |
| `/highways` | GET | API key* | Proven paths |

*Auth only required when `API_KEY` secret is set on the worker.

### Personas

Defined in `nanoclaw/src/personas.ts`. Add an entry → auto-discovered by router + setup script.

```typescript
// nanoclaw/src/personas.ts
personas = {
  donal: { name: 'OO Marketing CMO', model: 'anthropic/claude-haiku-4-5', systemPrompt: '...' },
  one:   { name: 'ONE Assistant',     model: 'anthropic/claude-haiku-4-5', systemPrompt: '...' },
  // add new personas here
}
```

Persona selection order: `BOT_PERSONA` env var → group ID prefix (`tg-donal-*`) → default.

### Add a Claw to Any Agent

**API endpoint:**
```bash
# Generate claw config for any agent
curl -X POST http://localhost:4321/api/claw \
  -H "Content-Type: application/json" \
  -d '{"agentId": "tutor"}'

# Returns: persona, wranglerConfig, deployCommands, tools available
```

**CLI command:**
```bash
# Deploy claw from agent markdown (reads agents/*.md)
bun run scripts/setup-nanoclaw.ts --name tutor --agent tutor

# Deploy claw from predefined persona
bun run scripts/setup-nanoclaw.ts --name alice --persona one

# Add Telegram bot
bun run scripts/setup-nanoclaw.ts --name tutor --agent tutor --token 1234:ABC...

# List available personas and agents
bun run scripts/setup-nanoclaw.ts
```

**Slash command:** `/claw <agent-id>` — generates config and deploy instructions.

The script: reads agent markdown → adds persona to personas.ts → generates API key → creates CF queue → deploys worker → sets secrets → registers webhook → prints credentials.

### Web Message API

```bash
# Open worker (no auth)
curl -X POST https://nanoclaw.oneie.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"group": "my-conversation", "text": "What is ONE?"}'

# Auth-gated worker (donal-claw)
curl -X POST https://donal-claw.oneie.workers.dev/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_KEY>" \
  -d '{"group": "donal", "text": "Full SEO audit for elitemovers.ie"}'
```

### Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `OPENROUTER_API_KEY` | Yes | LLM calls |
| `TELEGRAM_TOKEN` | Optional | Default Telegram bot reply |
| `TELEGRAM_TOKEN_ONE` | Optional | @onedotbot reply token |
| `TELEGRAM_TOKEN_DONAL` | Optional | Multi-bot routing on main nanoclaw |
| `API_KEY` | Optional | Enables auth on non-webhook routes |
| `DISCORD_TOKEN` | Optional | Discord reply token |

## Skills (USE THESE)

| Skill | Trigger | What it provides |
|-------|---------|-----------------|
| `/sui` | Move contracts, wallets, Sui integration | Build Move contracts, agent wallets, mirror/absorb bridge, escrow patterns, TypeDB ↔ Sui sync |
| `/deploy` | Deploy to Cloudflare | Full 8-step pipeline. Bundle rules in `.claude/commands/deploy.md`. Uses CLOUDFLARE_GLOBAL_API_KEY |
| `/typedb` | Any TQL, schema, query work | TypeDB 3.0 syntax, functions (NOT rules) |
| `/reactflow` | Graph visualization | Custom nodes, dark theme |
| `/react19` | React components, hooks | React 19 patterns, use(), transitions |
| `/astro` | Pages, layouts, islands | Astro 5 hydration, SSR |
| `/shadcn` | UI components | shadcn/ui dark theme |

**CRITICAL: TypeDB 3.x removed `rule` syntax. Use `fun` (functions) only.**
**NEW: `/sui` skill for Sui Move contracts, agent wallets, bridge (testnet ✅, Phase 2 in flight).**

## Canonical Docs (READ THESE)

These docs define the system's vocabulary, routing, metaphors, and SDK contract.
**Always consult them when working on engine, schema, or docs changes.**
They must stay in sync with `src/engine/loop.ts`, `src/schema/*.tql`, and each other.

| Doc | What it defines | Syncs with |
|-----|----------------|------------|
| `src/schema/one.tql` | **THE ONTOLOGY** — 100 lines, 6 dimensions, stable forever | Everything |
| `docs/dictionary.md` | **THE NAMES** — canonical names, dead names, 6 verbs (signal/mark/warn/fade/follow/harden), dimension→runtime map | All docs, schemas, APIs |
| `docs/one-ontology.md` | **THE SPEC** — 6 dimensions explained, actor/group/thing types, universal mapping | `one.tql`, `dictionary.md` |
| `docs/autonomous-orgs.md` | **THE BLUEPRINT** — ONE-strategy as executable task graph with pheromone routing, 7 personas, revenue forecast | `world.tql`, `tick.ts`, revenue loops |
| `docs/metaphors.md` | **THE ROSETTA STONE** — 7 skins (ant/brain/team/mail/water/radio/ledger) + framework mappings (Langchain, AgentVerse, Hermes, Human). Merged from metaphors-extended.md on 2026-04-14. | `src/skins/index.ts`, `skins.tql`, all framework integrations |
| `docs/DSL.md` | The programming model — signal, emit, mark, warn, fade, follow, select, harden | `world.ts`, `persist.ts` |
| `docs/routing.md` | Formula (`weight = 1 + max(0, s-r) × sensitivity`), two modes (`follow` deterministic / `select` stochastic), deterministic sandwich (toxic→capable→execute), four outcomes (result/timeout/dissolved/failure), tick loop (select→ask→mark/warn→fade), chain depth, toxicity threshold | `loop.ts`, `persist.ts`, `world.ts` |
| `docs/rubrics.md` | Quality scoring — fit/form/truth/taste dims, gate threshold 0.65 | `loop.ts`, `/api/loop/mark-dims`, `markDims()` |
| `docs/lifecycle.md` | Agent journey — register→signal→highway→harden | `persist.ts`, `boot.ts`, all CLAUDE.md context blocks |
| `docs/lifecycle-one.md` | **User-facing funnel** — wallet→key→sign-in→team→deploy→discover→message→converse→sell→buy. 10 stages, measured by `/speed` | `src/pages/speed.astro`, `src/components/speed/LifecycleSpeedrun.tsx` |
| `docs/buy-and-sell.md` | Commerce mechanics — LIST→DISCOVER→EXECUTE→SETTLE, capability price | `bridge.ts`, `/api/agents/:id/capabilities`, `/marketplace` |
| `docs/revenue.md` | Five revenue layers — routing/discovery/infra/marketplace/intelligence | `loop.ts` L4, `/api/revenue`, `/api/stats` |
| `docs/speed.md` | Performance benchmarks — routing `<0.005ms`, gateway `<10ms`, TTFB `<200ms` | `gateway/`, `src/lib/edge.ts`, all API routes |
| `docs/patterns.md` | Reusable patterns — closed loop, deterministic sandwich, zero returns, toxicity | `world.ts`, `persist.ts`, `.claude/rules/engine.md` |
| `docs/sdk.md` | SDK contract — register, discover, hire, earn | Public API surface |
| `one/backend-tutorial.md` | **DEVELOPER GUIDE** — auth → six verbs → commerce → memory → tiers → deploy. 15 parts, machine-verified against source. Entry point for external developers. | `packages/sdk/src/client.ts`, `src/lib/tier-limits.ts`, all API routes |
| `one/quickstart-baas.md` | 5-minute first signal — API key + SDK init | `src/pages/api/auth/agent.ts` |
| `one/quickstart-workers.md` | 3-command CF Workers deploy | `packages/cli/src/commands/init.ts` |
| `docs/world-map-page.md` | BUILD SPEC — /world page design, direct manipulation, personas, visitor mode, 12-component limit | `src/pages/world.astro`, `src/components/WorldMap/*` |
| `docs/TODO-governance.md` | **GOVERNANCE** — Permission = Role × Pheromone. Schema locked 2026-04-18. Auth implementation + UI + federation. | `src/schema/one.tql`, `src/lib/role-check.ts`, `src/engine/persist.ts` |
| `docs/auth.md` | Auth implementation — API key flows, role lookup, session management | `src/lib/api-auth.ts`, `src/lib/role-check.ts` |
| `docs/loop-close.md` | **LOOP CLOSE** — verify→signal→propagate; one `do:close` signal, one learnings log, hard cycle gate | `.claude/commands/close.md`, `.claude/commands/do.md`, `docs/learnings.md` |
| `one/telemetry.md` | **TELEMETRY** — distributed pheromone from SDK/CLI/MCP/UI/API; tags→paths→highways; install base = learning | `packages/*/src/telemetry.ts`, `src/lib/telemetry.ts`, `src/lib/ui-signal.ts` |
| `one/do.md` | **TASK MANAGEMENT** — /do tutorial, intent mode, skill pre-flight, wave mechanics, learning flywheel | `.claude/commands/do.md`, `one/template-plan.md` |

**Sync rules:**
- File references in docs must match actual engine filenames
- Terminology must match post-migration vocabulary (strength/resistance, not scent/alarm)
- Metaphor-specific words (ant: alarm, brain: inhibit) stay as metaphor aliases only
- `skins.tql` and `skins/index.ts` must agree with `metaphors.md` mapping tables
- `loop.ts` must implement the 7 loops described in `dictionary.md` and `routing.md`
- `world.tql` functions must match the classification/routing tables in `DSL.md`
- `role-check.ts` ROLE_PERMISSIONS matrix must match the table in `docs/TODO-governance.md` and `docs/dictionary.md`

## Nested Context (subdir CLAUDE.md)

Each subtree has its own CLAUDE.md that auto-loads when working inside it.
Consult these before editing — they define the local contract.

| File | Scope | What it locks |
|------|-------|---------------|
| `src/pages/CLAUDE.md` | Astro routes | Page → component → hydration table, substrate-to-surface mapping |
| `src/pages/api/CLAUDE.md` | API routes | **All 50+ endpoints grouped by the 6 dimensions**, signal shape, rubric dims, four outcomes, `/api/claw` contract |
| `src/engine/CLAUDE.md` | Runtime | Engine file table, signal flow, zero-returns rule |
| `src/components/CLAUDE.md` | React islands | Component inventory, `emitClick` receiver naming |
| `src/hooks/CLAUDE.md` | React hooks | Hook inventory, substrate subscription patterns |
| `src/lib/CLAUDE.md` | Utilities | TypeDB client, edge cache, auth helpers |
| `src/schema/CLAUDE.md` | TypeDB | Schema files, `one.tql` ontology, function syntax |

**When editing an API route:** load `src/pages/api/CLAUDE.md` first — it's the authoritative index of every endpoint and its verb (send/mark/fade/follow/harden). The root CLAUDE.md here is the *map*; `api/CLAUDE.md` is the *territory*.

## Rules

See `.claude/rules/` for framework-specific patterns:
- `engine.md` — Substrate patterns, zero returns, signal flow
- `react.md` — React 19 patterns, typed props, hooks
- `astro.md` — Astro 5 islands, hydration, SSR
- `ui.md` — UI signals: every onClick emits to substrate via `emitClick`
