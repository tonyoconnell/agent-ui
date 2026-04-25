# ONE System Map

**Three fires, one ontology, zero direct DB connections.**

This is how TypeDB, Cloudflare (Workers + D1 + KV + R2 + Queues + DOs), Astro,
templates, and Sui compose into a single substrate — and how the
[6-dimension ontology](one-ontology.md) governs roles, permissions, and
multitenancy across every layer.

> Move **acts**. TypeDB **reasons**. Cloudflare **moves**.
> The browser never touches TypeDB. The Worker rarely touches TypeDB.
> KV serves the hot read. D1 buffers the warm write. TypeDB is the cold truth.

---

## 1. The Three Fires

| Fire | Where | Speed | Role | Cost of write |
|------|-------|-------|------|---------------|
| **Sui (Move)** | Mainnet/testnet | ~400ms finality | Economic truth — paths, payments, units, highways | gas |
| **TypeDB Cloud** | `:1729` (single region) | ~80–150ms RT | Reasoning truth — full graph, hypotheses, governance | server time |
| **Cloudflare Edge** | 300+ PoPs | <10ms | Movement — routing, cache, sessions, history | $0 (free tier) |

Each fire **owns a different invariant**. The ontology is the same in all three:
groups, actors, things, paths, events, learning. Only the **storage shape**
differs (Move structs vs TQL relations vs JSON snapshots).

---

## 2. Storage Layers — Who Owns What

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ONE 6-Dimension Ontology                        │
│            groups · actors · things · paths · events · learning           │
└──────────┬─────────────────┬────────────────┬────────────────┬───────────┘
           │                 │                │                │
   ┌───────▼────────┐  ┌─────▼────────┐  ┌───▼──────┐   ┌─────▼────┐
   │  Sui (Move)    │  │ TypeDB Cloud │  │   D1     │   │   KV     │
   │  ─────────────  │  │  ──────────  │  │  ──────  │   │  ──────  │
   │  Group  ⚠       │  │  group       │  │ signals  │   │ paths    │
   │  Unit           │  │  actor       │  │ messages │   │ units    │
   │  Path→Highway   │  │  thing       │  │ tasks    │   │ skills   │
   │  Signal         │  │  path        │  │ sync_log │   │ highways │
   │  Escrow         │  │  signal      │  │ sessions │   │ toxic    │
   │                 │  │  hypothesis  │  │ keys     │   │ <1ms read│
   │  ON-CHAIN       │  │  +functions  │  │ vault_blob│   │ 5min TTL │
   │  permanent      │  │  18 fns      │  │ warm RW  │   │          │
   │  audit-grade    │  │  cold truth  │  │ ~5ms     │   │          │
   │                 │  │              │  │US-East-1 │   │          │
   └─────────────────┘  └──────────────┘  └──────────┘   └──────────┘

                 ┌─────────────┐                ┌──────────────────┐
                 │     R2      │                │  Durable Objects │
                 │  ─────────   │                │   ─────────────   │
                 │ exports     │                │  WsHub (global)   │
                 │ files       │                │  intent-cache     │
                 │ snapshots   │                │  hibernating WS   │
                 │             │                │  ~1ms in-region   │
                 └─────────────┘                └──────────────────┘
```

**Rule of thumb:** if a write is **economic and disputed**, it goes to Sui.
If it's **structural and queried**, it goes to TypeDB. If it's **fast and
disposable**, it lives in D1 or KV. If it's **a large binary blob** (exports, files, snapshots), R2.
Encrypted vault blobs are small + user-scoped — they live in D1 (`vault_blob`
table, ~80ms TypeDB write budget; D1 write is ~5ms).

---

## 3. The Read Path — Why We Never Talk to TypeDB Directly

```
Browser ──(HTTPS)──► dev.one.ie (Astro Worker)
                          │
                          ├─► KV.get('paths.json')         ◄── 0–1ms (90% of reads)
                          │   (in-memory cache via globalThis._edgeKvCache)
                          │
                          ├─► D1 SELECT signals WHERE …    ◄── 5ms (history, by group)
                          │
                          └─► api.one.ie/typedb/query       ◄── 80ms (fallback only)
                                  │
                                  └─► TypeDB Cloud :1729
```

| Layer | Latency | Cache TTL | When |
|-------|---------|-----------|------|
| `globalThis` (per-isolate) | 0ms | 30s | Hot — same isolate, recent |
| KV (edge replicated) | <1ms | 5min | Warm — global snapshot |
| D1 (region-local) | ~5ms | — | Per-group history, sessions, keys |
| Gateway → TypeDB | ~80–150ms | — | Cold — only when KV misses or write |

**Why no direct TypeDB connection from the browser or Astro Worker:**

1. **Latency** — TypeDB is single-region (`flsiu1-0.cluster.typedb.com`).
   Cloudflare is global. Reading from TypeDB at the edge costs 80ms+ on
   every page load.
2. **Auth** — TypeDB Cloud uses JWT (61s TTL). The Gateway DO caches the
   JWT once per 60s; without it, every read re-signs in.
3. **Connection budget** — TypeDB has a hard cap on concurrent sessions.
   100k req/day from CF Workers would exhaust it in seconds.
4. **Schema isolation** — Browser code never needs raw TQL. The SDK and
   API routes are the contract.

The **Gateway Worker** (`api.one.ie`) is the *only* surface that opens a
TypeDB session. Everything else reads KV or asks the Gateway.

---

## 4. The Write Path — One Lane In, Sync Fans Out

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser │────►│  /api/   │────►│ Gateway  │────►│ TypeDB   │
│  / SDK   │     │ signal.ts│     │  Worker  │     │  Cloud   │
└──────────┘     └────┬─────┘     └──────────┘     └────┬─────┘
                      │                                   │
                      │         ┌──────────┐              │
                      └────────►│   D1     │              │
                                │ history  │              │
                                └──────────┘              │
                                                          │
                ┌────────────────────────────────────────┘
                │  cron */1 min (workers/sync)
                ▼
          ┌──────────┐     hash-gated      ┌──────────┐
          │  TypeDB  │────►(FNV-1a)───────►│    KV    │
          │  export  │   skip if unchanged │ snapshots│
          └──────────┘                     └──────────┘
                                                │
                                                ▼
                                          ┌──────────┐
                                          │  WsHub   │
                                          │  /broad  │
                                          └────┬─────┘
                                               │
                                               ▼
                                       all connected browsers
```

**Three things happen on every signal:**

1. **D1 insert** — append-only history (cheap, fast, group-scoped).
2. **TypeDB upsert** — relations updated (paths, hypotheses, capability).
3. **KV invalidate + sync trigger** — `POST /sync` on the sync worker
   re-exports the affected slice. Hash-gated: same data → no KV write.

The **WsHub Durable Object** broadcasts the change to all open WebSockets
so the UI updates without polling.

---

## 5. The Ontology Governs Everything

The 6 dimensions aren't documentation — they're the **schema for permission,
multitenancy, and routing across all four storage layers**.

### 5.1 Permission = Role × Pheromone

There is **no ACL table**. The graph IS the security model.

```
Can actor A do action X on resource R?
   │
   ├─ membership(A, group(R))?              ← which group(s) is A in?
   │       │
   │       └─ role on membership            ← chairman | board | ceo | operator | agent | auditor
   │              │
   │              └─ ROLE_PERMISSIONS[role] ⊇ X ?
   │
   └─ path(A, R) exists with strength > toxicity_threshold?
```

| Role | Read | Write paths | Hire/fire | Memory delete | Where |
|------|-----|-------------|-----------|---------------|-------|
| `chairman` | all | yes | yes | yes | full owner of group |
| `board` | all | no | no | no | observer |
| `ceo` | all | yes | yes | no | operator + hiring |
| `operator` | own + group | yes | no | yes | day-to-day driver |
| `agent` | own | own paths | no | no | actor performing work |
| `auditor` | all | no | no | no | external reviewer |

Source: `src/lib/role-check.ts` `ROLE_PERMISSIONS` matrix · enforced at
`src/lib/api-auth.ts` `getRoleForUser(uid)` for every API call.

### 5.2 Multitenancy = Groups All The Way Down

```
group("world:one")                   ← root world
   ├── group("team:marketing")       ← team
   │     ├── actor("agent:cmo")
   │     └── actor("agent:scout")
   ├── group("org:donal-agency")     ← tenant
   │     └── actor("agent:donal")
   └── group("owns:human:tony")      ← personal ownership group
         └── actor("human:tony") [chairman]
```

**Every write is scoped by group.** Every read filters by membership.
Cross-tenant leakage is impossible because:

1. **D1 rows** carry `group` column → `WHERE group = ?` enforced in API
   middleware.
2. **KV keys** are namespaced by group (`paths:team-marketing.json`).
3. **TypeDB queries** use `(group: $g, member: $a) isa membership` to gate
   `recall()` and `reveal()`.
4. **Signals** carry `scope: private | group | public` — private signals
   never appear in `know()` highway promotion.
5. **Sui objects** are owned by the group's derived address
   (`addressFor("group:team-marketing")`) — on-chain isolation.

A new tenant = a new group. That's the whole onboarding.

### 5.3 Identity Across the Stack

| Identifier | Where derived | Used in |
|------------|---------------|---------|
| `human:{slug}` | `deriveHumanUid({email})` | TypeDB actor, Better Auth session |
| `agent:{name}` | agent markdown frontmatter | TypeDB actor, NanoClaw worker |
| `group:{type}:{slug}` | created on first membership | All four layers |
| Sui address | `addressFor(uid)` = SHA-256(SUI_SEED ‖ uid) → Ed25519 | Move objects, payments |
| API key | bcrypt(rand) → `key_id` | D1 `keys` table, KV cache |
| Session cookie | Better Auth (JWT) | Astro Worker, browser |

**One UID, four identities.** Lose the SUI_SEED, lose all wallets. Lose
the API key, mint a new one. The TypeDB record is durable; the credentials
on top are rotatable.

---

## 6. Templates — Markdown In, Substrate Out

Templates are the **authoring surface**. Everything else is generated.

```
agents/marketing/cmo.md   (markdown + YAML frontmatter)
        │
        ├── parse()         ──► AgentSpec  (typed)
        │
        ├── toTypeDB()      ──► TQL inserts (actor + skills + capabilities + membership)
        │
        ├── syncAgent()     ──► TypeDB Cloud (executes inserts)
        │
        ├── adlFromAgentSpec() ──► ADL document (sensitivity, allowedHosts, tools)
        │
        ├── deriveKeypair() ──► Sui keypair (deterministic from SUI_SEED + uid)
        │
        └── wireAgent()     ──► runtime unit (in CF Worker memory, ready for signals)
```

**One file → five materializations.** Edit the markdown, re-sync, every
layer updates. Templates live in `agents/`; they're git-tracked and the
single source of truth for agent identity, model, prompt, skills, prices,
and channel bindings.

The **TODO templates** (`one/template-plan.md`, `one/template-todo.md`)
work the same way: markdown plan → tasks in TypeDB → signals on
completion → pheromone deposited on the path that did the work.

---

## 7. Astro — The Surface

```
src/pages/                                src/components/
   ├── *.astro          ◄── routes        ├── ui/         ◄── shadcn primitives
   ├── api/*.ts         ◄── 50+ endpoints ├── u/          ◄── universal wallet
   └── api/CLAUDE.md    ◄── route index   └── world/      ◄── graph viz
        │
        │  Astro Worker (one-substrate, CF Workers + Static Assets)
        ├── prerender = true   ──► static HTML (10ms TTFB at edge)
        ├── client:load        ──► hydrated React island
        ├── client:visible     ──► lazy hydrated (below fold)
        └── client:only="react" ──► skip SSR (heavy graph viz, browser-only)
```

**SSR only when needed.** Most pages are prerendered (HTML in KV) with
React islands hydrating on demand. The Worker bundle stays under
10 MiB — see CLAUDE.md "Bundle Size LOCKED rules" for the three rules
that keep it there.

`emitClick('ui:<surface>:<action>')` on every onClick → signal in →
pheromone updates → highways reveal which UI flows actually work.
The UI is itself a learning surface.

---

## 8. Sui — The Economic Anchor

Three of six dimensions cross to chain:

| Dimension | Sui Move struct | Why on-chain |
|-----------|----------------|--------------|
| Groups | `Colony` ⚠ (rename pending) | Ownership, treasury, fee_bps |
| Actors | `Unit` | Identity, wallet binding |
| Paths | `Path` → `Highway` (frozen on harden) | Economic weight, immutable proof |
| Events | `Signal`, `Escrow` | Payments, settlement, gas-paid receipts |

Two dimensions stay TypeDB-only:

- **Things** — skills/capabilities are classification; cheap to revise
- **Learning** — hypotheses are speculative; not worth gas

The **bridge** (`src/engine/bridge.ts`) keeps both views consistent:
mark/warn on TypeDB → mirror to Move when path becomes economic
(price > 0 or treasury fee triggered). No double-write; the source of
truth depends on the question.

---

## 9. The Full Request Lifecycle

```
1. User opens dev.one.ie
   └─► Astro Worker serves prerendered HTML (KV + 10ms TTFB)

2. React island hydrates, calls SDK
   └─► sdk.highways(10) → fetch /api/highways
       └─► Astro Worker reads KV.get('highways.json') → 0–1ms

3. User clicks "claim payment"
   └─► emitClick('ui:chat:claim', {...})
   └─► POST /api/signal
       ├─► auth-middleware → getRoleForUser(uid) [D1 lookup, cached]
       ├─► roleCheck(role, 'send_signal') → boolean
       ├─► Gateway → TypeDB insert signal
       ├─► D1 insert (history, group-scoped)
       ├─► sui.executeTransaction (if payment)
       ├─► sync worker triggered → KV invalidated
       └─► WsHub broadcast → all open WS update

4. Pheromone tick (every 5 min, cron)
   └─► sync worker reads TypeDB exports
       ├─► hash unchanged → skip KV write
       └─► hash changed → KV.put + WsHub broadcast 'sync'

5. Knowledge tick (hourly, L6)
   └─► persist.know() → highways promoted to hypotheses
   └─► toxic paths detected → automatic warn
   └─► Sui mirror if economic
```

Five tiers, one signal envelope, four storage backends, all mediated by
the ontology.

---

## 10. Why This Is Beautiful

| Property | How |
|----------|-----|
| **Fast reads** | KV at edge, 0–1ms; TypeDB only on miss |
| **Authoritative writes** | TypeDB is the single source of structural truth |
| **Economic finality** | Sui anchors what must not be revised |
| **Cheap experiments** | Things + Learning live only in TypeDB (no gas) |
| **Multitenant by default** | Groups isolate D1, KV, TypeDB, and Sui in one move |
| **Audit-grade** | D1 history + Sui receipts + TypeDB hypotheses = complete trail |
| **One ontology** | Same 6 dimensions across Move structs, TQL relations, KV JSON, D1 columns |
| **Zero ops** | Free-tier Cloudflare runs the whole edge; TypeDB is one shared cluster |
| **Self-governing** | Permission = Role × Pheromone; no ACL drift |

**The ontology is the contract.** The four storage layers are *how* it's
stored — fast, durable, economic, structural. The ontology is *what* is
stored. Change the ontology, and every layer follows. Don't change the
ontology, and every layer stays consistent forever.

---

## 11. Operating Rules

1. **Browser → Astro Worker → KV first, Gateway second.** Never open a
   TypeDB connection from the browser or from a route handler that has a
   KV path.
2. **Writes go through `/api/*`.** Every write hits the auth middleware,
   which loads the role from cache and gates by `ROLE_PERMISSIONS`.
3. **Group is mandatory.** Every D1 row, KV key, and TypeDB relation
   carries a group. No anonymous writes.
4. **Sync is hash-gated.** The sync worker writes to KV only when the
   hash changes. Idempotent re-runs are free.
5. **Sui only when economic.** Mirror to chain when there's a payment, a
   harden, or a treasury action. Otherwise stay in TypeDB.
6. **Templates are the source.** Don't hand-craft TypeDB rows for an
   agent; edit the markdown, re-sync.
7. **Pheromone is the audit log.** Every action that matters lands as a
   path with strength/resistance. Toxicity blocks pre-LLM; highways
   route at <1ms.

---

## See Also

- [the-stack.md](the-stack.md) — Code-level inventory (~600 lines, 2 fires)
- [cloudflare.md](cloudflare.md) — Worker-by-worker breakdown, free-tier budgets
- [typedb.md](typedb.md) — Schema, functions, query patterns
- [sui.md](sui.md) — Move contracts, bridge, agent wallets
- [one-ontology.md](one-ontology.md) — The 6 dimensions, formal definitions
- [dictionary.md](dictionary.md) — Canonical names, dead names, verbs
- [governance-todo.md](governance-todo.md) — Permission = Role × Pheromone, schema lock
- [auth.md](auth.md) — API keys, session cookies, role lookup
- [routing.md](routing.md) — How signals find their path (deterministic + stochastic)
- [speed.md](speed.md) — Latency budgets per layer
- [system-todo.md](system-todo.md) — Known gaps + hardening task list

---

*Three fires. Six dimensions. Four storage layers. One ontology. Zero direct DB connections from the edge.*
