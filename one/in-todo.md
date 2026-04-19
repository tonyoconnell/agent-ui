---
title: TODO — /in Owner Inbox
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 12
completed: 0
status: ACTIVE
created: 2026-04-20
---

# TODO: /in Owner Inbox

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path. (See `.claude/rules/engine.md` → The Three Locked Rules.)
>
> **Parallelism directive (read first):** **Maximize agents per wave.** W1 ≥ 4
> Haiku (one per read target), W2 ≥ 2 Opus shards when findings exceed ~20,
> W3 = one Sonnet per file (never batch, never split), W4 ≥ 2 Sonnet verifiers
> sharded by check type. Sequential between waves, maximum parallel within.
>
> **Goal:** `/in` becomes the live owner inbox — replace static JSON with
> substrate + claw API data, absorb `ClawAdmin`, and give every group owner
> a unified surface to monitor actors, reply to conversations, and broadcast;
> `/chat-auth` stays public (everyone); `/app/[groupId]` stays for members.
>
> **Source of truth:**
> [debby-todo.md](debby-todo.md) — claw API routes already wired (W4 done),
> [groups-todo.md](groups-todo.md) — role lookup (`getRoleForUser(uid, gid)`) needed in C2,
> [DSL.md](one/DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark),
> [auth.md](auth.md) — API key flows, role lookup, session management
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** No `one.tql` changes required. `/in` projects existing entities:
> `actor` (students), `signal` (events/conversations), `group` (group scope).
> Live data replaces static `in.json` — same type shapes, different source.
>
> **Dependency:** C2 auth gate partially blocks on `groups-todo.md` Cycle 1
> (`getRoleForUser(uid, gid)` per-group role variant). C1 (live data + reply
> dock) ships independently.

---

## The Three Roles

```
/chat-auth          → everyone       (public onboarding: wallet → key → deploy → live)
/app/[groupId]      → members        (group workspace: Chat, Actors, Things, Paths, Events, Learning)
/in  (this TODO)    → owner          (operator inbox: live data, reply, broadcast, auth-gated)
```

**Signal flow:**
```
Claw API (/conversations, /messages/:group)   →  Events dimension in /in
Substrate (/api/actors, /api/signals)         →  Actors + all 6 dimensions
Owner reply → claw POST /conversations/:id/reply → student channel
Broadcast → claw POST /broadcast → all students
```

## Routing

```
signal DOWN                         result UP             feedback UP
──────────                          ─────────             ───────────
/do in-todo.md                      rubric marks          tagged pheromone
     │                                   │                     ▲
     ▼                                   │                     │
┌─────────┐                              │                     │
│  W1     │  Haiku recon ───────────────►│ mark(edge:truth)    │
│  read   │  (6 files, parallel)         │                     │
└────┬────┘                              │                     │
     ▼                                   │                     │
┌─────────┐                              │                     │
│  W2     │  Opus decide                 │                     │
│  fold   │  → diff specs                │                     │
└────┬────┘                              │                     │
     ▼                                   │                     │
┌─────────┐                              │                     │
│  W3     │  Sonnet edit (per file)      │                     │
│  apply  │                              │                     │
└────┬────┘                              │                     │
     ▼                                   │                     │
┌─────────┐                              │                     │
│  W4     │  Sonnet verify ─────────────►┘                     │
│  score  │  → feedback signal ─────────────────────────────►─┘
└─────────┘
```

---

## Cycle 1: WIRE — Live Data + Reply Dock

**Goal:** Replace static `in.json` with live claw API data. Students appear
as Actors, their conversations as Events. `EntityDetail` gains a reply dock
when a conversation entity is selected. Broadcast bar appears at the top.
No auth gate yet — owner navigates directly.

**Files:**
- `src/components/in/Inbox.tsx` — replace `inboxData` import with live API fetch
- `src/data/in-types.ts` — extend `Entity` type for live conversation entities
- `src/components/in/EntityDetail.tsx` — add reply dock for `type: conversation` entities
- `src/pages/in.astro` — remove `prerender = true` (needs runtime for live data)

**Why first:** The static JSON gap is the entire problem. Everything else (auth, multi-claw) builds on live data being present.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Live Inbox data | `/in` shows real students + conversations from claw API | 0.40/0.20/0.30/0.10 | `/in` renders actors from `/api/actors` + events from `/conversations` | `in:live-data` |
| 2 | Reply dock | Selecting a conversation entity shows message thread + admin reply textarea | 0.35/0.25/0.30/0.10 | Owner can type + send reply; POST hits claw `/conversations/:id/reply` | `in:reply-dock` |
| 3 | Broadcast bar | Top bar lets owner send to all active conversations | 0.35/0.20/0.35/0.10 | POST to claw `/broadcast` succeeds, shows sent/total count | `in:broadcast` |

---

### Wave 1 — Recon (parallel Haiku x 6)

Spawn all 6 in a single message. Each reads one file. Report verbatim — findings with line numbers, no proposals.

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/components/in/Inbox.tsx` | Where `inboxData` is imported + used; how `entities` flows to `EntityList` + `EntityDetail` |
| R2 | `src/data/in-types.ts` | `Entity` type shape; `InboxData` structure; `Status` + `Dimension` enums |
| R3 | `src/data/in.json` | Schema: what fields each entity has (id, title, dimension, status, etc.) |
| R4 | `src/components/in/EntityDetail.tsx` | How selected entity is rendered; where a reply dock could attach |
| R5 | `src/components/ai/ClawAdmin.tsx` | API calls: `GET /conversations`, `GET /messages/:group`, `POST /conversations/:group/reply`, `POST /broadcast` — exact fetch patterns |
| R6 | `src/pages/in.astro` | `prerender = true` flag; hydration directive on `Inbox` |

**Outcome model:** `result` = report in. `timeout` = re-spawn once. `dissolved` = file missing, drop.

---

### Wave 2 — Decide (Opus)

Load: `DSL.md`, `dictionary.md`, W1 reports, `auth.md`, `debby-todo.md` W4 section.

**Key decisions:**
1. **Data source strategy:** claw API for Events (conversations), substrate `/api/actors` + `/api/signals` for other dimensions — or all from claw? Decision: claw owns conversations; substrate owns actors/paths/learning. Inbox fetches from both.
2. **Entity type extension:** `Entity` needs `type: 'conversation' | 'actor' | 'path' | ...` so `EntityDetail` can branch on reply dock vs read-only view.
3. **`prerender = false`:** needed because Inbox now fetches live data client-side. The Astro page shell stays static; React island fetches on mount.
4. **Reply dock placement:** inside `EntityDetail` — when `entity.type === 'conversation'`, render message thread + reply textarea below the detail view. Reuse `ClawAdmin` fetch patterns, not the component.
5. **Broadcast bar:** top of the main panel (not inside EntityDetail). Mirrors `ClawAdmin` broadcast section.
6. **Config prop:** `Inbox` needs `clawUrl` prop so any claw can be wired. Default: `debby-claw.oneie.workers.dev`.

**Output format:**
```
TARGET:    {filepath}
ANCHOR:    "<exact unique substring>"
ACTION:    replace | insert-after | insert-before
NEW:       "<new text>"
RATIONALE: "<one sentence>"
```

---

### Wave 3 — Edits (parallel Sonnet x 4, one per file)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/data/in-types.ts` | ~3 — add `type` field to `Entity`, add `ConversationEntity` variant, add live fetch types |
| E2 | `src/components/in/Inbox.tsx` | ~5 — replace static import with `useState` + `useEffect` fetch from claw + substrate; pass `clawUrl` |
| E3 | `src/components/in/EntityDetail.tsx` | ~4 — branch on `entity.type === 'conversation'`: render message thread + reply dock |
| E4 | `src/pages/in.astro` | ~1 — remove `export const prerender = true`; pass `clawUrl` prop to `Inbox` |

---

### Wave 4 — Verify (parallel Sonnet x 3)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency — types flow from `in-types.ts` into `Inbox` + `EntityDetail` without gaps | all 4 touched files |
| V2 | API contract — fetch calls match claw API routes from `debby-todo.md` W4 | `Inbox.tsx`, `EntityDetail.tsx`, `ClawAdmin.tsx` (reference) |
| V3 | Rubric scoring (fit/form/truth/taste) + `bun run verify` | all touched files + `rubrics.md` |

**Exit conditions:**
```bash
# Live data visible
curl https://dev.one.ie/in  # returns 200, no static JSON fallback

# Reply dock renders
# → select a conversation entity in /in → reply textarea visible

# Broadcast works
curl -X POST https://debby-claw.oneie.workers.dev/broadcast \
  -d '{"text": "test", "sender": "admin"}'  # → { sent: N, total: N }
```

```
[ ] /in renders live students in Actors dimension
[ ] /in renders live conversations in Events dimension
[ ] Selecting a conversation shows message thread in EntityDetail
[ ] Admin can type + send reply from EntityDetail
[ ] Broadcast bar sends to all conversations
[ ] bun run verify passes (biome + tsc + vitest)
[ ] No static in.json dependency at runtime
```

### Cycle 1 Gate

All checkboxes above. `bun run verify` green. `/in` loads live data in < 2s.

---

## Cycle 2: PROVE — Auth Gate + Group Scope

**Goal:** Only the group owner (role: `chairman | ceo | operator`) can access
`/in`. Route becomes `/in` (default group from API key) or `/in/[groupId]`
for multi-group owners. Non-owners get redirected to `/app/[groupId]`.

**Depends on:** Cycle 1 complete + `groups-todo.md` Cycle 1 (`getRoleForUser(uid, gid)` per-group variant available).

**Files:**
- `src/pages/in.astro` → SSR auth check: read API key → role lookup → redirect if not owner
- `src/pages/in/[groupId].astro` → new dynamic route for group-scoped inbox
- `src/components/in/Inbox.tsx` → accept `groupId` prop; filter data by group
- `src/lib/api-auth.ts` → verify `getRoleForUser(uid, gid)` has per-group variant

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Auth gate on `/in` | Non-owners redirected; owners pass through | 0.40/0.15/0.35/0.10 | Non-owner API key → 302 to `/app/[groupId]`; owner → 200 | `in:auth-gate` |
| 2 | Group-scoped route `/in/[groupId]` | Owner sees their specific group's data | 0.35/0.20/0.35/0.10 | `/in/debby` shows only Debby's students + conversations | `in:group-scope` |
| 3 | Nav group picker | Sidebar shows owner's groups; clicking switches scope | 0.30/0.25/0.30/0.15 | Owner with 2+ groups can switch between them in `/in` | `in:group-picker` |

---

### Wave 1 — Recon (parallel Haiku x 5)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/lib/api-auth.ts` | `getRoleForUser()` signature — does it accept `gid`? What roles does it return? |
| R2 | `src/lib/role-check.ts` | `ROLE_PERMISSIONS` matrix — which roles have `read_memory` / `operator` access |
| R3 | `src/pages/in.astro` | Current SSR setup after C1; where to inject auth check |
| R4 | `src/pages/app/[groupId]/index.astro` | How `groupId` is read from params; pattern to copy for `/in/[groupId]` |
| R5 | `src/components/in/Inbox.tsx` | Where `clawUrl` + data fetching happens — where `groupId` prop would filter |

---

### Wave 2 — Decide (Opus)

**Key decisions:**
1. **Auth mechanism:** read `Authorization: Bearer <key>` header in Astro SSR → call `getRoleForUser(uid, gid)` → if role not in `['chairman', 'ceo', 'operator']` → redirect.
2. **Default group:** if `/in` (no groupId param) → derive from API key's primary group. If owner has multiple groups → show group picker.
3. **`/in/[groupId]` shape:** `export const prerender = false` (SSR); same pattern as `/app/[groupId]/index.astro`.
4. **Group picker placement:** in the left nav sidebar of `Inbox`, below the dimension list. Only visible when owner has multiple groups.
5. **Data filtering:** `Inbox` passes `groupId` to all fetch calls. Claw `/conversations` filtered by group prefix. Substrate APIs filtered by `?group=groupId`.

---

### Wave 3 — Edits (parallel Sonnet x 4)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/in.astro` | ~3 — SSR auth check + redirect logic |
| E2 | `src/pages/in/[groupId].astro` | New file — copy `/app/[groupId]` pattern, pass groupId to Inbox |
| E3 | `src/components/in/Inbox.tsx` | ~3 — accept `groupId` prop; filter fetches; add group picker to nav |
| E4 | `src/lib/api-auth.ts` | ~2 — add `getRoleForUser(uid, gid?)` overload if not already there |

---

### Wave 4 — Verify (parallel Sonnet x 3)

```
[ ] Non-owner API key hitting /in → 302 redirect to /app/[groupId]
[ ] Owner API key → 200, sees their group's live data
[ ] /in/debby scoped to Debby's students only
[ ] /in/donal scoped to Donal's group only
[ ] Group picker visible + functional when owner has 2+ groups
[ ] bun run verify passes
```

### Cycle 2 Gate

Auth gate verifiable: two API keys (owner + non-owner) → different outcomes. Group scope verifiable: data from wrong group does not appear.

---

## Cycle 3: GROW — Multi-Claw + Retire Admin Page

**Goal:** `/in` works for any claw (Debby, Donal, future). `/chat-debby-admin`
redirects to `/in/debby`. ProfileHeader shows the owner's real name + group.
`in.json` deleted.

**Depends on:** Cycle 2 complete.

**Files:**
- `src/pages/chat-debby-admin.astro` → replace with redirect to `/in/debby`
- `src/components/in/ProfileHeader.tsx` → show real owner name from auth, not hardcoded "Anthony O'Connell"
- `src/components/in/Inbox.tsx` → make `clawUrl` derivable from groupId (map: `debby → debby-claw.oneie.workers.dev`)
- `src/data/in.json` → delete (no longer needed)
- `src/data/in-types.ts` → remove static data types, keep live types only

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | Retire `/chat-debby-admin` | Redirect to `/in/debby`; no broken links | 0.35/0.20/0.35/0.10 | `GET /chat-debby-admin` → 301 `/in/debby` | `in:retire-admin` |
| 2 | Multi-claw routing | Any group with a claw gets live data in `/in/[groupId]` | 0.40/0.15/0.35/0.10 | `/in/donal` shows Donal's claw conversations | `in:multi-claw` |
| 3 | Owner identity in nav | ProfileHeader shows owner's real name from auth, not hardcoded | 0.30/0.25/0.30/0.15 | Name in sidebar matches the authenticated actor's `name` attribute | `in:owner-identity` |

---

### Wave 1 — Recon (parallel Haiku x 5)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/pages/chat-debby-admin.astro` | Current shape — component + props to preserve in redirect |
| R2 | `src/components/in/ProfileHeader.tsx` | Hardcoded name + initial; where owner identity should come from |
| R3 | `src/components/in/Inbox.tsx` | Where `clawUrl` is set; how to make it derive from `groupId` |
| R4 | `src/data/in.json` + `src/data/in-types.ts` | What static types remain after C1; what's safe to delete |
| R5 | `nanoclaw/wrangler.donal.toml` | Donal's claw URL to wire into the groupId → clawUrl map |

---

### Wave 2 — Decide (Opus)

**Key decisions:**
1. **Redirect strategy:** `src/pages/chat-debby-admin.astro` → pure 301 redirect in Astro SSR frontmatter (`return Astro.redirect('/in/debby', 301)`).
2. **groupId → clawUrl map:** small static map in `Inbox.tsx` or a new `src/lib/claw-registry.ts`. Entries: `{ debby: 'https://debby-claw.oneie.workers.dev', donal: 'https://donal-claw.oneie.workers.dev' }`. Owner of any group gets the matching claw.
3. **Owner identity:** `ProfileHeader` receives `ownerName` + `ownerInitial` props from `Inbox`. `Inbox` reads from auth API (`/api/auth/me` or similar) on mount, falls back to `unknown` gracefully.
4. **`in.json` deletion:** safe after C1 — types already migrated to live shapes. Delete file + remove import.

---

### Wave 3 — Edits (parallel Sonnet x 5)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/chat-debby-admin.astro` | Replace content with `Astro.redirect('/in/debby', 301)` |
| E2 | `src/components/in/Inbox.tsx` | Add groupId → clawUrl resolution; pass owner name to ProfileHeader |
| E3 | `src/components/in/ProfileHeader.tsx` | Accept `name` + `initial` as props (remove hardcoded values) |
| E4 | `src/data/in-types.ts` | Remove static `InboxData` + `Entity` static variants; keep live types |
| E5 | `src/data/in.json` | Delete file |

---

### Wave 4 — Verify (parallel Sonnet x 3)

```
[ ] GET /chat-debby-admin → 301 /in/debby (curl -I)
[ ] /in/debby uses debby-claw.oneie.workers.dev data
[ ] /in/donal uses donal-claw.oneie.workers.dev data
[ ] ProfileHeader shows authenticated owner name (not "Anthony O'Connell" hardcoded)
[ ] in.json file deleted; no import errors
[ ] bun run verify passes
[ ] No references to /chat-debby-admin in nav or links (grep check)
```

```bash
# Redirect check
curl -I https://dev.one.ie/chat-debby-admin
# → HTTP/1.1 301 /in/debby

# No hardcoded name
grep -r "Anthony O'Connell" src/components/in/
# → no output

# No broken imports
grep -r "in\.json" src/
# → no output
```

### Cycle 3 Gate

All checkboxes above. Redirect verified. Multi-claw verified. Hardcoded name gone. `in.json` gone. `bun run verify` green.

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | Live data flows; owner can reply + broadcast | L1 (signal), L2 (path marking on reply actions) |
| **PROVE** | Auth gate; group scope; pheromone partitioned by group | L4 (ownership gates signals), L2 (per-group paths) |
| **GROW** | Multi-claw; admin page retired; clean surface | L6 (know: old paths dissolved), L3 (admin page fades) |

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 6 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~20% |
| 1 | W3 | 4 | Sonnet | ~30% |
| 1 | W4 | 3 | Sonnet | ~15% |
| 2 | W1-W4 | 5/1/4/3 | H/O/S/S | ~20% |
| 3 | W1-W4 | 5/1/5/3 | H/O/S/S | ~10% |

**Hard stop:** if any W4 loops more than 3 times, halt and escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — Live data + reply dock
  - [ ] W1 — Recon (Haiku x 6, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 4, parallel)
  - [ ] W4 — Verify (Sonnet x 3, parallel by check type)
- [ ] **Cycle 2: PROVE** — Auth gate + group scope
  - [ ] W1 — Recon (Haiku x 5, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 4, parallel)
  - [ ] W4 — Verify (Sonnet x 3, parallel by check type)
- [ ] **Cycle 3: GROW** — Multi-claw + retire admin page
  - [ ] W1 — Recon (Haiku x 5, parallel)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 5, parallel)
  - [ ] W4 — Verify (Sonnet x 3, parallel by check type)

---

## Execution

```bash
# Run next wave
/do in-todo.md

# Check state
/see tasks --tag inbox
/see highways
```

---

## See Also

- [debby-todo.md](debby-todo.md) — claw API routes + ClawAdmin (W4 complete; these are the fetch patterns to reuse)
- [groups-todo.md](groups-todo.md) — `getRoleForUser(uid, gid)` per-group role lookup (C2 dependency)
- [auth.md](auth.md) — API key flows, role lookup
- [DSL.md](one/DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [rubrics.md](rubrics.md) — quality scoring

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Owner inbox. Everyone else goes through /chat-auth or /app.*
