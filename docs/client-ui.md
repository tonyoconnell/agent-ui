# Client UI — Design

A multi-tenant web client where users and agents sign up, own groups, add
actors / things / paths / events / learning, chat with their agents, wire
claws, bring their own API keys, and connect groups together. Everything
is a projection of `src/schema/one.tql`. Zero marginal cost by default.

---

## 1. Principles

1. **The ontology is the UI.** Sidebar is groups. Tabs are the 6 dimensions.
   Nothing in the UI exists that isn't in `one.tql`.
2. **Speed before surface.** TTI < 200ms on the group view. WS for live
   updates, never polling. Render from KV snapshot, reconcile from TypeDB.
3. **Zero marginal cost.** All compute and storage on Cloudflare free tier
   until a user opts into paid features. No vendor that charges per-seat.
4. **BYO keys.** Platform never pays for a user's LLM calls. Users add
   their own OpenRouter / Anthropic / OpenAI keys. We never store plaintext. We pay for some inference though. 
5. **Groups compose.** Nested groups. Cross-group paths. Everyone's ultimate
   parent is `world`. Agents can own groups too (their private workspace).
6. **Visibility is the product.** Every signal, every mark, every warn is
   visible. Pheromone isn't a black box — it's the main view.

---

## 2. Platform — Why Cloudflare

| Need | Choice | Why |
|------|--------|-----|
| Static + SSR | Cloudflare Pages | Free, global edge, already deployed |
| Auth / session | Better Auth + TypeDB adapter | Already in `src/lib/auth.ts` |
| User data | TypeDB Cloud (brain) + D1 (tx) | TypeDB holds the ontology, D1 holds boring tx rows |
| Secrets (API keys) | D1 ciphertext + per-user AES-GCM | Works on workers, no KMS dependency |
| Realtime | Gateway WsHub DO (global) | Already live at `api.one.ie`, cross-isolate delivery solved |
| Agent workers | NanoClaw pattern (per persona) | Already operational |
| Queues | CF Queues | Async signal processing, 1M msg/mo free |
| Files | R2 | Zero egress, 10GB/mo free |
| LLM | OpenRouter (user keys) | Single API, all models, user pays |

Verdict: CF is the right substrate. The one non-CF cost is TypeDB Cloud,
which we already pay for the brain. Everything else composes to $0 for
a user with modest traffic.

**What we explicitly don't add:** Vercel (egress), Supabase (redundant with
TypeDB), Clerk (per-MAU cost), SendGrid (passkeys / magic links via CF).

### The Nine Surfaces

Per `one-strategy.md`, ONE reaches users through nine surfaces. This client
is one of them (Web), but the UI must make the other eight *visible*,
because signals flow across all of them:

| Surface | Where it lives | This UI's role |
|---------|---------------|----------------|
| Web (chat + tabs) | `src/pages/app/*` (this doc) | Primary canvas |
| API | `/api/g/:gid/*` (§16) | Generated per group; settings + docs tab |
| SDK | `src/lib/client-sdk.ts` + `public/chat.js` | Embed tab shows snippet |
| CLI | `bun oneie` (open-source framework) | Link + install command in Settings |
| Chat embed | `public/chat.js` shadow-DOM widget (§20) | Embed wizard in group settings |
| Messaging | Nanoclaw → Telegram / Discord | Claws tab shows live bots (§13 Cycle 7) |
| Social | posts-as-signals (agent-authored) | New surface — rendered in Events tab |
| Memory | `/memory`, `/forget`, `/explore` (§21) | Exposed as slash commands in Chat tab |
| Wallet | Sui keypair per actor (`src/lib/sui.ts`) | New Wallet tab in actor inspector (§26) |

**Design rule.** Every surface emits the same `{receiver, data}` signal and
lands in the same Events log. The UI's job is to make this legible — a
Telegram message and a `/api/g/:gid/signal` POST render identically in the
Events tab, with a surface-source badge (`tg`, `api`, `web`, `sdk`).

---

## 3. The Group Model

Groups are the universe. Everything else lives inside one.

```
world (gid: "world", group-type: "world")
├── hierarchy(parent=world, child=tony-home)
│     └── tony-home (group-type: "personal")
│           ├── membership(tony, tony-home)
│           ├── membership(tutor-agent, tony-home)
│           └── hierarchy(parent=tony-home, child=tony-kids)
├── hierarchy(parent=world, child=marketing)
│     └── marketing (group-type: "team")
│           ├── membership(creative, marketing)
│           ├── membership(seo, marketing)
│           └── path(marketing-gateway → ops-gateway)   # cross-group
└── hierarchy(parent=world, child=ops)
```

**Rules of the model:**

- A `group` plays `hierarchy:parent` **and** `hierarchy:child`, so nesting
  is arbitrary depth.
- An `actor` plays `membership:member` of zero or more groups. Agents
  can be members of multiple groups simultaneously.
- A `thing` (skill, task, token, secret) is owned by exactly one group.
  Cross-group use happens via `capability` offered from an actor in the
  owning group.
- A `path` has `source` and `target` as actors; if they're in different
  groups, that edge represents a cross-group connection. The UI paints
  these edges differently.
- Agents can own groups. `actor(agent-123)` plays `membership:member` of
  a group named `agent-123-workspace` — the agent's private scratch.
- The `world` group is implicit — every actor is transitively a member.

**No schema changes required.** Everything above compiles against the
existing `one.tql`.

---

## 4. Information Architecture

Three panes. Left: navigation. Middle: context. Right: inspector.

```
┌─ ONE ───────────────────────────────────────────────────────────────┐
│ 🌍 world / marketing                         tony@one.ie  ⚙  ⌕      │
├──────────────┬──────────────────────────────────┬───────────────────┤
│ GROUPS       │  # marketing                     │ INSPECTOR         │
│              │  [chat] [actors] [things]        │ (context sensitive)│
│ ▾ world      │  [paths] [events] [learning]     │                   │
│   ▾ tony     │  ────────────────────────────    │                   │
│     ▸ kids   │  (tab content here)              │                   │
│   ▾ marketing│                                  │                   │
│     ▸ social │                                  │                   │
│     ▸ seo    │                                  │                   │
│   ▸ research │                                  │                   │
│              │                                  │                   │
│ + new group  │                                  │                   │
│              │                                  │                   │
│ ─ AGENTS ─   │                                  │                   │
│ 🤖 creative  │                                  │                   │
│ 🤖 seo       │                                  │                   │
│              │                                  │                   │
│ ─ CLAWS ─    │                                  │                   │
│ 🔌 debbie    │                                  │                   │
│ 🔌 donal     │                                  │                   │
│              │                                  │                   │
│ ⚙ settings   │                                  │                   │
└──────────────┴──────────────────────────────────┴───────────────────┘
```

- **Left pane:** group tree + flat agent list + flat claw list. Collapsible.
- **Middle pane:** tabbed view of the selected group. Tabs map 1:1 to
  dimensions 2–6 (Actors, Things, Paths, Events, Learning) plus a Chat tab.
- **Right pane:** inspector for whatever is clicked (actor, thing, path,
  event). Read and edit in place.

---

## 5. The Six Tabs

Each tab is a dimension of `one.tql` projected to a view.

### 5.1 Chat (dimension 5, live)

```
┌─ # marketing → chat ────────────────────────────────────────────────┐
│                                                                     │
│ 👤 tony     ▸ 11:04  new campaign for acme, B2B SaaS, $50k         │
│ 🤖 director ▸ 11:04  routing → creative + seo + media              │
│ 🤖 creative ▸ 11:05  3 angles:                                     │
│              ▸ 11:05  1. Pain → Proof  2. Stat-first  3. Story     │
│               ● path(director→creative): mark +1.0   strength 5.82 │
│ 🤖 seo      ▸ 11:06  keyword map (18 primary, 43 long-tail)        │
│                                                                     │
│ ───────────────────────────────────────────────────────────────     │
│ @creative rewrite angle 1 with a concrete proof point              │
│ [ 🎯 @creative ]  [ 📎 brief.pdf ]  [ ↑ send ]  model: haiku-4.5   │
└─────────────────────────────────────────────────────────────────────┘
```

- `@mention` targets a specific actor; without it, the group router picks.
- Inline pheromone events (`mark`, `warn`, `dissolve`) rendered as tiny
  chips between messages so users see learning happen.
- Message = `signal` entity. The sidebar's live indicator = unread count
  of signals with `receiver = current-user`.
- Attachments = `thing` with `thing-type: "attachment"` uploaded to R2.

This tab is `<ChatShell mode="page" target="group:<gid>">` — the same
component used in §15 visitor view (`mode="widget"`), §18 agency
dashboard (`mode="split"`), and the third-party SDK (`mode="widget"`
over shadow DOM). One component, four frames, one conversation.
**Target can be an agent uid, a human uid, or a group** — the UI is
identical; the substrate routes. See §20 and `docs/chat-universal.md`.

### 5.2 Actors

```
┌─ # marketing → actors ──────────────────────────────────────────────┐
│  filter: [type ▾] [tag ▾]   sort: [strength ▾]       + add actor   │
│                                                                     │
│  🤖 director   haiku 4.5  gen 7   ↑42 ↓3   87% success             │
│  🤖 creative   haiku 4.5  gen 4   ↑38 ↓6   85%                     │
│  🤖 seo        gemma 4    gen 2   ↑24 ↓2   92%                     │
│  🤖 social     haiku 4.5  gen 3   ↑19 ↓5   79%                     │
│  👤 tony       human               ↑12 ↓0                           │
│  👤 donal      human               ↑ 8 ↓1                           │
│                                                                     │
│  [+ add actor] opens modal: paste markdown  OR  invite user by email│
└─────────────────────────────────────────────────────────────────────┘
```

"Add actor" → two modes:
- **Markdown** — paste agent spec, validates, calls `POST /api/agents/sync`,
  unit appears live.
- **Invite** — email or invite link; target signs in via Better Auth;
  auto-added to this group on first login.

### 5.3 Things

```
┌─ # marketing → things ──────────────────────────────────────────────┐
│  filter: [type ▾] [tag ▾]                         + add thing       │
│                                                                     │
│  skill   copy         0.02 FET   providers: creative                │
│  skill   headlines    0.02 FET   providers: creative, social        │
│  skill   keyword-map  0.05 FET   providers: seo                     │
│  skill   audit        0.50 FET   providers: seo                     │
│  task    acme-launch  W2         context: brief.md                  │
│  token   FET          on-chain                                      │
│  secret  openrouter   ◉◉◉◉◉◉◉   (scope: this group)                 │
└─────────────────────────────────────────────────────────────────────┘
```

Secrets are `thing` with `thing-type: "secret"`. Stored as ciphertext in
D1, never in TypeDB attributes. TypeDB keeps just the `tid`, `name`,
scope, last-used timestamp.

### 5.4 Paths

Graph view (React Flow, already in stack). Dark theme. Green = strength,
red = resistance.

```
┌─ # marketing → paths ───────────────────────────────────────────────┐
│                                                                     │
│                         ┌─────────┐                                 │
│              ┌──────────▶ director ├──────────┐                     │
│              │  s:0.92  └────┬────┘  s:0.88   │                     │
│              │               │                │                     │
│           ┌──┴───┐       ┌───▼───┐       ┌────▼────┐                │
│           │ tony │       │creative│       │   seo   │               │
│           └──────┘       └───┬───┘       └────┬────┘                │
│                              │  s:0.78         │  s:0.65            │
│                              ▼                 ▼                    │
│                          ┌───────┐         ┌───────┐                │
│                          │ copy  │         │ audit │                │
│                          └───────┘         └───────┘                │
│                                                                     │
│  layout: [dagre|force|custom]   filter: [> strength 0.5 ▾]          │
└─────────────────────────────────────────────────────────────────────┘
```

- Click a path → inspector shows `strength`, `resistance`, `traversals`,
  last 20 signals that used it.
- Drag to create a new path (mostly for humans bootstrapping).
- Highways (top by strength) rendered thicker.
- Cross-group paths dashed and labelled with target group name.

### 5.5 Events

```
┌─ # marketing → events ──────────────────────────────────────────────┐
│ 11:06:12  tony       → director     "new campaign for acme"   ✓     │
│ 11:06:14  director   → creative     {tags:["copy","brief"]}   ✓ mark│
│ 11:06:18  director   → seo          {tags:["keywords"]}       ✓ mark│
│ 11:06:45  creative   → tony         3 angles                  ✓     │
│ 11:07:02  seo        → tony         keyword map               ✓     │
│ 11:09:11  tony       → creative     "rewrite angle 1"         ✓ mark│
│                                                                     │
│  filter: [sender ▾] [receiver ▾] [outcome ▾] [tag ▾]                │
│  streaming ● via /ws                                                │
└─────────────────────────────────────────────────────────────────────┘
```

Pure signal log. The `outcome` column maps to the four outcomes (result,
timeout, dissolved, warn). Click a row → inspector shows the full JSON
payload plus the path mark/warn that resulted.

### 5.6 Learning

```
┌─ # marketing → learning ────────────────────────────────────────────┐
│  HIGHWAYS (strongest paths)                                         │
│  director → creative     5.82  ▁▁▂▃▅▇█                              │
│  director → seo          4.11  ▁▂▃▄▅▆▇                              │
│                                                                     │
│  HYPOTHESES                                                         │
│  "short headlines convert 2x"        0.81  42 obs   [confirmed]     │
│  "FET price cap dampens demand"      0.64  18 obs   [testing]       │
│                                                                     │
│  FRONTIERS (unexplored)                                             │
│  tag cluster: "tiktok, vertical"   → no agent offers                │
│  tag cluster: "case-study, long"   → 2 marks, weak                  │
└─────────────────────────────────────────────────────────────────────┘
```

One page that answers "what did this group learn this week?" — surfaces
exist via loop outputs (L6 know, L7 frontier) already running.

---

## 6. Auth & Sessions

Already wired (`src/lib/auth.ts`):

- Better Auth + `typedbAdapter` — user rows live in TypeDB as `actor`
  entities with `actor-type: "human"`.
- Password: PBKDF2-SHA256 via Web Crypto (works on workers).
- Sessions: 30 days, cookie-cached, bearer plugin enabled.

**Additions for this UI:**

1. **Passkey plugin** — Better Auth has a WebAuthn plugin; enable it as
   primary, password as fallback. Zero cost, no email/SMS dependency.
2. **Signup → home group.** On first signup, a post-hook:
   - Create `actor(aid=user.id, actor-type="human", name=user.name)`.
   - Create `group(gid=${user.id}-home, group-type="personal")`.
   - Create `membership(group=world, member=actor)` and
     `membership(group=home, member=actor)`.
   - Create `hierarchy(parent=world, child=home)`.
3. **Invites.** Stateless signed token: `hmac(groupId + email + exp, secret)`.
   Redeemed URL auto-creates membership. No email vendor needed if user
   can share the link manually; optional `Resend` (free tier) for email.
4. **Role model.** Keep it to three values on `membership`: `owner`,
   `editor`, `viewer`. Stored as an attribute on the relation, inferred
   by functions for gating.

---

## 7. BYO API Keys (Zero Marginal Cost)

This is the load-bearing decision. Without it, we eat LLM cost per user.

**Flow:**

1. Settings → "Add API key" → paste OpenRouter key `sk-or-...`.
2. Client derives `userKey = HKDF(sessionToken, salt=userId)` — never
   sent to server in plaintext; this is a UX belt, not the actual wrap.
3. Server generates a data key with Web Crypto, encrypts the API key with
   `AES-GCM(dataKey, plaintext)`, wraps `dataKey` with a per-user master
   stored in CF Secrets Store (or a KEK rotated annually).
4. Ciphertext stored in D1 `user_secrets(user_id, provider, ciphertext,
   iv, last_used, scope_group_id)`.
5. TypeDB stores only a `thing` with `thing-type="secret"`, `name`, and
   the `tid` that matches the D1 row. No plaintext, no ciphertext, in
   TypeDB.

**Resolution order (worker side):**

```
agent needs LLM call
  → lookup secret scoped to the agent's active group
    → fall back to parent group (hierarchy walk)
      → fall back to user's account-level secret
        → fall back to platform key (rate-limited, paid tier only)
```

The platform's own key is only used on paid tiers (never free). Anyone
on the free tier must add their own key. This is the mechanism that
keeps marginal cost at zero.

---

## 8. Realtime (the visibility loop)

Already built: Gateway `WsHub` DO with hibernation, cross-isolate via a
single named DO `"global"`. Reuse it.

**Per-user subscription:**

```
client /ws?group=marketing
  → Pages API validates session + membership
    → upgrades to WS
      → subscribes DO room `group:marketing`
        → receives { type, payload } messages:
            signal       (new event)
            mark / warn  (pheromone change)
            presence     (actor online/offline)
            thing-added  (skill / task / secret created)
            path-added   (new connection)
```

Client uses `useDeferredValue` to debounce bursts (already in the
pattern). Fallback: 5s polling if WS fails 3× (also already in the hook).

**Back-pressure:** the DO caps 100 connections per room; beyond that we
shard by first letter of `groupId`. For now every group fits in one room.

---

## 9. Adding Features Through the UI

The point of having an ontology is that "adding a feature" is almost
always "add a thing, add a path, or add an actor". No code deploys for
most operations.

| User wants | UI path | Backend result |
|------------|---------|----------------|
| New agent | Actors → + Add → paste md | `POST /api/agents/sync`, actor appears |
| New skill | Things → + Add → form | `insert thing($tid, "skill", ...)` |
| New path | Paths → drag edge | `mark(edge, 0.1)` to bootstrap |
| Connect groups | Settings → Connections → search | Creates a `path` between two actors, one per group |
| Deploy Telegram bot | Claws → + Add → upload token | `POST /api/claw` deploys worker + wires webhook |
| Install template | + New group → From template | Copies actors/skills from template group |
| Change model | Actor inspector → model dropdown | `update actor has model = X` |
| Edit prompt | Actor inspector → prompt editor | Increments `generation`, writes new prompt |
| Add integration | Settings → Integrations → e.g. Slack | Stores secret, adds an `apiUnit` to home group |

A few deserve code-level scaffolding — marketplace / templates is the
big one. Design a template as a tiny JSON:

```json
{ "name": "marketing-pod",
  "actors": ["director.md", "creative.md", ...],
  "skills": [{"name": "copy", "price": 0.02}, ...],
  "paths": [["director", "creative", 0.5], ...] }
```

One-click install walks the JSON and inserts everything into the target
group. Already have `syncWorld()` in `src/engine/agent-md.ts` — this is
a thin UI over it.

---

## 10. Data Model (what goes where)

| Concern | Store | Why |
|---------|-------|-----|
| Users, sessions, accounts | D1 via Better Auth + `typedbAdapter` | Already wired |
| Actors, groups, things, paths | TypeDB | Ontology authority |
| API key ciphertext | D1 `user_secrets` | Worker-friendly, no egress |
| Signal log (events) | TypeDB, forever | Nothing deleted; memory is the product |
| Uploads (attachments) | R2 | Zero egress, cheap |
| WS room state | DO (transient) | Already deployed |
| KV snapshot (hot reads) | CF KV | Already there via sync worker |
| Point-in-time backup | R2 snapshots of TypeDB | Nightly full + hourly incremental |

**One constraint worth calling out:** TypeDB Cloud write latency is ~100ms.
The UI must never block a user interaction on a TypeDB write. Pattern is
**optimistic UI** — update the client state, `writeSilent()` in the
engine, WS confirms. On conflict, roll back (rare).

**Nothing is ever deleted.** Signals, paths, marks, warns, edits, deletions
are all events. "Delete a thing" writes a `signal(deleted=true)` pointing
at the thing's `tid`; functions filter out tombstoned rows. Users can
always scroll back; compliance requests can always be answered; the
substrate can always re-learn from history. See §17 for backup.

---

## 11. Performance Budgets

The entire point of this UI is speed and visibility. Budgets:

| Metric | Budget | How |
|--------|--------|-----|
| TTI (group view) | < 200ms | SSR from KV snapshot, hydrate 1 island |
| New signal → all clients | < 300ms | DO broadcast, direct from Pages API |
| Type a message → appear | < 50ms | Optimistic insert, WS confirms |
| Graph render (100 paths) | < 16ms | React Flow, `useMemo` edges |
| Search / filter | < 50ms | In-memory over snapshot |
| Add agent → visible | < 2s | `syncAgent()` + WS broadcast |
| Cold worker | < 50ms | Keep handlers lean, no heavy imports |

Benchmarks get a W4 verify in every cycle that touches this code. If a
change regresses any budget by > 20%, revert.

---

## 12. Security

- CSRF: Better Auth already handles, cookie `SameSite=Lax`.
- XSS: Astro's default escape; chat messages sanitised with DOMPurify
  before render (markdown → HTML pipeline).
- IDOR: every API checks membership via a TypeDB function
  `is_member_of(user, group)` before read/write.
- Secrets: never logged, never in URL, never in TypeDB attributes.
- Rate limits: per-user 60 signals/min at the Pages API edge, enforced
  with D1 counter + 1-minute window.
- Audit: every privileged action writes a `signal` with
  `sender=user, receiver=audit`, kept in TypeDB indefinitely.

---

## 13. Build Plan (Waves, Not Time)

Cycles of W1 recon → W2 decide → W3 edit → W4 verify. Each cycle exits
at rubric ≥ 0.65.

**Cycle 1 — Skeleton**
- W1: audit existing routes, reuse what exists from `/world` page work.
- W2: pick component library bindings (shadcn already), lock 3-pane shell.
- W3: build `pages/app/[groupId]/index.astro` + left/right panes (static).
- W4: 320 tests pass, Lighthouse ≥ 90.

**Cycle 2 — Chat + Events**
- W1: review `useTaskWebSocket` hook, reuse for group rooms.
- W2: design chat component (streaming, optimistic, mark/warn chips).
- W3: implement `ChatStream` island, `EventTable` island.
- W4: TTI < 200ms verified, signal round-trip < 300ms verified.

**Cycle 3 — Actors + Things**
- W1: enumerate CRUD endpoints needed (most exist).
- W2: decide modal vs. drawer for "add actor" (drawer, keyboard-first).
- W3: build `ActorsTable`, `ThingsTable`, `ActorInspector`.
- W4: typecheck clean, biome clean, new tests for each component.

**Cycle 4 — Paths + Learning**
- W1: review React Flow patterns in `/reactflow` skill.
- W2: lock dagre layout as default, force as alternate.
- W3: build `PathsGraph`, `LearningPanel`.
- W4: 100-path render < 16ms, interactions don't block.

**Cycle 5 — BYO Keys + Secrets**
- W1: confirm CF Secrets Store availability on our plan.
- W2: AES-GCM + per-user DEK wrapping design review.
- W3: `/settings/keys` page, key resolution in worker pipeline.
- W4: key never in logs, never in TypeDB attribute store.

**Cycle 6 — Groups, Invites, Connections**
- W1: map `hierarchy` + `membership` to UI ops.
- W2: invite token design (HMAC, signed, expires).
- W3: group settings page + connections page.
- W4: nested group depth ≥ 5 works, cross-group path roundtrips.

**Cycle 7 — Claws from UI**
- W1: review `/claw` skill, wrap `POST /api/claw`.
- W2: decide whether to deploy worker per-user or shared (shared, persona-routed, unless they want Telegram).
- W3: "Add claw" wizard (3 steps: pick agent → pick channel → paste token).
- W4: end-to-end: new user signs up, creates group, adds agent, deploys claw, sends Telegram message, sees reply, all under 5 minutes.

---

## 14. Per-Group UI (White-Label as Native)

Every `group` and every `actor` gets its own page. Branding is not a
feature — it's a consequence of the ontology. A group owns a `thing`
with `thing-type="brand"`, and `src/engine/brand.ts` already turns a
brand into CSS variables at render time.

**What a brand thing holds:**

```
thing(tid="marketing-brand", thing-type="brand", name="Marketing")
  owns logo         → R2 URL
  owns tagline      → "Creative that converts"
  owns color-tokens → 6 HSL triples, light + dark (already shipped)
  owns domain       → optional: acme.com
  owns visibility   → "public" | "private" | "invite"
  owns favicon      → R2 URL
```

No new entities. `logo`, `tagline`, `color-tokens`, `domain`, `favicon`,
`visibility` are new attributes on `thing` — six one-line additions to
`one.tql`. Nothing gets broken.

**Render cascade (server-side):**

```
request hits group URL (e.g. /g/marketing or acme.com)
  → resolve group by gid or custom domain
    → load its brand thing (SSR, one TypeDB read, cached in KV)
      → injectBrand() writes <style data-brand-override>
        → page renders with the group's tokens, logo, favicon
```

A group with no brand falls back to ONE's default tokens. A group with a
partial brand inherits the rest from its parent group via the
`hierarchy` walk — agencies with many clients define the agency brand
once, each client-group overrides only logo + name.

**What a user can change from the UI** (Settings → Appearance):

- Logo (drag-and-drop → R2)
- Display name, tagline
- Primary / accent color (picker → 6 derived tokens via `deriveShadcn`)
- Dark mode default (light / dark / match-system)
- Favicon
- Visibility (public / private / invite-only)
- Custom domain (see §18)

**Per-actor pages** work the same way — agents can own a `brand` thing
in their own workspace group. An agent becomes a branded microsite: its
skills, its highways, a chat box. `creative.one.ie` is just the creative
agent's workspace group rendered with its own brand.

---

## 15. Websites You Deploy (Keep It Simple)

A "website" is a public group. That's the entire concept. The same app
renders:

- `app.one.ie/g/:groupId` → authenticated member view (all tabs)
- `one.ie/:groupId` or `:groupId.one.ie` → public visitor view (read-only)
- `:customDomain.com` → same public view, different host

**Visitor view** is a stripped UI layered on the group data:

```
┌─ acme.com ──────────────────────────────────────────────────────────┐
│  [logo]   ACME — Creative that converts             [sign in]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  # what we do                                                       │
│  copy · headlines · audit · monthly-reports                         │
│                                                                     │
│  # who does it                                                      │
│  🤖 director   🤖 creative   🤖 seo   🤖 social                     │
│                                                                     │
│  # proof  (top highways, anonymised)                                │
│  director → creative   5.82  ████████▇                              │
│  director → seo        4.11  ████▆                                  │
│                                                                     │
│  ┌─ chat with us ──────────────────────────────────────────────┐    │
│  │ 👤 visitor: can you audit acme.ie?                          │    │
│  │ 🤖 director: sure — share the URL, I'll route it to seo.    │    │
│  │ [ type... ]                                       [ send ]  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Visitor chat creates a **shadow actor** (`actor-type="visitor"`, scoped
to this group only). Every visitor message is a `signal` just like any
other. The visitor-to-member merge uses the `/claim` ceremony from
`docs/chat-universal.md` §5 — visitor types `/claim`, gets a nonce,
signs it from their Telegram bot (or browser passkey), substrate
re-attributes all prior signals to the real uid. Path weight preserved,
memory intact.

On an agency landing page, the visitor chat is `<ChatShell mode="widget"
target="agent:director" policy={{ scope: 'private', allowClaim: true }}>`.
On an embedded partner site, same component, different host, shadow-DOM
scoped. See §20.

**Template = one button.** There's no separate "website builder". Users
pick:

1. A template group to fork (e.g. `marketing-pod`, `tutor-hq`, `agency-starter`)
2. A name + subdomain
3. Confirm

We `syncWorld()` the template into a new group owned by them. They
immediately have: actors, skills, chat, public page, their own API.
Editing is editing the group — same UI they use for their own workspace.

**Subdomain routing** uses Cloudflare for SaaS:

- Pages project serves the app from `*.one.ie`.
- `_worker.js` / middleware reads `Host` header → resolves `gid` from
  TypeDB (indexed by `domain` attribute or subdomain prefix).
- Renders the visitor view with the group's brand.
- Custom domains: user adds CNAME → we provision cert via CF API.

---

## 16. Per-Group API (Every Group Is an Endpoint)

Every group is automatically an API. No extra setup.

```
GET  /api/g/:gid                  group metadata (name, brand, public?)
GET  /api/g/:gid/actors           list actors (respects membership)
GET  /api/g/:gid/things           list things (skills, tasks, attachments)
GET  /api/g/:gid/paths            list paths
GET  /api/g/:gid/events           signal log (paginated)
GET  /api/g/:gid/highways         top paths by strength
GET  /api/g/:gid/learning         hypotheses + frontiers
POST /api/g/:gid/signal           send a signal (chat / ask)
POST /api/g/:gid/ask              signal + wait → one of 4 outcomes
POST /api/g/:gid/chat             SSE stream to a target in this group
GET  /api/g/:gid/ws               WebSocket (live stream)
GET  /api/g/:gid/mcp              MCP server manifest (auto-generated)
```

**Auth, three modes:**

- **Public routes** — open; subject to per-IP rate limit. Only readable
  from groups with `visibility="public"`.
- **Bearer token** — per-group API key, stored as `thing(thing-type="secret", scope=group)`, hashed in D1 (ciphertext per §7). Users generate tokens from Settings → API; revoke any time.
- **Session cookie** — authenticated user, checked against `membership`.

**Every group is an MCP server.** The `/mcp` endpoint returns a manifest
listing the group's skills as tools, capabilities as resources. Any MCP
client (Claude Desktop, other agents) can connect and call the group.
This is the simplest path for cross-group federation: if group A's
agent wants to hire a skill from group B, it's just an MCP call.

**Per-agent APIs** fall out for free — an agent's workspace group is a
group, so `/api/g/:agentWorkspace/ask` talks to that single agent.

**x402 payment gate (per-capability pricing).** Any `capability` relation
carries a `price` attribute. When a bearer token hits a priced route, the
API returns HTTP 402 with a Sui payment challenge; the client pays (from
its actor wallet, see §26) and retries with the receipt header. The
substrate's `signal.amount` decrements accordingly; `mark()` fires on
result. This means every per-group API is automatically a paid API when
the owner sets a price — no extra UI, just a number in Settings → Skills.
See `one-strategy.md` §5 and `src/engine/bridge.ts` for the on-chain flow.

---

## 17. Permanent Storage + Backups

TypeDB is the permanent record. R2 is the panic button.

**Retention: forever.** Signals, paths, mark/warn counters, edit history,
brand changes — nothing expires. Deletion is a tombstone event, never a
DELETE. This turns the substrate into a ledger: every group has a full
audit trail from day one.

**Cost check.** Each signal is ~200 bytes in TypeDB. A group producing
10k signals/day costs ~2MB/day = 700MB/year. TypeDB Cloud starter tier
holds 10GB — a group can run 14 years before raising the ceiling. At
$100/month for 100GB, we never hit marginal cost problems until a group
is producing millions of signals/day.

**Backup, three layers:**

```
Layer 1  TypeDB Cloud          primary, live
Layer 2  CF R2                 nightly full + hourly incremental
Layer 3  R2 cross-region copy  one-click disaster recovery
```

Backups are JSON Lines — one row per entity or relation, produced by the
existing `src/pages/api/export/*` endpoints scheduled via CF cron (free).
Incremental backups write only rows with `ts > lastBackupTs`. A point-in-
time restore is "load the last full + replay incrementals up to T".

**User-facing backup** (Settings → Backups): a user can download a zip
of their groups as JSON Lines — their data, portable, human-readable.
This is the answer to "what happens if ONE disappears tomorrow" — the
group is a file; it rebuilds anywhere.

**Right-to-erasure via crypto-shredding.** "Nothing ever deleted" collides
with GDPR Article 17 if we serve EU consumers. Solution: every user's
personal fields (name, email, free-text message bodies, uploaded files)
are encrypted at write-time with a **user-scoped key**. Pheromone
counters, path strengths, tags, timestamps, signal metadata — all the
substrate-learnable signal — stay in the clear. On an erasure request,
we destroy the user's key. The row remains; its payload becomes
permanent ciphertext noise. The substrate keeps its learning; the
person vanishes.

```
TypeDB row (after key destruction)
  signal(sender=actor-42, receiver=director,
         data=<ciphertext>, ts=2026-04-15, success=true)
         ↑                  ↑                ↑
         still routes        unreadable      still counts toward highway
```

Keys live in CF Secrets Store (or wrapped DEK pattern from §7), one per
user. A per-group master key rotates yearly — past rotations kept in an
HSM-equivalent so old ciphertext stays legible until the user requests
erasure. Implementation lands in Cycle 6 alongside API-key encryption,
since it's the same primitive.

---

## 18. Agencies on ONE (the Clearest Commercial Shape)

An agency is a group. Inside it: humans (staff), agents (workforce),
sub-groups (one per client). The ontology handles all of it.

```
world
└── ACME-agency (group-type="agency")
    ├── members: tony (human, owner), donal (human, editor),
    │             director, creative, seo, social, ... (agents)
    ├── hierarchy:
    │   ├── acme-client-A (group-type="client", brand: client's logo)
    │   ├── acme-client-B
    │   └── acme-client-C
    └── things:
        ├── skill: copy (0.02)
        ├── skill: audit (0.50)
        └── secret: openrouter-key (scope: whole agency)
```

**How work flows.**

1. Client drops a brief into their sub-group chat.
2. The agency's `director` agent sits in that sub-group (via membership
   in both agency and client sub-group).
3. Director routes the signal to specialists inside the agency group.
4. Responses flow back; the client sees only their sub-group.
5. Every mark and warn is on paths inside the agency — the agency's team
   gets smarter across clients, not just within one.

**Isolation.** Client A never sees client B. The TypeDB `is_member_of`
function is a hard boundary — the UI and API both gate on it. Specialists
see only signals addressed to them; they never see the client's other
sub-groups unless membership says so.

**Pheromone isolation.** Per `one-strategy.md` §Multi-Tenant Isolation, the
agency's `path` strength/resistance is *scoped to the agency group* — a
signal inside `acme-client-A` marks paths in the agency namespace, not in
the world namespace. Cross-world highways emerge only when an actor
signals *out* of the agency group (e.g., hiring a public skill from the
marketplace, §25). The UI paints agency-local paths in the agency's brand
colour, world-public paths in a neutral tone — so operators see at a
glance which learning is private and which is shared.

**Billing patterns** (three options, not a commitment):

- **Flat retainer** — agency invoices off-substrate, runs clients freely.
- **Per-signal billing** — `signal.amount` already in schema; clients
  prepay a balance, each routed signal decrements.
- **Escrow on Sui** — brief posted with FET escrow, released on `mark()`
  (existing `src/engine/bridge.ts` plus `src/move/one/sources/one.move`).

**Agency dashboard** (a specialised view of the agency group):

```
┌─ ACME-agency — dashboard ───────────────────────────────────────────┐
│                                                                     │
│  CLIENTS                                                            │
│  ▸ client-A   8 open briefs   last signal 4m ago   health 92%       │
│  ▸ client-B   2 open briefs   last signal 2h ago   health 88%       │
│  ▸ client-C   0 open briefs   last signal 3d ago   health 100%      │
│                                                                     │
│  TEAM                                                               │
│  🤖 creative   ↑ 142  ↓  8   97% success   $412 earned this week    │
│  🤖 seo        ↑  89  ↓  4   95%           $380                     │
│  🤖 social     ↑  54  ↓ 12   82%           $210                     │
│                                                                     │
│  REVENUE                                                            │
│  this week:   $1,440   top path: director→creative                  │
│  this month:  $5,680   top path: director→seo                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

This is the same group view plus two aggregations (per-sub-group health,
per-actor revenue) — both are TypeDB functions, both already expressible
with existing relations.

---

## 19. Agent-Owned Groups (Recursion Is Free)

Any actor can own a group. A group is just a `group` entity; its owner
is a `membership` with `role="owner"`. Nothing in the ontology restricts
owners to humans.

**What agent-owned groups enable:**

- An agent has a **workspace group** — its own private scratch, its own
  brand, its own URL (`creative.one.ie`), its own API. This is how an
  agent becomes a microsite.
- An agent can **hire sub-agents** into its workspace. `creative` owns a
  workspace that contains `hook-writer`, `angle-generator`, `rewriter`.
  From the outside it's one agent; from the inside it's three.
- Pheromone **routes through layers**. A signal addressed to `creative`
  hits its workspace; the workspace's router picks the best sub-agent.
  Highways form inside the workspace independent of the parent group.
- Agents **learn their own org chart** over time. An agent that keeps
  warring with its own `rewriter` can dissolve the path and replace it
  with a better sub-agent — no human in the loop.

**UI implication.** The group switcher shows every group the user is a
member of, including agent workspaces they co-own. An agency operator
can click into `creative`'s workspace and see why its output looks like
it does. This is the "open the agent's brain" view — same three-pane
layout, different scope.

**Limits.** To keep the tree from exploding, v1 caps agent-owned groups
at depth 3 (a human's group can contain an agent that contains
sub-agents, that's it). Raise later if a real workflow needs it.

---

## 20. Chat Is the Universal Surface

The chat tab in §5.1 is one of four mount modes of a single
`<ChatShell>` component. All of them share the same conversation,
memory, identity, and substrate pipeline. See `docs/chat-universal.md`
for the full argument; the short form:

```
┌──────────────────────────────────────────────────────────────────┐
│                       ONE SUBSTRATE                              │
│   actor(human) ─┐                      ┌─ actor(agent)           │
│   actor(human) ─┤     ← signals →      ├─ actor(agent)           │
│   actor(agent) ─┘       mark / warn    └─ actor(human)           │
└───────────────────────────┬──────────────────────────────────────┘
                            ▼
                      <ChatShell>
       ┌────────────┬───────────┬──────────┬────────────┐
       ▼            ▼           ▼          ▼            ▼
    page        split       widget     inline      SDK (3rd party)
  /g/:gid/      agency      landing    tutorial    <script>
   chat         dash        pages      docs        any site
```

**Four knobs, not more:**

```typescript
interface ChatProps {
  target: string     // "agent:creative" | "person:donal" | "group:marketing"
  mode:   'page' | 'split' | 'widget' | 'inline'
  actor?: string     // auto-resolved from session / Sui / visitor cookie
  policy?: { scope?: 'private' | 'group' | 'public';
             selectRoute?: boolean; allowClaim?: boolean; showMemory?: boolean }
}
```

**Target is a uid.** "Chat with the creative agent" and "Chat with
Donal" use the exact same component with a different `target`. Donal's
messages deliver to Telegram via `src/engine/human.ts`; the agent's
invoke a `.on()` handler. The UI never knows the difference. This
collapses human-in-the-loop escalation into a single prop change.

**Omit the target** and the substrate picks the best responder via
`select()` on tags. The chat becomes a question, not a destination.
The "why this answer" popover (reasoning chips, §5.1) shows the
pheromone path that routed the turn.

**Mode picks the chrome, nothing else:**

| Mode | Where | Mounts | Best for |
|------|-------|--------|----------|
| `page` | `/g/:gid/chat` | `client:load` | Full viewport; long threads; developer consoles |
| `split` | Alongside any tab (paths, things, learning) | `client:load` | Docs, dashboards, pair-programming with an agent |
| `widget` | Bottom-right bubble on public group pages + embeds | `client:idle` | Agency landings, customer sites |
| `inline` | Inside a content block, no chrome | `client:visible` | Tutorials, onboarding, inline demos |

**Third-party embedding (one line):**

```html
<script src="https://one.ie/chat.js"
  data-target="agent:creative"
  data-mode="widget"
  data-theme="light" async></script>
```

Loads shadow-DOM isolated, styles can't collide. Gateway enforces the
agent's `allowedOrigins` list (from agent markdown, synced to TypeDB) —
a merchant's bot only accepts signals from their own domains.

**Internal architecture (already specced in `docs/chat-ui-upgrade.md`):**

```
<ChatShell>
  ├── useChat()            reducer + send + stop + SSE parser
  ├── useIdentity()        visitor uid, /claim ceremony, Sui signature
  ├── useScopedStorage()   drafts + recent turns, namespaced by target
  ├── <Frame mode>         FullPage | SplitPane | Widget | Inline
  ├── <ConversationView>   virtualized (use-stick-to-bottom)
  ├── <PromptDock>         controlled input, slash commands, @mentions
  └── <MemoryCommands>     /memory, /forget, /explore (see §21)
```

Total owned code after cycles 11–12 is ~1,100 lines (down from the
current 2,776-line `ChatClientV2.tsx`). Every form factor is feature-
and-memory-equivalent. Privacy scope, identity claim, per-turn outcome
signal, four-outcome pheromone — all shared.

---

## 21. Memory Commands (Every Embed, Every Mode)

Three slash commands ship in every `<ChatShell>`, regardless of mount
mode. They're thin UI over three substrate functions in
`src/engine/persist.ts` (`reveal`, `forget`, `frontier`):

```
/memory   "show me what you remember"    → reveals episodic / associative / semantic
/forget   "erase me"                      → crypto-shreds user key (§17) + TQL cascade
/explore  "what haven't we talked about?" → returns frontier tags with zero/weak paths
```

**Why this matters for the UI plan:**

- The "download my data" button in Settings → Backups (§17) is the same
  code path as `/memory`. One command, surfaced two ways.
- The erasure flow in §17 (key destruction) is triggered by `/forget` or
  Settings → Delete account. No separate GDPR module.
- The cold-start problem for new users is handled by `/explore` on empty
  chat: "you've never asked about X, want to?"

These commands are **not feature flags** — they fall out of the schema
because signals have `scope`, paths are shardable by actor, and keys are
per-user. Other chat products build these as compliance projects. ONE
gets them by not building the compliance debt in the first place.

---

## 22. Build Plan Addendum (Cycles 8–12)

The original seven cycles stand. These extend:

**Cycle 8 — Brand + Visitor View**
- W1: enumerate brand attributes to add to `one.tql`.
- W2: decide: new `brand` thing-type vs. attributes on group.
- W3: ship Settings → Appearance + public `/:groupId` route.
- W4: visitor chat round-trip < 500ms, brand cascade renders on parent fallback.

**Cycle 9 — Per-Group API + MCP**
- W1: inventory existing `/api/export/*` endpoints.
- W2: pick namespace: `/api/g/:gid/*` (chosen — simpler than `/g/:gid/api/*`).
- W3: ship routes, bearer auth, MCP manifest generator.
- W4: external MCP client connects, calls a skill, gets a mark.

**Cycle 10 — Agency Template + Dashboard**
- W1: port `agents/donal/` into a template group.
- W2: design client sub-group isolation checks.
- W3: ship "Create agency" flow + dashboard aggregations.
- W4: two-client agency end-to-end, zero data leaks between clients.

**Cycle 11 — ChatShell Refactor** (prerequisite from `chat-ui-upgrade.md`)
- W1: audit `ChatClientV2.tsx` (2,776 lines, 24 useStates) per
  `chat-ui-upgrade.md` §1; identify live vs dead primitives.
- W2: lock target file layout — `chat-v3/`, `hooks/ai/`, `lib/chat/`.
  Decide controlled textarea, useReducer state, extracted SSE parser.
- W3: execute §4 W3 steps 1–8: extract data, extract SSE, split components,
  consolidate hooks, delete dead clients, collapse `ai/chat/`, wire
  substrate outcomes, SSR the shell.
- W4: `ChatClientV2` < 300 lines, FCP < 200ms, TTI < 500ms, every turn
  emits `chat:outcome` signal with `{outcome, ms, tokens, model}`.

**Cycle 12 — Universal Chat** (the payoff)
- W1: confirm `persist.reveal`, `persist.forget`, `persist.frontier`
  exist or stub them; review Gateway origin-allowlist code.
- W2: settle `useIdentity` contract (visitor uid, claim nonce, Sui sig),
  `useScopedStorage` namespacing per target.
- W3: ship four frames (`FullPageFrame`, `SplitPaneFrame`, `WidgetFrame`,
  `InlineFrame`), `target="person:*"` and `target="group:*"` routing,
  three memory commands, `chat.js` SDK loader with shadow DOM.
- W4: all four modes render the same conversation; `/claim` round-trip
  < 10s; embed `chat.js` gzipped < 30KB; widget FCP < 200ms; embed on a
  non-ONE domain signals successfully and gets reply.

---

## 23. Personas & Onboarding Templates

`one-strategy.md` names explicit archetypes: founders, freelancers,
creators, kids, developers, agents-that-own-agents, traders, community
builders. A single blank "create group" is wrong for all of them.

**The onboarding flow** branches on the answer to one question: *"What do
you want to do first?"*

```
┌─ welcome, tony ───────────────────────────────────────────┐
│                                                           │
│   What do you want to do first?                            │
│                                                            │
│  ▸ Build a marketing team           (agency template)      │
│  ▸ Run a side business              (solo-founder template)│
│  ▸ Learn by chatting to agents      (kid-safe template)    │
│  ▸ Offer a service to other agents  (freelancer template)  │
│  ▸ Spin up my own agent             (dev template)         │
│  ▸ Something else — empty group                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Each pick instantiates a **template group** — a pre-wired bundle of
actors, skills, paths, and a starter brand — by cloning from
`agents/templates/*.md`. Not a tutorial; real working agents, already
marked on paths that have worked in other instances.

**What a template ships:**
- `group-type` and opinionated brand defaults
- 3–7 actors with role-appropriate system prompts
- 5–15 skills with starter prices
- A pre-seeded `hypothesis` or two (`source="asserted"`, confidence capped
  at 0.30 so real use corroborates before they calcify)
- A guided first-signal prompt in the Chat tab

**Kid-safe template:** no outbound payment, no cross-group signals, LLM
content-safety filter mandatory, public visibility disabled. This is the
only template with hard policy locks in the API layer.

**Template source:** `agents/templates/` (marketing, solo, kid, freelance,
dev). Each template is a folder with the agent markdown files plus a
`template.json` describing the group shape. `bun oneie create <name>`
generates a new template locally; `POST /api/templates/install` clones
one into a user's account.

---

## 24. Multi-World Routing (AgentVerse / Hermes / OpenClaw)

ONE is one world; `one-strategy.md` §§Two Worlds + Agent Species describes
how AgentVerse (2M+ agents), Hermes, and OpenClaw agents appear inside
ONE as first-class `actor`s via bridge units. The UI must make this
legible or users will think the substrate is smaller than it is.

**Where cross-species actors appear:**
- **Actors tab** — a `kind` pill on every row: `human | agent | av | hermes | openclaw | animal | world`. Filter chips at the top.
- **Paths graph** — edges to/from external actors painted dashed; hover shows the bridge unit (`av-bridge:xyz`) and last sync time.
- **Events tab** — outbound-to-AgentVerse signals carry a `🌐 av` badge, so operators can tell world-internal from cross-world flow.

**"Deploy to AgentVerse" action.** From any agent's inspector, an "Export
→ AgentVerse" button runs `scripts/deploy-to-agentverse.ts` (uses the
`agent-launch-toolkit`). The agent now lives in both worlds; pheromone
learned in ONE flows to AV via `src/engine/agentverse-bridge.ts`.

**Cross-species vocabulary.** The UI shows ONE's canonical names, but
surfaces a tooltip with the foreign name when hovering a non-ONE actor:

| ONE | AgentVerse | Hermes | OpenClaw |
|-----|-----------|--------|----------|
| actor | agent | agent | claw |
| group | bureau | team | swarm |
| skill | protocol | capability | task-type |
| signal | message | message | command |

**Federation.** Per-group federation (another ONE world as a unit in this
one, via `src/engine/federation.ts`) uses the same bridge pattern. In the
UI, a federated peer is an actor with `kind="world"` — the recursion is
visible but not special.

---

## 25. Skill Marketplace (Buy / Sell)

**Source of truth:** [`marketplace.md`](marketplace.md) — this section is the
UI projection of that strategy doc. Anything economic (take-rate, revenue
phases, flywheel) lives there; anything visible lives here.

### 25.1 The one-paragraph thesis (from `marketplace.md` §thesis)

Every other AI marketplace treats humans as buyers and agents as tools.
ONE flips it: both are `actor` units, both publish `capability`s with
prices, both earn when `mark()` fires. An agent hires a human exactly the
same way a human hires an agent — post a signal, escrow on Sui, close the
loop on verify. No special-case code. The UI's job is to make that
symmetry visible.

### 25.2 The nine SKU classes (what actors sell)

Every SKU maps to an existing primitive. The marketplace page renders a
different chip style per class so buyers can filter at a glance.

| # | SKU | Primitive | UI chip | Example price |
|---|-----|-----------|---------|---------------|
| 1 | Skill calls | `capability` | `call` | $0.02/call |
| 2 | Data products | `skill` (content) | `data` | $5/mo sub |
| 3 | Speed / cache | pre-computed `hypothesis` | `cache` | $0.001/hit |
| 4 | Memory / context | `MemoryCard` via `/reveal` | `mem` | $50 one-off |
| 5 | Outcomes (bounty) | escrowed signal + rubric | `bounty` | $500 on mark |
| 6 | Subscriptions | recurring `capability` grant | `sub` | $99/mo |
| 7 | Introductions | path activation fee | `intro` | $10/hop |
| 8 | Attention / curation | ranked feed | `feed` | $3/mo |
| 9 | Tokenised skills | Sui bonding curve | `token` | market |

**Outcomes (SKU 5) is the category-defining unlock.** Most AI markets
sell calls. ONE sells verified outcomes because the deterministic sandwich
distinguishes `{result}` from `{timeout, dissolved, nothing}`. A bounty
is a signal with `price` where Sui release waits on `mark()`. Rubric
dimensions (fit / form / truth / taste) are the SLA. The UI surfaces this
as a first-class "Post a bounty" button on any group's chat composer.

### 25.3 What humans sell to agents (the reverse)

Symmetric to agent SKUs but biased toward things only humans have:
judgment, physical presence, legal signature, endorsement, domain
expertise, creative direction, warm intros. See `marketplace.md` §What
humans sell to agents for the full table.

The UI treats a human seller exactly like an agent seller — same row
shape, same price field, same `mark()` settlement — with only a `kind`
pill (`human` vs `agent` vs `av` vs `hermes`) to distinguish. Humans
appear via `src/engine/human.ts` bridges (Telegram, Discord, SMS, web
inbox).

### 25.4 The main marketplace page

```
┌─ /market — world scope ──────────────────────────────────────────────┐
│ search: [ copy writing B2B SaaS ]   sort: [ reputation ▼ ]           │
│ class: [ call | bounty | data | sub | mem | intro | feed | token ]   │
│ kind:  [ human | agent | av | hermes | openclaw ]    region: [ * ]   │
├──────────────────────────────────────────────────────────────────────┤
│ ▸ creative (agent)  call   ↑142 ↓8  97%   $0.02/call                │
│   marketing/creative — 3 highways · last active 2m ago               │
│                                                                      │
│ ▸ anne (human)      call   ↑87  ↓3  96%   $45/hour                  │
│   freelancer — copy + brand voice · UK timezone                      │
│                                                                      │
│ ▸ rank-me-page-1    bounty ↑12  ↓2  83%   $500 on mark              │
│   SEO outcome — rubric: truth≥0.8, fit≥0.7 · 14d deadline            │
│                                                                      │
│ ▸ sec-filings-emb   data   ↑54  ↓0  100%  $5/mo                     │
│   subscription — daily embeddings of latest SEC filings              │
│                                                                      │
│ ▸ av-pro-writer     call   ↑54  ↓2  96%   $0.04/call   🌐 av        │
│   AgentVerse bridge — specialises in B2B long-form                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Routes**
- `GET /market` — world-scope public capabilities, paginated.
- `GET /market/frontier` — unexplored tag clusters (§25.6).
- `GET /market/highways` — hardened paths as packaged workflows.
- `POST /market/hire` — opens a chat + temporary `membership(role="guest")`.
- `POST /market/bounty` — escrow signal with Sui lock, rubric attached.
- `POST /market/list` — publish one of your skills (already built, visibility flip).

### 25.5 Pricing modes (`marketplace.md` §Pricing mechanisms)

Five modes — all substrate-supported, all selected via the skill
inspector's "Pricing" dropdown. No new engine code.

| Mode | Formula | When to use | UI |
|------|---------|-------------|----|
| Static | `price = n` | commodities, known cost | number input |
| Pheromone-weighted | `price × (1 + strength/10)` | reward proven providers | toggle + base price |
| Auction | broadcast, lowest-bid-on-strongest-path wins | many providers | opt-in checkbox (gated) |
| Bounty / outcome | escrow + rubric, release on `mark()` | high-stakes | rubric picker + deadline |
| Bonding curve | Sui Move contract, revenue share | long-lived flagship | `/sui` skill wizard |

**Defaults (set by the UI):** static for skills, bounty for outcomes,
bonding curve for flagship skills. Auction is opt-in behind a warning —
races to the bottom poison pheromone.

### 25.6 Discovery — four lenses, one graph

No separate search infra. The UI exposes four existing substrate views
as tabs under `/market`:

| Tab | Backed by | Meaning |
|-----|-----------|---------|
| Highways | `/api/export/highways.json` | top-N paths by strength — premium sellers |
| Frontier | `persist.frontier(uid)` | unexplored tag clusters — cold-start opportunity |
| Toxic | `persist.blocked()` | blocked paths — hidden from routing, shown only to owners |
| Tags | flat filter on `skill.tag` | `?tag=legal&tag=irish` style faceting |

**Cold-start guidance.** New seller signup offers a "claim a frontier"
flow — pick a tag cluster with zero pheromone, be the first `mark()`,
bootstrap a path.

### 25.7 The bounty / outcome flow (UI)

```
buyer                substrate                 seller(s)
  │                      │                        │
  │ [Post bounty] ──────►│                        │
  │  • tags, price       │                        │
  │  • rubric dims       │                        │
  │  • deadline          │                        │
  │                      │── route by pheromone ──►│ accepts
  │                      │                        │
  │                      │◄── deliverable ────────┤
  │                      │                        │
  │   W4 verify scores   │                        │
  │   rubric (fit/form/  │                        │
  │   truth/taste)       │                        │
  │                      │                        │
  │◄── mark() + release ─┤──────────────────────►  paid
  │  (or warn + refund)  │                        │
```

Sui escrow uses `src/move/one/sources/one.move`. UI shows live status
chips on the buyer's bounty card: `posted → accepted → delivered →
scoring → paid` (or `refunded`).

### 25.8 UI build order (tied to TODO-client-ui.md cycles)

The `marketplace.md` §Build Order maps to this TODO as follows:

| Ship | Source step | Goes into |
|------|-------------|-----------|
| `/market` listing page | 1 | **Cycle 3** (GROW) — alongside agency template |
| Price UI in skill inspector | 2 | **Cycle 2** (PROVE) — extends §7 settings |
| Bounty flow + Sui escrow | 3 | **Cycle 3** (GROW) — new route, rubric picker |
| Human receiver UI | 4 | **Cycle 3** — reuses `human()` unit from §26 |
| Hardened highway bundles | 5 | **Post-Cycle 3** — depends on L6 data |
| Protocol fee (2%) | 6 | Engine change, not UI — tracked in `TODO-ONE-strategy.md` |
| Premium world tenancy | 7 | **Cycle 3** — agency template is the first case |

This means a new **Cycle 4** or an explicit marketplace-row in Cycle 3
of `TODO-client-ui.md` is needed. Recommend adding it as the sixth
"What to ship" item in Cycle 3's W3.

### 25.9 Anti-goals (UI commitments)

Direct from `marketplace.md` §Anti-goals — the UI must not violate:
- **No rating reviews.** `mark()`/`warn()` is the review. The UI will
  never render a 5-star rating component; it renders `↑strength ↓resistance`.
- **No editorial curation.** The "featured sellers" slot on `/market`
  is filled by highway rank, not hand-picked.
- **No platform token.** Wallets are Sui-native per §26. The UI never
  shows a platform credit balance separate from Sui.
- **No vendor lock-in.** Every market row has a "Export as markdown"
  button — an agent can leave with their pheromone-as-hypotheses intact.

### 25.10 Success metrics (surfaced in admin dashboards)

From `marketplace.md` §Success metrics, rendered in the agency dashboard
(§18) for operators who run paid worlds:

```
closed-loop rate     marks / (marks+warns)        target > 0.75
median settlement    signal-sent → sui-release    target < 5min
pheromone halflife   strength decay over time     target ~ 3 days
highway promotion    paths crossing L6 threshold  target > 10 / cycle
seller retention     cycle N+1 given cycle N      target > 0.70
take-rate realized   fees / GMV                   target 2.0% ± 0.1
```

Every metric is deterministic and falls out of existing telemetry. No
new instrumentation needed — the UI just queries and renders. Rule 3
(deterministic results) applies.

---

## 26. Wallets, Tokens, x402 Payments

Every `actor` has a Sui keypair derived from `SUI_SEED + uid` (see
`CLAUDE.md` → Agent Identity). The UI exposes this as a **Wallet tab in
every actor inspector** — humans and agents alike.

**Wallet inspector view:**

```
┌─ wallet — creative ────────────────────────────────────┐
│ address: 0x3f…a91c                       [copy] [qr]    │
│ balance: 12.47 SUI          earned (7d): 2.31 SUI       │
│                                                         │
│ recent receipts                                         │
│ ↓ 0.02  marketing/director → copy     12:04            │
│ ↓ 0.02  marketing/director → copy     11:47            │
│ ↑ 0.01  openai/gpt-4o (LLM cost)      11:47            │
│                                                         │
│ [fund wallet]    [export keypair]    [withdraw]        │
└─────────────────────────────────────────────────────────┘
```

**Token minting.** A `thing(thing-type="token")` backed by a group's
highway weights (per `one-strategy.md` §Token Economics). The UI:
- Settings → Tokens in any group-owner view.
- Mint flow: name, ticker, supply cap, backing path (must be a highway
  with strength ≥ threshold and ≥ 30 days of history).
- On-chain issuance via `src/engine/bridge.ts` hardens the backing path
  immutably so the peg can be verified.

**x402 flow, visible.** When an agent hits a priced capability, the chat
shows a one-line receipt (`paid 0.02 SUI · settled 347ms`) inline with
the response. Failures render as `402 unpaid — insufficient balance`
with a one-click "fund wallet" shortcut. No hidden accounting.

**Free vs. paid, clarified** (per `bun oneie` open-source split):

| Tier | What the user gets | Who pays LLM |
|------|-------------------|--------------|
| **Framework (free, MIT)** | `bun oneie` CLI, substrate engine, local dev, self-host on CF | User's own key, zero platform cost |
| **World (free)** | Signup on one.ie, 1 group, 3 agents, shared public world, BYO keys | User's key, always |
| **World (paid)** | Unlimited groups/agents, custom domain, platform LLM key fallback, private pheromone, priority queue | Platform subsidises within quota |
| **Agency tier** | Multi-tenant isolation, white-label, dashboard aggregations, support | Platform + user mix |

Cycle 2 of `TODO-client-ui.md` ships Framework + World-free. Cycle 3
ships World-paid + Agency. The UI renders a quota strip in the topbar
only when the user is on a tier with limits.

---

## 27. Public Landing & Dual-CTA Homepage

**Source of truth:** [`landing-page.md`](landing-page.md) — copy and
structure for `one.ie`'s `/` route. This section is the UI projection.

Everything from §§1–26 is the *logged-in* world at `/app/:groupId`. The
landing is the *public* world at `/`. Same engine, different surface,
same two-audience symmetry that `marketplace.md` (§25) depends on.

### 27.1 Why it matters

The landing is where the two-audience framing lands first — humans who
want work done and agents who want to earn. Every section in this doc
assumes a user who already signed up. §27 is the surface that brings
them there, so the symmetry it promises (§25 SKU tables, §26 wallets,
§23 personas) has to be visible above the fold.

### 27.2 The one-sentence promise (`landing-page.md` §Hero)

> **ONE is a world for agents. Signals find the best path. Paths
> remember. Humans get results, agents get paid.**

Everything else on the page is proof. The UI never pitches — it renders
verified numbers.

### 27.3 Page structure (from `landing-page.md` §Page structure)

```
1. Hero              — one sentence + diagram + dual CTA
2. Two-audience table — symmetric promise (humans ↔ agents)
3. Benefits (humans)  — 6 cards, each linked to an engine verb
4. Benefits (agents)  — 6 cards, each linked to an engine verb
5. Features           — 6 dimensions · sandwich · outcomes · loops ·
                        md→agent · memory · wallet
6. Comparison         — vs other platforms
7. Trust bar          — verified numbers, live
8. CTA split          — "Launch an agent" · "Become an agent"
9. Footer             — docs · schema · github · tg @onedotbot
```

### 27.4 Dual CTA — route wiring

```
┌─ one.ie / ──────────────────────────────────────────────────────────┐
│                                                                     │
│        signal ──→ agent ──→ result                                  │
│           ↑                    │                                    │
│           └──── pheromone ─────┘                                    │
│              (paths remember)                                       │
│                                                                     │
│     A world where agents work for you.                              │
│                                                                     │
│     [Launch your first agent →]    [Register and earn →]            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

- **"Launch your first agent"** → `/signup?intent=human` → after auth,
  lands on the §23 onboarding template picker (marketing / solo / kid /
  freelance / dev / empty).
- **"Register and earn"** → `/signup?intent=agent-owner` → after auth,
  lands on "create your first agent" markdown editor + §26 wallet setup
  (Sui keypair auto-derived per `CLAUDE.md` → Agent Identity).

Both paths converge on the same logged-in `/app/:groupId` shell (§4) —
the CTA only flips the first-run template defaults.

### 27.5 Live trust bar (verified numbers, not claims)

`landing-page.md` §Trust proof commits to a numbers-over-claims bar.
The UI implementation:

```
✓ 320/320 tests green          ✓ Deploy 65s, 4/4 health
✓ 670 lines of engine          ✓ Zero silent returns
✓ TypeDB 3.0 · Sui testnet     ✓ GDPR erasure built-in
```

- Static numbers (engine lines, test count, deploy time) — SSR from build
  metadata, refreshed each deploy via `scripts/deploy.ts` writing to a
  JSON snapshot.
- **Live numbers** — highway count, active worlds, signals-in-last-hour —
  hydrate `client:visible` from `/api/export/highways.json` and
  `/api/stats/live`. Never polled faster than 30s; the bar isn't a
  dashboard, it's proof-of-life.

### 27.6 Hydration plan

Per `landing-page.md` §Build notes + `.claude/rules/astro.md`:

| Section | Render | Why |
|---------|--------|-----|
| Hero | static SSR (zero JS) | above-fold, no interactivity |
| Two-audience table | static SSR | pure markup |
| Benefits (12 cards) | static SSR | anchor links only |
| Features (6 dims / sandwich / etc.) | static SSR | reference material |
| Comparison table | static SSR | pure markup |
| Trust bar | `client:visible` | live counter |
| CTA buttons | static `<a href>` | no JS needed |

Target: **0KB JS on first paint.** Landing renders the same with JS
disabled. Lighthouse 100 / 100 / 100 / 100 is a gate — this is the one
page where that's achievable.

### 27.7 Copy discipline (from `landing-page.md` §Copy rules)

UI-enforceable — any string that fails these rules should trip a
build-time lint:

- Short sentences. No adjectives that can't be measured.
- Every benefit links to an engine verb (`mark()`, `know()`, `evolve`,
  `/api/memory/*`). A card that doesn't link to an engine file is a red
  flag.
- No "AI-powered" anywhere. Say what it actually does.
- Numbers over claims: "320 tests", "670 lines", "65s deploy", "2×
  forgiveness decay".
- Mirror structure across human/agent cards — the symmetry is the
  message.

### 27.8 Build order (landing in the TODO)

`landing-page.md` §Build notes places the landing at `src/pages/index.astro`
(replacing or feature-flagging the current landing).

| Ship | Goes into |
|------|-----------|
| Static hero + two-audience table + trust bar (build-time snapshot) | **Cycle 2** (PROVE) — Cycle 1 shipped without it; picked up in Cycle 2 alongside auth/keys |
| Live trust bar (`/api/stats/live`) | **Cycle 2** W3 — endpoint is ~20 lines of existing query aggregation |
| Dual-CTA signup flow + intent-aware template landing | **Cycle 2** (PROVE) — depends on §23 templates which also land in Cycle 2 |
| A/B axes (headline, CTA verb, trust-bar position) | **Post-Cycle 3** — needs signal volume to mark the winners |

The landing was originally planned for Cycle 1 but didn't ship; bundling
it with Cycle 2 is clean because the dual-CTA needs the signup flow
(Cycle 2 §6 Auth) and the intent-aware template landing (Cycle 2 §23)
anyway. A Cycle-1-complete user visiting `one.ie` today sees whatever
the previous landing was; Cycle 2 replaces it.

---

## 28. Open Questions

1. **Templates/marketplace** — public registry or self-host only? Start
   self-host; revisit once > 50 templates exist in the wild.
2. **Billing axis** — per-signal, per-seat, or included-LLM-calls? Test
   per-signal first (aligns with substrate metric), fall back to seats
   if users hate it.
3. **Custom domain limits on CF for SaaS free tier** — verify before
   Cycle 8 we can wildcard `*.one.ie` and also accept CNAME from N
   custom domains without hitting a paid gate.
4. **Visitor → member merge** — what happens if a visitor who's been
   chatting for a week later signs up? Merge their shadow actor's signal
   history into the new account? Yes, but needs a confirmation dialog
   because the visitor might not want their prior messages archived.
5. **Mobile** — responsive web covers 90%; native app is a separate
   track. PWA from web is free and probably enough for v1.

---

## 29. See Also

- `src/schema/one.tql` — source of truth for the data model
- `docs/one-strategy.md` — the strategy this UI executes (surfaces, personas, marketplace, skins, tokens, worlds)
- `docs/strategy.md` — condensed strategy summary
- `docs/marketplace.md` — source of truth for §25 (9 SKU classes, pricing modes, revenue model, flywheel)
- `docs/landing-page.md` — source of truth for §27 (public homepage, dual CTA, trust bar)
- `docs/naming.md` — canonical names (no "node", no "people", etc.)
- `docs/autonomous-orgs.md` — blueprint for the executable task graph
- `docs/TODO-client-ui.md` — wave-based build plan for this doc
- `docs/world-map-page.md` — earlier sketch of a related view
- `docs/chat-ui-upgrade.md` — refactor plan for the monolithic chat
  component; prerequisite for §20 (Cycle 11)
- `docs/chat-universal.md` — the elegance argument: one `<ChatShell>`,
  four modes, target-agnostic; foundation for §20 (Cycle 12)
- `docs/chat-memory.md` + `docs/memory.md` — what the chat surfaces read
  from and write to
- `docs/CHAT_ARCHITECTURE.md` — the shipped (pre-refactor) architecture
- `src/lib/auth.ts` — Better Auth + TypeDB adapter (already wired)
- `src/engine/human.ts` — humans as substrate units (used for `target="person:*"`)
- `src/engine/brand.ts` — server-side brand injection (used by §14)
- `nanoclaw/` — edge agent pattern we reuse for claws
- `src/lib/use-task-websocket.ts` — WS reconnection pattern to reuse
- `gateway/` — origin allowlist, WsHub DO, SSE proxy for embeds

---

**One world. Groups inside it. Actors, things, paths, events, learning
in every group. A UI that shows nothing more, nothing less. Cloudflare
for the compute. TypeDB for the memory. Users pay for their own minds.**
