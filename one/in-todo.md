---
title: TODO — /in Owner Inbox
type: roadmap
version: 1.2.0
priority: Wire → Prove → Grow
total_tasks: 10
completed: 0
status: ACTIVE
created: 2026-04-20
updated: 2026-04-20
---

# TODO: /in Owner Inbox

Owner inbox for every group. Live substrate + claw data replaces static
`in.json`. Reply, broadcast, monitor — auth-gated.

```
/chat-auth        public    wallet → key → deploy → live
/app/[groupId]    members   workspace (6 dimensions)
/in               owners    operator surface (this TODO)
```

**Source of truth:** [debby-todo.md](debby-todo.md) · [groups-todo.md](groups-todo.md) · [DSL.md](one/DSL.md) · [dictionary.md](dictionary.md) · [rubrics.md](rubrics.md) · [auth.md](auth.md)

**Schema:** no `one.tql` change. `/in` projects existing entities — `actor`
(students), `signal` (conversations), `group` (scope).

**Dependency:** C2 needs `groups-todo.md` C1 (`getRoleForUser(uid, gid)` per-group
variant). C1 ships independently.

## Data flow

```
  /chat (ChairmanChat)           Claw API            Substrate
  POST /api/chat-chairman        /conversations      /api/actors
  WS sub: own sessionId          /messages/:group    /api/signals, /api/ws
         │                             │                   │
         ▼                             ▼                   ▼
   /api/signal (user-send, leaf-done) ──────────► session-keyed signal bus
         │                                                 │
         └──────────── /api/ws broadcast ──────────────────┘
                              │
                              ▼
                    /in Inbox  ◄─── claw /conversations
                              │
                              ▼
                EntityList + EntityDetail
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
            reply textarea         broadcast bar
               │                        │
      ┌────────┴──────────┐             ▼
      ▼                   ▼      claw /broadcast
 claw /reply        /api/signal
 (claw entity)      (sessionId) ──► echoes to /chat via WS
```

One bus, three subscribers. `sessionId` is the thread key for chairman
chat; `group + channel` is the thread key for claw conversations. Reply
routes by entity source. See `useTaskWebSocket` as the WS pattern.

---

## Cycle 1: WIRE — Live data + reply dock + chat bridge

Live claw + substrate feeds replace `inboxData`. Students render as Actors,
conversations (claw + chairman chat) as Events. `EntityDetail` branches on
entity source for the reply composer. `/chat` and `/in` share one signal
bus keyed by `sessionId` — admin replies from `/in` arrive live in `/chat`.
Broadcast bar above main panel. No auth gate yet.

**Files:**
- `src/components/in/Inbox.tsx` — live fetch, `clawUrl` prop, WS subscribe + session grouping
- `src/data/in-types.ts` — `Entity.type` union: `conversation` (claw) | `session` (chairman)
- `src/components/in/EntityDetail.tsx` — reply composer branches by entity source
- `src/pages/in.astro` — drop `prerender = true`
- `src/pages/api/chat-chairman.ts` — emit `/api/signal` on user-send + leaf-done (session-tagged)
- `src/components/ai/ChairmanChat.tsx` — WS subscribe to own `sessionId`; append admin replies

### Deliverables

| # | What | Exit |
|---|------|------|
| 1 | Live data | `/in` renders actors from `/api/actors` + events from claw + chairman signal stream |
| 2 | Reply dock | Select conversation → thread + textarea → POST claw `/reply` or `/api/signal` (by source) |
| 3 | Broadcast bar | POST `/broadcast` returns `{ sent, total }` |
| 4 | Chat ↔ Inbox bridge | Send in `/chat` → appears in `/in` within 1s; admin reply in `/in` → appears in `/chat` within 1s |

### W1 — Recon (Haiku × 9, parallel)

| R | File | Look for |
|---|------|----------|
| R1 | `Inbox.tsx` | `inboxData` import; `entities` → `EntityList` / `EntityDetail` flow |
| R2 | `in-types.ts` | `Entity`, `InboxData`, `Status`, `Dimension` shapes |
| R3 | `in.json` | Field schema per entity |
| R4 | `EntityDetail.tsx` | Selected-entity render path; reply dock attach point |
| R5 | `ClawAdmin.tsx` | Exact fetch patterns for `/conversations`, `/messages/:group`, `/reply`, `/broadcast` |
| R6 | `in.astro` | `prerender` flag + hydration directive |
| R7 | `chat-chairman.ts` | Where user content enters + where `done` fires; SSE `sessionId` in scope; `/api/signal` client available |
| R8 | `ChairmanChat.tsx` | `sessionId` source (`loadSessionId`); `setMessages` + `patchMessage` insertion points for admin-replies |
| R9 | `use-task-websocket.ts` + `streamSignals.ts` + `api/ws.ts` | WS subscribe pattern; message shape; filter hook signature to clone |

### W2 — Decide (Opus)

1. Events from claw + chairman signal stream; actors/paths/hypotheses from substrate — Inbox fetches all three
2. `Entity.type` discriminated union: `conversation` (claw) · `session` (chairman) · `actor` · `path` · `hypothesis`
3. `prerender = false`; Astro shell static, island fetches on mount
4. Reply composer in `EntityDetail` branches on `entity.type`:
   - `conversation` → POST claw `/conversations/:id/reply`
   - `session` → POST `/api/signal` with `{ receiver: 'chairman:message', data: { sessionId, sender: 'admin', content } }`
5. Broadcast bar above main panel
6. `Inbox` takes `clawUrl` prop, default `debby-claw.oneie.workers.dev`
7. **Bus convention:** every chairman chat message is a signal — `receiver: 'chairman:message'`, `data.sessionId`, `data.sender: 'chairman' | '<specialist-uid>' | 'admin'`, `data.tags: ['chat', sessionId]`
8. **`chat-chairman.ts` emits twice:** once on user-send (sender: chairman), once on `done` with accumulated leaf text (sender: specialistUid). Fire-and-forget — don't block SSE
9. **Both surfaces subscribe to `/api/ws`**, filter by receiver prefix `chairman:` or by `data.tags.includes('chat')`. `Inbox` groups signals into session entities by `sessionId`; `ChairmanChat` filters to its own `sessionId` only
10. **Session entity shape:** `{ id: 'session:<sessionId>', dimension: 'events', type: 'session', title: first-16-chars-of-first-message, messages: [{ sender, content, ts }], sessionId }`

### W3 — Edit (Sonnet × 6, one per file)

| E | File | ~edits |
|---|------|-------:|
| E1 | `in-types.ts` | 4 (Entity.type union + `SessionEntity.messages` shape) |
| E2 | `Inbox.tsx` | 7 (live fetch + WS subscribe + session grouping) |
| E3 | `EntityDetail.tsx` | 5 (composer branch by entity source) |
| E4 | `in.astro` | 1 (drop prerender) |
| E5 | `chat-chairman.ts` | 3 (emit signal on user-send + on done; import `fetch('/api/signal')`) |
| E6 | `ChairmanChat.tsx` | 4 (WS subscribe gated by `sessionId`; insert admin-replies as assistant messages) |

### W4 — Verify

```
[ ] live actors from /api/actors
[ ] live events from claw /conversations
[ ] live events from chairman signal stream (session entities)
[ ] reply textarea → /conversations/:id/reply   (claw entity)
[ ] reply textarea → /api/signal (chairman:message, sessionId)   (session entity)
[ ] send in /chat → appears in /in within 1s
[ ] admin reply in /in → appears in open /chat within 1s
[ ] broadcast bar → /broadcast
[ ] bun run verify green
[ ] no in.json at runtime
```

**Bridge smoke test:**

```bash
# 1. Open /chat in tab A, send "hello team"
# 2. Open /in in tab B → session entity appears with "hello team"
# 3. In /in, select the session → reply "ack from admin"
# 4. Tab A: new assistant message "ack from admin" appears in open chat
curl -X POST http://localhost:4321/api/signal \
  -H "Content-Type: application/json" \
  -d '{"receiver":"chairman:message","data":{"sessionId":"<sid>","sender":"admin","content":"ack","tags":["chat","<sid>"]}}'
# → 200; /chat for that sessionId renders "ack" as assistant message
```

Rubric: fit/form/truth/taste per `rubrics.md` defaults · gate ≥ 0.65.

---

## Cycle 2: PROVE — Auth gate + group scope

Only `chairman | ceo | operator` passes `/in`. `/in` resolves to primary group;
`/in/[groupId]` for multi-group owners. Non-owners → `/app/[groupId]`.

**Depends on:** C1 + `groups-todo.md` C1.

**Files:**
- `src/pages/in.astro` — SSR auth + redirect
- `src/pages/in/[groupId].astro` — new dynamic route
- `src/components/in/Inbox.tsx` — `groupId` prop, per-group filters, picker
- `src/lib/api-auth.ts` — verify `getRoleForUser(uid, gid)`

### Deliverables

| # | What | Exit |
|---|------|------|
| 1 | Auth gate | Non-owner key → 302 `/app/[groupId]`; owner → 200 |
| 2 | Group scope | `/in/debby` shows only Debby's data; `/in/donal` only Donal's |
| 3 | Group picker | Sidebar picker appears + works for 2+ groups |

### W1 — Recon (Haiku × 5, parallel)

| R | File | Look for |
|---|------|----------|
| R1 | `api-auth.ts` | `getRoleForUser` signature — does it take `gid`? what does it return? |
| R2 | `role-check.ts` | `ROLE_PERMISSIONS` matrix for owner-class roles |
| R3 | `in.astro` | Post-C1 SSR shape; auth injection point |
| R4 | `app/[groupId]/index.astro` | `groupId` param pattern to clone |
| R5 | `Inbox.tsx` | `clawUrl` + fetch sites where `groupId` filter drops in |

### W2 — Decide (Opus)

1. Read `Authorization: Bearer <key>` → `getRoleForUser(uid, gid)` → gate on `['chairman','ceo','operator']`
2. `/in` without param → derive from primary group on key; picker when >1
3. `/in/[groupId].astro` mirrors `/app/[groupId]/index.astro` · `prerender = false`
4. Picker in left nav below dimension list; hidden for single-group owners
5. `Inbox` threads `groupId` into every fetch — claw by prefix, substrate via `?group=`

### W3 — Edit (Sonnet × 4)

| E | File | ~edits |
|---|------|-------:|
| E1 | `in.astro` | 3 (auth + redirect) |
| E2 | `in/[groupId].astro` | new file |
| E3 | `Inbox.tsx` | 3 (prop + filter + picker) |
| E4 | `api-auth.ts` | 2 (overload if missing) |

### W4 — Verify

```
[ ] non-owner key → 302
[ ] owner key → 200 with group data
[ ] /in/debby scoped to Debby
[ ] /in/donal scoped to Donal
[ ] picker works for 2+ groups
[ ] bun run verify green
```

Gate: two keys prove gate; cross-group data invisible.

---

## Cycle 3: GROW — Multi-claw + retire admin page

`/in` works for any claw. `/chat-debby-admin` → 301 `/in/debby`. ProfileHeader
shows real owner name. `in.json` deleted.

**Depends on:** C2.

**Files:**
- `src/pages/chat-debby-admin.astro` — pure redirect
- `src/components/in/ProfileHeader.tsx` — name/initial as props
- `src/components/in/Inbox.tsx` — `groupId → clawUrl` resolution; owner name
- `src/lib/claw-registry.ts` — new map
- `src/data/in.json` — delete
- `src/data/in-types.ts` — drop static variants

### Deliverables

| # | What | Exit |
|---|------|------|
| 1 | Retire admin page | `GET /chat-debby-admin` → 301 `/in/debby` |
| 2 | Multi-claw | `/in/donal` uses donal-claw data |
| 3 | Owner identity | ProfileHeader name matches authenticated actor |

### W1 — Recon (Haiku × 5, parallel)

| R | File | Look for |
|---|------|----------|
| R1 | `chat-debby-admin.astro` | Current content; redirect target |
| R2 | `ProfileHeader.tsx` | Hardcoded name; prop surface |
| R3 | `Inbox.tsx` | `clawUrl` set site; derivation point |
| R4 | `in.json` + `in-types.ts` | Static types still referenced after C1 |
| R5 | `nanoclaw/wrangler.donal.toml` | Donal's claw URL |

### W2 — Decide (Opus)

1. `src/pages/chat-debby-admin.astro` → `return Astro.redirect('/in/debby', 301)` in frontmatter
2. `clawRegistry` in `src/lib/claw-registry.ts` — `{ debby: 'https://debby-claw…', donal: 'https://donal-claw…' }`
3. `ProfileHeader` receives `name` + `initial` props; `Inbox` reads `/api/auth/me`, falls back to `unknown`
4. `in.json` + static variants safe to drop once live types confirmed in C1

### W3 — Edit (Sonnet × 5)

| E | File | Action |
|---|------|--------|
| E1 | `chat-debby-admin.astro` | Replace content with redirect |
| E2 | `claw-registry.ts` | New file — groupId → clawUrl map |
| E3 | `Inbox.tsx` | Resolve clawUrl from groupId; pass owner name |
| E4 | `ProfileHeader.tsx` | Accept `name` + `initial` props |
| E5 | `in-types.ts` + `in.json` | Drop static variants; delete file |

### W4 — Verify

```bash
curl -I https://dev.one.ie/chat-debby-admin   # → 301 /in/debby
grep -r "Anthony O'Connell" src/components/in/  # → empty
grep -r "in\.json" src/                        # → empty
```

```
[ ] redirect 301 to /in/debby
[ ] /in/donal uses donal-claw
[ ] ProfileHeader shows authenticated name
[ ] in.json gone; no import errors
[ ] no /chat-debby-admin links in nav
[ ] bun run verify green
```

Gate: curls + greps clean.

---

## Status

- [x] **C1 WIRE** — W1 · W2 · W3 · W4
- [x] **C2 PROVE** — W1 · W2 · W3 · W4
- [x] **C3 GROW** — W1 · W2 · W3 · W4

---

## See Also

[debby-todo.md](debby-todo.md) · [groups-todo.md](groups-todo.md) · [auth.md](auth.md) · [DSL.md](one/DSL.md) · [dictionary.md](dictionary.md) · [rubrics.md](rubrics.md) · [TODO-template.md](one/TODO-template.md)
