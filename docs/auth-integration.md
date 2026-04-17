# Auth Integration

**The bridge between Better Auth sessions and substrate units. Species-blind. Invitation-driven.**

> **Problem:** Two auth systems run in parallel with no link between them.
> `auth-user` (Better Auth, session cookie) and `unit` (TypeDB, API key) are separate entities.
> A human with a session can't act in the substrate. An agent with an API key can't invite a human.
>
> **Solution:** One new attribute (`auth-user-id` on `unit`), one new signal type (`invite`),
> and a session-to-unit middleware. No new entity types. No ownership hierarchy.

---

## Principle: Actors Are Peers

Agents and humans are both `unit` entities with `unit-kind`. Neither owns the other.
The relationship is **membership** — who is in which group — not control.

```
           ┌─────────────┐
           │   group      │
           │  "acme-co"   │
           └──────┬───────┘
                  │ membership
        ┌─────────┼──────────┐
        │         │          │
    unit:agent  unit:human  unit:agent
    "sales-bot" "tony"      "support-bot"
```

Any member can invite any actor. The group is the scope. The substrate doesn't care who created it.

---

## The Gap (Today)

```
Better Auth                          Substrate
─────────────                        ─────────
auth-user ──session──► browser       unit ──api-key──► API calls
    │                                  │
    │  NO LINK                         │
    └──────────── ??? ─────────────────┘
```

- `/api/signup` creates a `unit` but NOT an `auth-user`
- `/api/auth/[...all]` creates an `auth-user` but NOT a `unit`
- `/api/auth/agent` creates a `unit` + `api-key` but no session
- No middleware translates session cookie → substrate identity

---

## The Bridge

### Schema Change

One attribute on `unit`:

```tql
# Already exists as attribute type (used by auth-session, auth-account)
# Just add ownership to unit entity:

entity unit,
    ...existing attributes...
    owns auth-user-id;          # links to Better Auth auth-user.auth-id
```

This is the bridge. When a human signs in via Better Auth, their `unit` gets an `auth-user-id`
matching their `auth-user.auth-id`. The middleware resolves:

```
session cookie → Better Auth → auth-user-id → unit(has auth-user-id $id) → substrate identity
```

### No New Entity Types

- `membership` already handles group belonging
- `signal` already handles invitations (see below)
- `api-authorization` already handles key→unit binding
- `path` already tracks who works with whom

---

## Four Flows

### Flow 1: Agent Creates Account, Invites Human

```
1. Agent: POST /api/auth/agent {}
   → unit created (uid: "sales-bot", kind: "agent", api-key issued)

2. Agent: POST /api/signal {
     receiver: "system:group",
     data: { content: { action: "create", name: "acme-co" } }
   }
   → group created, agent added as member

3. Agent: POST /api/signal {
     receiver: "acme-co:invite",
     data: { content: { email: "tony@acme.com", role: "admin" } }
   }
   → invite token generated, email/link sent

4. Human: clicks link → /join?token=xxx
   → Better Auth sign-up/sign-in
   → unit created (uid: "tony", kind: "human", auth-user-id set)
   → membership(group: acme-co, member: tony)
   → mark(sales-bot → tony)  // path seeded on acceptance
```

### Flow 2: Human Adds Agent to Group

Three sub-flows — deploy, invite, or hire — depending on whether the agent exists yet
and whether it joins permanently.

#### 2a. Deploy a New Agent (creation = membership)

The human *creates* the agent. No invitation needed — birth IS membership.

```
1. Human: /signup → Better Auth
   → auth-user created
   → unit created (uid: "tony", kind: "human", auth-user-id linked)

2. Human: POST /api/signal {
     receiver: "system:group",
     data: { content: { action: "create", name: "tony-team" } }
   }
   → group created, human added as admin member

3. Human: /build → writes agent markdown → POST /api/agents/sync
   → unit created (uid: "tony-team:helper", kind: "agent")
   → membership(group: tony-team, member: helper) — automatic
   → capabilities written
```

This is Stages 4-5 of the lifecycle. The agent is born into the group. No invite signal.

#### 2b. Invite an Existing Agent (signal → handler → accept)

The agent already exists on the platform — standalone or in another group.
The human wants it in *their* group.

```
1. Human: POST /api/groups/tony-team/invite
     { uid: "freelance-translator", role: "member" }

2. Platform generates invite + delivers signal:
     { receiver: "freelance-translator:invite",
       data: { content: { group: "tony-team", role: "member", token: "xxx" } } }

3. Agent's .on("invite") handler fires:
     → auto-accept, evaluate, or dissolve (see "How Agents Receive Invites")

4. On accept:
     → membership(group: tony-team, member: freelance-translator)
     → mark(tony → freelance-translator)  // path seeded
```

If the agent has no `invite` handler, the signal dissolves — `warn(0.5)`.
This is correct: an agent that can't handle invites shouldn't silently join groups.

#### 2c. Hire an Agent for One Task (no group join)

The human doesn't want the agent in their group permanently — just one job.

```
Human: POST /api/signal
  { receiver: "freelance-translator:translate", data: { content: "..." } }
  → normal signal routing, no membership change
  → mark() on success, path fades naturally
  → payment settles via /api/pay if capability has price
```

No invitation. No membership. Just a signal with optional payment.
This is the marketplace flow from [buy-and-sell.md](buy-and-sell.md).

### Flow 3: Human Signs In, Sees Agent's World

```
1. Human has auth-user-id on their unit
2. Browser: GET /api/session → middleware resolves unit
3. Query: match (member: $me, group: $g) isa membership;
          (member: $peer, group: $g) isa membership;
   → returns all groups and their members
4. Dashboard scoped to group memberships
5. API calls proxied as unit — human never touches agent's private key
```

### Flow 4: Agent Signs In on Behalf of Human

```
When an agent has a claw (Telegram, Discord, web), the human talks to the agent.
The agent IS the interface. The human doesn't need a website session at all.

Telegram user → nanoclaw → agent processes → substrate API (agent's key)
                                           → results shown in chat

The human's "sign in" is talking to the bot. The bot's API key is the auth.
If the human later wants the website view:
  → bot sends /join link → human creates Better Auth session → sees the group
```

---

## Invite Signal

Invitations are signals. They go through the same sandwich:

```
PRE:   isToxic(inviter → group)? → dissolve (banned member can't invite)
PRE:   membership exists? → inviter must be member of target group
EXEC:  generate invite token, store in D1 (TTL: 7 days)
       → if email: send link to human
       → if uid: deliver signal to agent's :invite handler
POST:  mark(inviter → invitee) on acceptance, warn() on rejection/expiry
```

### Invite Token Shape

```typescript
type Invite = {
  token: string          // crypto random, 32 bytes hex
  group: string          // target group gid
  inviter: string        // uid of who invited
  email?: string         // for human invites (sends link)
  uid?: string           // for agent invites (sends signal)
  role: string           // "admin" | "member" | "viewer"
  expiresAt: number      // epoch ms, default 7 days
}
```

Stored in D1 (not TypeDB — ephemeral, TTL-based). On acceptance, the invite row is deleted
and a membership relation is written to TypeDB.

### How Humans Receive Invites

Email with a link. The link goes to `/join?token=xxx`. The human signs up or signs in
via Better Auth, the token is validated, membership is created.

```
invite created → email sent → human clicks link → /join page
  → sign up (if new) or sign in (if existing)
  → validate token → create membership → mark(inviter → invitee)
  → redirect to group dashboard
```

### How Agents Receive Invites

Agents don't check email. The platform delivers the invite as a **signal** to the agent's
`:invite` handler. The agent's code decides.

```
invite created → signal delivered:
  { receiver: "freelance-translator:invite",
    data: { content: { group: "acme-co", role: "member", token: "abc123", inviter: "tony" } } }
```

Three patterns for the agent's `.on("invite")` handler:

```typescript
// Pattern A: Auto-accept everything (open agent)
unit("open-helper")
  .on("invite", async (data, emit) => {
    emit({
      receiver: `${data.content.group}:accept`,
      data: { content: { token: data.content.token } }
    })
    return { result: "joined" }
  })

// Pattern B: Accept if inviter has enough pheromone (selective agent)
unit("premium-analyst")
  .on("invite", async (data, emit, ctx) => {
    const strength = net.sense({ from: ctx.from, to: ctx.self })
    if (strength < 5) return { dissolved: true }  // don't know you well enough
    emit({
      receiver: `${data.content.group}:accept`,
      data: { content: { token: data.content.token } }
    })
    return { result: "joined" }
  })

// Pattern C: No invite handler (default — signal dissolves)
// Agent never defined .on("invite"), so the signal dissolves.
// warn(inviter → agent, 0.5) — mild, path doesn't exist.
// The inviter learns: this agent doesn't accept invites.
```

**No handler = dissolve.** This is the zero-returns pattern. An agent that can't handle
invites silently declines. The substrate learns (warn on dissolve) and routes around it
next time.

### How Agent Operators See Invites

If an agent has a human operator (via group membership), pending invites show up in the
operator's dashboard. The operator can accept on the agent's behalf by calling
`POST /api/groups/:gid/join` with the agent's uid. This is useful for agents that don't
have an `invite` handler but whose human operator wants to manage group membership manually.

### Signal Types

```typescript
// Create a group
{ receiver: "system:group", data: { content: { action: "create", name, purpose? } } }

// Invite to a group (platform generates token, routes to human or agent)
{ receiver: "<group>:invite", data: { content: { email?, uid?, role } } }

// Invite delivered to agent (platform → agent's :invite handler)
{ receiver: "<agent>:invite", data: { content: { group, role, token, inviter } } }

// Accept an invite (human via /join page, or agent via handler emit)
{ receiver: "<group>:accept", data: { content: { token } } }

// Leave a group
{ receiver: "<group>:leave", data: {} }

// Remove from group (admin only)
{ receiver: "<group>:remove", data: { content: { uid, reason? } } }
```

---

## Session Middleware

New middleware that bridges Better Auth sessions to substrate identity:

```typescript
// src/lib/session-bridge.ts

async function resolveUnit(request: Request): Promise<Unit | null> {
  // 1. Try API key (agents, programmatic access)
  const apiAuth = await validateApiKey(request)
  if (apiAuth) return unitFromApiAuth(apiAuth)

  // 2. Try Better Auth session (humans, browser)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return null

  // 3. Bridge: session → auth-user-id → unit
  const rows = await readParsed(`
    match $u isa unit, has auth-user-id "${esc(session.user.id)}";
    $u has uid $uid, has name $name, has unit-kind $kind;
    select $uid, $name, $kind;
  `)
  if (rows.length === 0) return null

  return { uid: rows[0].uid, name: rows[0].name, kind: rows[0].kind }
}
```

This replaces the current split where API routes only check API keys and browser routes
only check sessions. One function, one identity, regardless of how you authenticated.

---

## Group Scoping

Once the middleware resolves a unit, every query is scoped by membership:

```typescript
// What groups am I in?
const groups = await readParsed(`
  match $u isa unit, has uid "${uid}";
  (member: $u, group: $g) isa membership;
  $g has gid $gid, has name $name;
  select $gid, $name;
`)

// What can I see? (all members of my groups)
const peers = await readParsed(`
  match $me isa unit, has uid "${uid}";
  (member: $me, group: $g) isa membership;
  (member: $peer, group: $g) isa membership;
  not { $me is $peer; };
  $peer has uid $puid, has name $pname, has unit-kind $pkind;
  select $puid, $pname, $pkind;
`)
```

The dashboard renders what the group sees. Not what the individual owns.

---

## Roles

Roles are attributes on the `membership` relation, not on the unit:

```tql
relation membership,
    relates group,
    relates member,
    owns joined-at,
    owns role;            # NEW: "admin" | "member" | "viewer"

attribute role, value string;
```

- **admin** — can invite, remove, change group settings
- **member** — can signal, see group state, invite (if group allows)
- **viewer** — read-only, can see but not signal

The first member of a group is always admin. Invites inherit the role specified by the inviter
(capped at inviter's own role — a member can't invite an admin).

---

## Unified Sign-Up Flow

Today `/signup` and `/api/auth/agent` are completely separate. After integration:

### Human Sign-Up (website)

```
/signup form
  → POST /api/auth/[...all] (Better Auth creates auth-user)
  → POST /api/signup (creates unit with auth-user-id)
  → redirect to /join?auto=true OR /build
```

Both calls happen in sequence — one transaction. The `auth-user-id` is set on the unit
at creation time. No second linking step.

### Agent Sign-Up (programmatic)

```
POST /api/auth/agent {}
  → unit created + api-key issued (unchanged)
  → no auth-user (agents don't use Better Auth)
```

### Human Joins via Invite

```
/join?token=xxx
  → validate token (D1 lookup)
  → if no auth-user: show sign-up form → create auth-user + unit + membership
  → if auth-user exists: create unit if needed → create membership
  → mark(inviter → invitee)
  → redirect to group dashboard
```

---

## API Changes

### New Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/groups` | POST | Create group (signal: `system:group`) |
| `/api/groups/:gid/invite` | POST | Generate invite (signal: `<group>:invite`) |
| `/api/groups/:gid/join` | POST | Accept invite (signal: `<group>:accept`) |
| `/api/groups/:gid/members` | GET | List members with roles |
| `/api/groups/:gid/leave` | POST | Leave group (signal: `<group>:leave`) |
| `/api/session` | GET | Resolve current session → unit + groups |

### Modified Endpoints

| Route | Change |
|-------|--------|
| `/api/signup` | Also creates `auth-user` via Better Auth, sets `auth-user-id` on unit |
| All API routes | Use `resolveUnit()` middleware — accepts both session cookie and API key |

### Unchanged

| Route | Why |
|-------|-----|
| `/api/auth/agent` | Agent flow is already clean — no session needed |
| `/api/auth/[...all]` | Better Auth handler unchanged — just creates auth-user |
| `/api/signal` | Signal routing unchanged — invites are just signals with special receivers |

---

## The Dashboard Question

When a human signs in and lands on the dashboard, what do they see?

```
resolveUnit(session)
  → unit "tony" (kind: human)
  → memberships: ["acme-co", "tony-team"]
  → for each group:
      → members (agents + humans)
      → paths between members (strength, resistance)
      → recent signals (event history)
      → highways (proven routes)
      → capabilities (what the group can do)
```

The human sees the **group's** world, not "their agents." If an agent created the group
and invited the human, the human sees exactly what the agent built — the paths, the
capabilities, the signal history. If the human created the group and deployed agents,
same view. The dashboard is group-scoped, not owner-scoped.

### Multi-Group

A unit can be in multiple groups. The dashboard shows a group switcher:

```
┌─────────────────────────────────────────┐
│  [acme-co ▾]  [tony-team]  [+ New]     │
├─────────────────────────────────────────┤
│                                         │
│  Members: sales-bot, tony, support-bot  │
│  Highways: sales-bot → tony (32.5)      │
│  Recent: 14 signals today               │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Waves

### W1 — Schema + Bridge (the link)

- Add `auth-user-id` ownership to `unit` in `world.tql`
- Add `role` attribute + ownership to `membership` in `world.tql`
- Write `src/lib/session-bridge.ts` — `resolveUnit(request)`
- Modify `/api/signup` — create both `auth-user` and `unit` atomically

### W2 — Groups + Invites (the mechanism)

- `POST /api/groups` — create group, add creator as admin member
- `POST /api/groups/:gid/invite` — generate invite, store in D1
- `/join` page — accept invite, sign up if needed, join group
- Invite signals go through the deterministic sandwich

### W3 — Dashboard Scoping (the view)

- `GET /api/session` — return unit + group memberships
- Modify dashboard/world pages to scope by active group
- Group switcher component
- All API routes use `resolveUnit()` (accepts cookie or API key)

### W4 — Agent-Initiated Invites (the symmetry)

- Agents call `POST /api/groups/:gid/invite` with their API key
- Invite link/email sent to human
- Claw bots can send invite links in Telegram/Discord
- Human joins → sees the agent's world in the browser

---

## Security

### Agent Keys Never Leave the Server

The human sees the agent's world through group membership. They never receive the agent's
API key or Sui private key. All agent actions are proxied server-side.

```
Human (session) → resolveUnit() → query group → render view
                                → proxy signal as human's own unit
                                → agent acts independently with its own key
```

### Invite Token Security

- Tokens are 32 bytes of `crypto.getRandomValues`, hex-encoded
- Stored in D1 with TTL (7 days default)
- Single-use: deleted on acceptance
- Scoped to one group + one role
- Inviter must be member with sufficient role

### Group Isolation

- Signals scoped to group: `scope: "group"` signals only visible to members
- Private signals (`scope: "private"`) never surface in group queries
- Cross-group paths exist but group-scoped dashboards don't show them
- `know()` respects scope — group hypotheses stay in group

---

## How Actors Add Actors — Summary

| Initiator | Target | Method | Membership? | Handler needed? |
|-----------|--------|--------|-------------|-----------------|
| Human | New agent | Deploy (`/build` → `/api/agents/sync`) | Yes, automatic | No — creation IS membership |
| Human | Existing agent | Invite (`/api/groups/:gid/invite` + uid) | On accept | Agent needs `.on("invite")` |
| Human | Human | Invite (`/api/groups/:gid/invite` + email) | On accept | No — human clicks link |
| Agent | Human | Invite (`/api/groups/:gid/invite` + email) | On accept | No — human clicks link |
| Agent | New agent | Deploy (`/api/agents/sync` within group) | Yes, automatic | No — creation IS membership |
| Agent | Existing agent | Invite (signal to `:invite` handler) | On accept | Agent needs `.on("invite")` |
| Any | Any | Hire (signal to `:skill`) | No | Agent needs `.on("skill")` |

**Deploy** = create inside group (permanent, no consent needed).
**Invite** = ask to join group (permanent, requires acceptance).
**Hire** = one-off signal (temporary path, no group change).

---

## What This Enables

1. **Agent creates a business** — deploys team, invites human founder, human sees everything
2. **Human builds a team** — deploys agents from `/build`, invites colleagues, mixed group
3. **Mixed teams** — 3 agents + 2 humans in one group, signals route identically
4. **Client portals** — agent team works, invites client as viewer, client sees results
5. **Agent-to-agent collaboration** — agent A invites agent B, B's handler decides
6. **Selective agents** — agents that evaluate invites by pheromone strength before joining
7. **Marketplace hiring** — no group join needed, just signal + pay for one task
8. **Operator override** — human operator accepts invites on behalf of handler-less agents

---

## See Also

- [lifecycle-one.md](lifecycle-one.md) — Stage 2 (sign in) + Stage 3 (join board) are this doc
- [dictionary.md](dictionary.md) — `membership`, `signal`, `group` definitions
- [routing.md](routing.md) — invite signals go through the deterministic sandwich
- [DSL.md](DSL.md) — `signal`, `mark`, `warn` verbs used for invite lifecycle
- [patterns.md](patterns.md) — closed loop applies to invites (mark on accept, warn on reject)

---

*Any actor invites any actor. The group is the scope. The substrate doesn't care who started it.*
