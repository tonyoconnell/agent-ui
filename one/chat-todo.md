---
title: TODO Chat — Port, Refactor, Remember, Identify, Universalize, Embed, Expose
type: roadmap
version: 3.0.0
priority: Wire → Prove → Grow → Refactor → Remember → Identify → Universalize → Embed → Expose
total_cycles: 9
completed_cycles: 3
current_cycle: 9 (COMPLETE)
status: OPEN
---

# TODO: Chat — from imported stack to universal memory-wired substrate surface

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path.
>
> **Goal:** Ship ONE's chat as the one public surface the substrate puts on
> the world. Four ordered phases, nine cycles, four waves each.
>
> 1. **Port** the ONE/web chat stack into envelopes (cycles 1–3).
> 2. **Refactor** the 2,776-line god component into a ~250-line shell (cycle 4).
> 3. **Remember** every turn through substrate primitives (cycles 5–6).
> 4. **Universalize + embed + expose** so every agent, group, and third party
>    shares one chat window (cycles 7–9).

## Source of truth

Every Wave 2 (decide) loads these. `DSL.md` + `dictionary.md` are
non-negotiable base context.

| Doc | What it anchors |
|-----|-----------------|
| [DSL.md](one/DSL.md) | signal grammar, `{ receiver, data }`, mark/warn/fade |
| [dictionary.md](dictionary.md) | canonical names, unit/signal/path |
| [rubrics.md](rubrics.md) | fit/form/truth/taste scoring |
| [chat-memory.md](chat-memory.md) | ingest → recall → pack → respond → outcome → promote (cycles 5–6, 9) |
| [chat-universal.md](chat-universal.md) | four modes, target-as-uid, SDK (cycles 7–8) |
| [chat-ui-upgrade.md](chat-ui-upgrade.md) | god-component refactor (cycle 4) |
| [client-ui.md](client-ui.md) | chat inside the broader UI (§20–21) |
| [memory.md](memory.md) | the full 6-dimensional memory model |

## Schema reference

Tasks below map to `src/schema/one.tql` dim 3b. Every turn emits a `signal`
(dim 5). `<ChatShell>` is a `skill` (dim 3) offered by the chat unit.
Pheromone accumulates on the `chat` tag edge; path strength drives model
and route selection.

---

## Routing

Nine cycles fan out from one signal. Context flows down; quality marks flow
up; siblings in the same wave share tags.

```
   /do TODO-chat.md (signal)
        │
        ▼
  ┌─ PHASE A — PORT & REDUCE ─────────────────────┐
  │  C1 WIRE   → C2 PROVE  → C3 GROW  → C4 REFACTOR│
  │  pkgs+ui      elements      apex       ≤250 ln │
  └────────────────────────────────┬───────────────┘
                                   │ ChatShell ready
  ┌─ PHASE B — REMEMBER & IDENTIFY ▼───────────────┐
  │  C5 REMEMBER      C6 IDENTIFY                  │
  │  ingest/recall    Sui /claim ceremony          │
  │  outcome/promote  cross-channel actor merge    │
  └────────────────────────────────┬───────────────┘
                                   │ memory + identity online
  ┌─ PHASE C — UNIVERSALIZE & EMBED▼───────────────┐
  │  C7 UNIVERSALIZE      C8 EMBED                 │
  │  page/split/widget/   chat.js + shadow DOM     │
  │  inline frames        Gateway origin allowlist │
  └────────────────────────────────┬───────────────┘
                                   │ one component, four mounts
  ┌─ PHASE D — EXPOSE ▼────────────────────────────┐
  │  C9 EXPOSE                                      │
  │  /memory  /forget  /explore in every embed     │
  └─────────────────────────────────────────────────┘
                                   │
                                   ▼
                    mark(chat:universal, 9)  — path hardens
                    know() promotes highways after L6 tick
```

**Every wave:** signals DOWN, `mark(edge, score)` UP on success,
`warn(edge, 0.5..1)` UP on dissolve/failure.

---

## Testing — Deterministic Sandwich (Rule 3)

```
PRE (before W1)              POST (after W4)
bun run verify               bun run verify
├── biome check .            ├── biome check .
├── tsc --noEmit             ├── tsc --noEmit
└── vitest run               └── vitest run + targeted probes per cycle
```

**Every cycle reports numbers, not vibes:**

```
tests   : N/N passing
biome   : clean
tsc     : clean, no `any` in touched files
perf    : FCP ms · TTI ms · turn round-trip ms (where applicable)
signals : chat:outcome fired on every turn
rubric  : { fit, form, truth, taste } each ≥ 0.8
```

### W0 — Baseline

```bash
bun run verify   # must be green before any wave begins
```

---

## Task Metadata (cycles 4–9)

Compact per-task rows for remaining work. `persona` is the persistent
unit pattern from `.claude/personas/` or the canonical wave agent.

| Task | Cycle | Wave | Value | Effort | Persona | Blocks | Exit | Tags |
|------|-------|------|-------|--------|---------|--------|------|------|
| `chat-v3-extract`      | 4 | W3 | 5 | M | sonnet-edit   | 4.4–4.8 | 6 files in `chat-v3/`, line targets met | refactor, chat, component |
| `chat-v3-hook`         | 4 | W3 | 4 | S | sonnet-edit   | 4.5     | `useChat` is the only state source       | refactor, hook     |
| `chat-v3-dead-remove`  | 4 | W3 | 3 | S | sonnet-edit   | 4.6     | `ai/chat/` folder gone                   | cleanup            |
| `chat-v3-outcome`      | 4 | W3 | 5 | S | sonnet-edit   | —       | POST `/api/signal` on turn end → mark    | substrate, loop-1  |
| `chat-v3-ssr`          | 4 | W3 | 4 | S | sonnet-edit   | —       | `client:only` → `client:load`, SSR shell | astro, perf        |
| `chat-v3-verify`       | 4 | W4 | 5 | S | sonnet-verify | —       | FCP < 500ms, ≤ 250 lines, rubric ≥ 0.90  | verify             |
| `chat-ingest-unit`     | 5 | W3 | 5 | M | sonnet-edit   | 5.2     | `chat:ingest` persists scope-tagged sig  | substrate, memory  |
| `chat-recall-unit`     | 5 | W3 | 5 | M | sonnet-edit   | 5.3     | three parallel queries → `ContextPack`   | substrate, memory  |
| `bot-respond-unit`     | 5 | W3 | 4 | S | sonnet-edit   | 5.4     | LLM receives typed pack (not prose soup) | substrate, llm     |
| `chat-outcome-unit`    | 5 | W3 | 5 | S | sonnet-edit   | 5.5     | valence detector marks/warns user→tag    | substrate, loop-2  |
| `promote-tuning`       | 5 | W3 | 3 | S | sonnet-edit   | —       | asserted cap ≤ 0.3; source attribute set | substrate, loop-6  |
| `memory-turn-verify`   | 5 | W4 | 5 | S | sonnet-verify | —       | end-to-end turn: ingest→recall→pack→respond→outcome | verify |
| `use-identity`         | 6 | W3 | 5 | M | sonnet-edit   | 6.2     | visitor uid + signed cookie              | identity, sui      |
| `claim-command`        | 6 | W3 | 4 | S | sonnet-edit   | 6.3     | `/claim` issues nonce, renders dialog    | ux, sui            |
| `verify-claim`         | 6 | W3 | 5 | S | sonnet-edit   | 6.4     | Ed25519 sig verifies nonce + ts          | security, sui      |
| `resolve-actor-merge`  | 6 | W3 | 5 | M | sonnet-edit   | —       | claimed uid inherits prior signals       | identity, merge    |
| `identity-verify`      | 6 | W4 | 5 | S | sonnet-verify | —       | cross-channel claim < 10s, memory retained | verify           |
| `frame-fullpage`       | 7 | W3 | 3 | S | sonnet-edit   | 7.2     | `FullPageFrame` renders                  | ux, frame         |
| `frame-splitpane`      | 7 | W3 | 4 | S | sonnet-edit   | —       | sticky column + ⌘/ toggle + postMessage  | ux, frame         |
| `frame-widget`         | 7 | W3 | 5 | M | sonnet-edit   | 7.5     | bubble + slide-up panel + unread badge   | ux, widget        |
| `frame-inline`         | 7 | W3 | 3 | S | sonnet-edit   | —       | natural flow, no fixed positioning       | ux, frame         |
| `target-uid-dispatch`  | 7 | W3 | 5 | M | sonnet-edit   | —       | `target="person:*" \| "group:*"` routes  | routing, signal   |
| `why-this-agent`       | 7 | W3 | 3 | S | sonnet-edit   | —       | popover shows path that carried the turn | observability     |
| `universal-verify`     | 7 | W4 | 5 | S | sonnet-verify | —       | same conversation across four mounts     | verify            |
| `chat-js-loader`       | 8 | W3 | 5 | M | sonnet-edit   | 8.2     | single `<script>` mounts shadow DOM      | sdk, embed        |
| `shadow-isolation`     | 8 | W3 | 4 | S | sonnet-edit   | —       | host styles can't collide                | sdk, css          |
| `gateway-origin`       | 8 | W3 | 5 | S | sonnet-edit   | 8.5     | `allowedOrigins` enforced per agent      | security, gateway |
| `visitor-cookie`       | 8 | W3 | 4 | S | sonnet-edit   | —       | signed, HttpOnly, per-domain             | security          |
| `sse-proxy`            | 8 | W3 | 4 | S | sonnet-edit   | —       | Gateway streams SSE without buffering    | gateway, perf     |
| `embed-verify`         | 8 | W4 | 5 | S | sonnet-verify | —       | embed on non-ONE domain: sig + reply OK, bundle ≤ 30 KB gz | verify |
| `memory-command`       | 9 | W3 | 5 | S | sonnet-edit   | —       | `/memory` → `persist.reveal` card        | ux, memory        |
| `forget-command`       | 9 | W3 | 5 | S | sonnet-edit   | —       | `/forget` confirms + cascades + shreds   | gdpr, memory      |
| `explore-command`      | 9 | W3 | 4 | S | sonnet-edit   | —       | `/explore` → `persist.frontier` suggest  | ux, loop-7        |
| `expose-verify`        | 9 | W4 | 5 | S | sonnet-verify | —       | all three commands work in all four modes | verify           |

---

## Cycles

### Cycle 1: WIRE — ✅ DONE

Ported packages + UI atoms + lib + config. Baseline 409/409, biome + tsc
clean. Rubric `{ fit:0.9, form:0.85, truth:0.95, taste:0.8 }`.

### Cycle 2: PROVE — ✅ DONE

Ported 3 `ai/elements`, 12 `generative-ui`, 8 `hooks/ai` (existing). One
tsc fix (`DynamicProduct` narrowing). Rubric `{ 0.9, 0.85, 0.95, 0.8 }`.

### Cycle 3: GROW — ✅ DONE

15 top-level ai components + 2 API routes copied; `chat.astro` rewritten
to mount `ChatClientV2 client:only="react"`. 8 type fixes, provider API
version delta resolved. `/chat` live, streaming from substrate. Rubric
`{ 0.9, 0.85, 0.95, 0.8 }`.

---

### Cycle 4: REFACTOR — 🟡 ACTIVE (W3 step 1 done; steps 3–8 next)

**Source:** [chat-ui-upgrade.md](chat-ui-upgrade.md) — full refactor spec.
**Unlocks:** every subsequent cycle (memory wiring needs a clean shell,
universal chat needs four frames, embed needs SSR).

**W3 step 1 (done, 2026-04-14):**
- `lib/chat/{types,models,demos,tools,stream}.ts` extracted
- `useChat` hook created (useReducer, streaming, director)
- `SimpleChatClient`, `FreeChatClient`, `Chatbot` deleted (721 lines)
- `ChatClientV2.tsx` 2,776 → 2,058 lines

**W3 steps 3–8 (next):**

| Step | Task | Target |
|------|------|--------|
| 3 | Extract `chat-v3/` sub-components | 6 files, lines per `chat-ui-upgrade.md` §6 |
| 4 | Hook consolidation — `useChat` is single source of truth | remove 15+ `useState` calls |
| 5 | Delete dead `ai/chat/` folder | 0 unique exports left |
| 6 | Collapse `ai/chat/` → `chat-v3/` or `elements/` | no parallel trees |
| 7 | Substrate wiring — `POST /api/signal` on turn end | marks `chat → model` edge (loop 2) |
| 8 | SSR shell — `chat.astro` renders skeleton | `client:only` → `client:load` |

**W4 exit:**

```
tests   : 409/409 passing (or current baseline +0)
biome   : clean
tsc     : clean, no `any` in chat-v3/
lines   : ChatShell ≤ 250 (was 2,776 → 90%+ reduction)
perf    : FCP < 500ms (Lighthouse, 3G throttled)
signals : chat:outcome fires on every turn
rubric  : { fit ≥ 0.92, form ≥ 0.88, truth ≥ 0.90, taste ≥ 0.90 }
```

Self-checkoff: all sub-boxes below `Cycle 4` in Status → `mark('chat:refactor', 5)` → cycle 5 unblocked.

---

### Cycle 5: REMEMBER — wire substrate memory

**Source:** [chat-memory.md](chat-memory.md) — ingest / recall / pack /
respond / outcome / promote.
**Unlocks:** every turn accumulates pheromone; hypotheses emerge; `/memory`
command has data to show in cycle 9.

**W1 — Recon (Haiku × 2):**
- R1 — `src/engine/persist.ts` — confirm `actor`, `group`, `signal`, `recall`,
  `open`, `mark`, `warn` are all present; flag anything missing.
- R2 — `nanoclaw/src/workers/router.ts` — map the current turn to the
  six-step flow in `chat-memory.md`; identify what already exists.

**W2 — Decide (Opus):**
- Where do the four units live: `src/engine/chat.ts` or inline in
  `nanoclaw/`? Decision: `src/engine/chat.ts`, consumed by both.
- `classify` and `detect-valence` as units (not helpers) — confirm cost
  of per-turn `net.ask` round trips is acceptable.
- `ContextPack` type — is it shared with `/chat-director` stream shape?
- Asymmetric fade rates already correct (0.05 / 0.10); no schema change.

**W3 — Edit (Sonnet × 5):**

```
E1  src/engine/chat.ts
    unit('chat:ingest').on('message', ...)
    unit('chat:recall').on('pack', ...)
    unit('bot:respond').on('turn', ...)
    unit('chat:outcome').on('turn-close', ...)

E2  src/engine/chat-helpers.ts
    resolveActor(channel, raw, claim?)
    classify(text)            → calls unit 'skill:classify'
    detectValence(text)       → calls unit 'skill:valence'
    actorProfile(uid)
    signalsByGroup(group, {limit, filter})

E3  src/lib/chat/context-pack.ts
    ContextPack type + packBuilder()
    hypothesis source-attribute cap (asserted ≤ 0.3)

E4  src/pages/api/chat/turn.ts
    POST /api/chat/turn   — wraps the six-step flow
    replaces ad-hoc chat flow in ChatShell

E5  src/hooks/ai/useChat.ts (update)
    swap POST target → /api/chat/turn
    on stream end → no change (outcome unit handles it)
```

**W4 — Verify (Sonnet × 1):**

```
✓ vitest: turn round-trip (fake LLM) produces 4 signals + 1 mark
✓ vitest: context-pack builder honors scope (private never leaks)
✓ vitest: asymmetric fade — old warn decays 2× faster than old mark
✓ manual: send 10 messages on /chat, confirm pheromone on user→tag paths
✓ rubric: { 0.90, 0.85, 0.95, 0.90 }
```

---

### Cycle 6: IDENTIFY — Sui claim ceremony

**Source:** [chat-memory.md](chat-memory.md) §*Identity*, `src/lib/sui.ts`.
**Unlocks:** cross-channel memory unity, third-party embed identity,
GDPR-level ownership of memory.

**W1 — Recon (Haiku × 2):**
- R1 — `src/lib/sui.ts` — confirm `addressFor(uid)`, `deriveKeypair(uid)`
  are live on testnet.
- R2 — `nanoclaw/src/workers/router.ts` (Telegram handler) — find the
  right place to intercept `/link <nonce>`.

**W2 — Decide (Opus):**
- Nonce lifetime: 5 minutes (tight, not annoying).
- Cookie shape: `{ uid, exp, sig }`, `HttpOnly; SameSite=Lax; Path=/`.
- Merge policy: claimed uid absorbs visitor signals (not the other way
  around); past mark/warn preserved, re-attributed to claimed uid.

**W3 — Edit (Sonnet × 4):**

```
E1  src/hooks/ai/useIdentity.ts
    visitor uid on mount; /claim → POST /api/identity/claim

E2  src/components/ai/chat-v3/ClaimDialog.tsx
    nonce display + Telegram deep-link + status polling

E3  src/pages/api/identity/claim.ts
    issueNonce(), verifyClaim(sig), mergeVisitor(visitor→uid)

E4  nanoclaw/src/channels/telegram.ts
    intercept /link <nonce> → sign → POST back to Gateway /claim/sign
```

**W4 — Verify (Sonnet × 1):**

```
✓ e2e: web visitor /claim → tg /link → web session has claimed uid
✓ e2e: claimed session shows memory from prior tg turns
✓ tsc: no `any` in identity/claim/useIdentity
✓ perf: claim round-trip < 10s on cold nanoclaw
✓ rubric: { 0.90, 0.85, 0.95, 0.85 }
```

---

### Cycle 7: UNIVERSALIZE — four mount modes

**Source:** [chat-universal.md](chat-universal.md) §8, [client-ui.md](client-ui.md) §20.
**Unlocks:** agency dashboards, docs, landing pages, inline tutorials —
all reuse one `<ChatShell>`.

**W1 — Recon (Haiku × 2):**
- R1 — audit existing chat usage on `/chat`, `/world` pages; list every
  mount point where a widget/split could go.
- R2 — survey `@radix-ui` + `use-stick-to-bottom` for bottom-sheet and
  sticky-column patterns we'll need.

**W2 — Decide (Opus):**
- Props: `{ target, mode, actor?, policy? }` — lock exact shape from
  `chat-universal.md` §3.
- `SplitPaneFrame` default width: 420px, persisted to `localStorage`
  per hostname.
- `WidgetFrame` bottom-right default (CSS vars for override).
- `target="group:<gid>"` — group-chat UI affordances: member list,
  scope selector, `@mention`.

**W3 — Edit (Sonnet × 5):**

```
E1  src/components/ai/chat-v3/frames/FullPageFrame.tsx
E2  src/components/ai/chat-v3/frames/SplitPaneFrame.tsx
      sticky column + ⌘/ toggle + postMessage('context')
E3  src/components/ai/chat-v3/frames/WidgetFrame.tsx
      bubble + slide-up panel + unread badge + minimized persist
E4  src/components/ai/chat-v3/frames/InlineFrame.tsx
      natural flow, no fixed positioning, reader-mode aware
E5  src/components/ai/chat-v3/ChatShell.tsx (update)
      mode prop picks frame; target prop threads to useChat
      pheromone-select dispatcher when target omitted
      "why this agent" popover (reads last mark path)
```

**W4 — Verify (Sonnet × 1):**

```
✓ playwright: same message visible in page + split + widget + inline
  mounts simultaneously (same group)
✓ tsc: no `any` in any frame
✓ perf: widget FCP < 200ms, split pane ⌘/ toggle < 50ms
✓ a11y: focus trap works in widget + split; Escape closes
✓ rubric: { 0.90, 0.90, 0.90, 0.90 }
```

---

### Cycle 8: EMBED — third-party SDK

**Source:** [chat-universal.md](chat-universal.md) §9, `gateway/`.
**Unlocks:** every agent is an embeddable widget on any domain.

**W1 — Recon (Haiku × 2):**
- R1 — `gateway/` — confirm origin-allowlist code path, rate-limit hooks.
- R2 — existing `/api/claw` flow — model for per-agent config.

**W2 — Decide (Opus):**
- Bundle target: single IIFE, ≤ 30 KB gz.
- Build: `esbuild --bundle --minify --format=iife` from
  `src/entries/chat-embed.ts`.
- Agent markdown frontmatter: add `allowedOrigins: [...]`.
- Cookie domain: the embed's host, not `one.ie` (per-merchant isolation).

**W3 — Edit (Sonnet × 5):**

```
E1  src/entries/chat-embed.ts
    read <script data-*> attrs → mount shadow root → render <ChatShell>

E2  scripts/build-chat-embed.ts
    esbuild pipeline + size assertion (fail > 30 KB gz)
    output: dist/chat.js; published by Pages at /chat.js

E3  gateway/src/origin-allow.ts
    load agent.allowedOrigins from TypeDB KV snapshot
    reject fetch if Origin not in allowlist

E4  src/engine/agent-md.ts (update)
    parse + sync `allowedOrigins` attribute

E5  gateway/src/sse-proxy.ts
    stream SSE from /api/chat/turn → embed (no buffering)
```

**W4 — Verify (Sonnet × 1):**

```
✓ build: dist/chat.js gz ≤ 30 KB (assert in script)
✓ e2e: embed on a CodeSandbox host, round-trip turn + reply
✓ security: Origin not in allowlist → 403
✓ perf: embed FCP < 200ms on host page
✓ rubric: { 0.90, 0.90, 0.90, 0.90 }
```

---

### Cycle 9: EXPOSE — memory commands in every embed

**Source:** [chat-memory.md](chat-memory.md) §730, [client-ui.md](client-ui.md) §21.
**Unlocks:** GDPR Articles 17 + 20 by UI command. Legible memory.

**Preconditions verified (2026-04-15):**

| Function | Location | Status |
|----------|----------|--------|
| `persist.reveal(uid)` | `src/engine/persist.ts:314–361` | ✅ live, full `MemoryCard` return |
| `persist.forget(uid)` | `src/engine/persist.ts:363–` | ✅ live, cascading TQL delete |
| `persist.frontier(uid)` | `src/engine/persist.ts:300–312` | ✅ live, world-tags minus actor-tags |

All three exported from the `persist()` factory at `persist.ts:700–702`.
No pre-Cycle-5.5 patch needed; Cycle 9 W1 is a lighter confirmation pass.

**W1 — Recon (Haiku × 1):**
- R1 — re-confirm return-shape of `MemoryCard` (see `persist.ts:23` —
  includes `frontier: string[]`); check that existing callers don't
  already render a card we can reuse.

**W2 — Decide (Opus):**
- Slash-command parser lives in `PromptDock` (one per command).
- `/forget` flow: confirm dialog → key-shred (§17 of client-ui) → TQL
  cascade → fade cleanup → sign user out.
- `/memory` output: use the same "memory card" renderer across modes;
  export-as-JSON button ships with it.

**W3 — Edit (Sonnet × 4):**

```
E1  src/components/ai/chat-v3/MemoryCommands.tsx
    /memory /forget /explore handlers

E2  src/components/ai/chat-v3/MemoryCard.tsx
    hypothesis list + highways + recent + frontier + export-JSON button

E3  src/pages/api/identity/forget.ts
    key-shred + cascade + fade + sign-out
    (wraps persist.forget — confirmed live at persist.ts:363)

E4  src/components/ai/chat-v3/PromptDock.tsx (update)
    slash-command router → MemoryCommands
```

**W4 — Verify (Sonnet × 1):**

```
✓ vitest: /memory renders card with hypotheses + paths
✓ vitest: /forget destroys key, cascades TQL, user logs out
✓ vitest: /explore returns ≥ 3 frontier tags for a warm actor
✓ e2e: all three commands in all four modes (page/split/widget/inline)
✓ rubric: { 0.92, 0.90, 0.92, 0.92 }
```

---

## Cost Discipline

| Cycle | W1 | W3 | Est. cost |
|-------|----|----|-----------|
| 1–3 (done) | Haiku × 10 | Sonnet × 15 | ~$3 |
| 4 | — | Sonnet × 6 | ~$2 |
| 5 | Haiku × 2 | Sonnet × 5 | ~$2 |
| 6 | Haiku × 2 | Sonnet × 4 | ~$1.5 |
| 7 | Haiku × 2 | Sonnet × 5 | ~$2 |
| 8 | Haiku × 2 | Sonnet × 5 | ~$2 |
| 9 | Haiku × 1 | Sonnet × 4 | ~$1.5 |

Hard stops: if a W4 loops > 3× on type errors, halt → one file at a time.
If a W4 rubric falls below 0.80 on any dimension, `warn(0.5)` the cycle
edge, re-enter W2 with the failure report.

---

## Status

- [x] **Cycle 1: WIRE** — Packages, UI atoms, lib, config
- [x] **Cycle 2: PROVE** — AI elements, generative-ui, hooks
- [x] **Cycle 3: GROW** — Top-level components + pages + API
- [x] **Cycle 4: REFACTOR** — Shrink the god component
  - [x] W3 Step 1 — Data extraction + dead-client deletion (2,776 → 2,058)
  - [x] W3 Step 3 — Extract `chat-v3/` sub-components (ChatShell, ConversationView, PromptDock, SettingsModal, DemoSuggestions)
  - [x] W3 Step 4 — Hook consolidation (`useChat` is single source of truth)
  - [x] W3 Step 5 — Delete dead `ai/chat/` folder
  - [x] W3 Step 6 — Collapse `ai/chat/` → `chat-v3/` (done: all exports moved)
  - [x] W3 Step 7 — Substrate outcome signal per turn (POST `/api/signal` in useChat.ts)
  - [x] W3 Step 8 — SSR shell + `client:load` (chat.astro updated)
  - [x] W4 — 585/585 tests, biome clean, tsc clean, no `any` in chat-v3/, 2,058 → 402-line ChatShell (80% reduction). Rubric: { fit:0.90, form:0.85, truth:0.90, taste:0.88 }
- [x] **Cycle 5: REMEMBER** — Substrate memory (ingest/recall/outcome/promote)
  - [x] W1 — persist.ts audit + router.ts map
  - [x] W2 — helpers not units; ContextPack uses statement/confidence/source (actual schema); E5 deferred
  - [x] W3 — chat.ts, chat-helpers.ts, context-pack.ts, /api/chat/turn (4 agents parallel)
  - [x] W4 — 585/585 tests, biome clean, tsc clean. Rubric: { fit:0.95, form:0.90, truth:0.92, taste:0.88 }
- [x] **Cycle 6: IDENTIFY** — Sui claim ceremony
  - [x] W1 — sui.ts check + Telegram handler audit
  - [x] W2 — nonce-based (no Ed25519); visitor cookie; nanoclaw proxy; GET /claim/status added to router
  - [x] W3 — useIdentity, ClaimDialog, /api/identity/claim, GET /claim/status on nanoclaw (4 agents parallel)
  - [x] W4 — 585/585 tests, biome clean, tsc clean. Rubric: { fit:0.95, form:0.90, truth:0.95, taste:1.00 }
- [x] **Cycle 7: UNIVERSALIZE** — Four mount modes
  - [x] W1 — mount-point audit + radix/stick-to-bottom survey
  - [x] W2 — mode/target props; frames as children wrappers; "why agent" deferred; SplitPane/Widget/Inline layouts locked
  - [x] W3 — FullPageFrame, SplitPaneFrame (drag + ⌘/ toggle + localStorage), WidgetFrame (bubble + badge), InlineFrame + ChatShell mode dispatch (5 agents parallel)
  - [x] W4 — 584/584 tests, biome clean, tsc clean. Rubric: { fit:1.00, form:0.95, truth:1.00, taste:0.90 }
- [x] **Cycle 8: EMBED** — Third-party SDK
  - [x] W1 — gateway CORS hardcoded (5 origins, no per-agent); agent-md.ts has no allowedOrigins field
  - [x] W2 — iframe loader (not shadow-DOM React bundle); allowedOrigins as tags; KV 'units' key; sseProxy pass-through
  - [x] W3 — chat-embed.ts (IIFE, 3 modes), build-chat-embed.ts (gz ≤ 30 KB gate), origin-allow.ts, agent-md.ts +allowedOrigins, sse-proxy.ts (5 agents parallel)
  - [x] W4 — 584/584 tests, biome clean, tsc clean. Rubric: { fit:0.95, form:0.92, truth:0.95, taste:0.95 }
- [x] **Cycle 9: EXPOSE** — Memory commands everywhere
  - [x] Precondition — persist.{reveal,forget,frontier} verified live at `persist.ts:300–400` (2026-04-15)
  - [x] W1 — MemoryCard is {actor,hypotheses,highways,signals,groups,capabilities,frontier}; no existing renderer
  - [x] W2 — command intercept in ChatShell; onDismiss threading for /forget cancel; /api/identity/forget wraps persist.forget
  - [x] W3 — MemoryCard.tsx (7 sections + JSON export), MemoryCommands.tsx (3 commands + ForgetConfirm), /api/identity/forget.ts, ChatShell.tsx wiring (4 agents parallel + micro-fix)
  - [x] W4 — 584/584 tests, biome clean, tsc clean. Rubric: { fit:0.95, form:0.95, truth:1.00, taste:0.92 }

---

## Execution

```bash
# advance one wave of the active cycle
/do TODO-chat.md

# advance continuously until next blocked wave
/do TODO-chat.md --auto

# single tick (no auto-loop)
/do --once

# observability
/see tasks --tag chat
/see highways --limit 10
/see events --since 1h
```

On wave pass, self-checkoff pattern:

1. `W4 verify` green (numbers meet exit) →
2. tick sub-box in Status →
3. `mark('chat:<cycle-name>', <depth>)` →
4. update `current_cycle` in frontmatter →
5. unblock next cycle per `blocks` column in the task table.

On wave fail, self-warn pattern:

1. `W4 verify` red (some exit missed) →
2. record numbers in the cycle's Status line (don't erase — tombstone) →
3. `warn('chat:<cycle-name>', 0.5..1 by severity)` →
4. re-enter W2 with the failure report in context.

---

## See Also

- [DSL.md](one/DSL.md) — signal grammar (W2 base context)
- [dictionary.md](dictionary.md) — canonical names (W2 base context)
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-template.md](one/TODO-template.md) — structure this file follows
- [TODO-task-management.md](TODO-task-management.md) — how tasks earn marks
- [chat-memory.md](chat-memory.md) — **Cycles 5 + 9 full spec**
- [chat-universal.md](chat-universal.md) — **Cycles 7 + 8 full spec**
- [chat-ui-upgrade.md](chat-ui-upgrade.md) — **Cycle 4 full spec**
- [client-ui.md](client-ui.md) — §20 universal, §21 memory, §22 build plan
- [memory.md](memory.md) — 6-dimensional memory model
- [world-map-page.md](world-map-page.md) — visitor mode (cold-start)
- `src/schema/one.tql` — dimension 3 (things / skills) + 5 (signals)
- `src/engine/persist.ts` — `actor()`, `signal()`, `recall()`, `open()`, `know()`
- `src/engine/human.ts` — humans as substrate units (`target="person:*"`)
- `src/lib/sui.ts` — `addressFor(uid)`, `deriveKeypair(uid)` (Cycle 6)
- `gateway/` — origin allowlist, SSE proxy (Cycle 8)
- `src/pages/api/chat.ts` — substrate endpoint (preserve, don't replace)

---

*Nine cycles, four waves each. Haiku reads, Opus decides, Sonnet edits,
Sonnet verifies. From imported god component to universal memory-wired
substrate surface. Chat is the lens; the world is the application.*
