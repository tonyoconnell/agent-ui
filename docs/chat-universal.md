# Chat-Universal — one UI, any actor, any surface

**The claim:** the `/chat` page we refactor in `chat-ui-upgrade.md` is not a
product — it is a **lens onto the substrate**. One codebase, one signal
pipe, three shapes (full page, split pane, floating button), embeddable on
any site, talking to any actor (human or agent) in the world.

**Source of truth:** `docs/memory.md`, `docs/chat-memory.md`, `docs/DSL.md`,
`src/schema/one.tql`. This doc is the UI consequence of those specs.

---

## 1. The elegance in one picture

```
┌──────────────────────────────────────────────────────────────────┐
│                         ONE SUBSTRATE                            │
│                                                                  │
│   actor(human) ─┐                       ┌─ actor(agent)          │
│   actor(human) ─┤     ← signals →       ├─ actor(agent)          │
│   actor(agent) ─┘       mark / warn     └─ actor(human)          │
│                                                                  │
│         paths weigh. hypotheses remember. fade forgives.          │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                ┌───────────┴────────────┐
                │       <ChatShell>       │   one React island
                └───────────┬────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Full page   │     │ Split pane   │     │ Floating button │
│  /chat      │     │  any page    │     │  any site       │
└─────────────┘     └──────────────┘     └─────────────────┘
```

One `<ChatShell>` component. Three mount points. Same underlying
conversation, same memory, same identity.

---

## 2. The mapping (why this already works)

From `chat-memory.md`, the substrate already treats chat as a first-class
citizen:

| Chat concept | ONE primitive |
|---|---|
| user | `actor` (kind: human) |
| bot | `actor` / `unit` (kind: agent) |
| conversation | `group` with both as members |
| message | `signal` |
| reaction / correction | `mark()` / `warn()` |

**The UI implication**: the "recipient" field in the chat UI is a *uid*,
not a model name. Switching from talking-to-an-agent to talking-to-a-human
is the same control surface — just a different `uid`. No "escalate to
human" feature to build. The UI never knew the difference.

---

## 3. Anatomy of a universal chat UI

### The four knobs

```typescript
interface ChatProps {
  // WHO you're talking to — a uid (agent or human) or a group
  target: string          // "agent:concierge" | "person:donal" | "group:founders"

  // WHERE it lives — picks the chrome
  mode: 'page' | 'split' | 'widget' | 'inline'

  // WHO is talking — resolved from Sui claim / anonymous visitor
  actor?: string          // auto-resolved; set to override

  // WHAT the substrate may do
  policy?: {
    selectRoute?: boolean   // let pheromone pick the best actor for this turn
    scope?: 'private' | 'group' | 'public'
    allowClaim?: boolean    // show /claim affordance
    showMemory?: boolean    // show /memory and /forget commands
  }
}
```

**`target` is the only thing most embeds need to set.** Everything else
has sensible substrate-driven defaults.

### Variants, each one line to render

```astro
---
// 1. Full page
<ChatShell target="agent:concierge" mode="page" client:load />
---

<!-- 2. Split pane — lives alongside other content -->
<div class="grid grid-cols-2">
  <MainContent />
  <ChatShell target="agent:concierge" mode="split" client:load />
</div>

<!-- 3. Floating button — bottom-right bubble expands to panel -->
<ChatShell target="agent:concierge" mode="widget" client:idle />

<!-- 4. Inline — embed inside a content block -->
<ChatShell target="agent:tutor" mode="inline" client:visible />
```

Four form factors. One component. Same conversation, same memory, same
identity across all of them.

---

## 4. Talking to any actor — not just agents

### The target resolution rule

```
target = "agent:concierge"   → send signal to the agent unit
target = "person:donal"      → send signal to donal (routed via his channel)
target = "group:founders"    → send signal to the founders group
target = undefined           → substrate picks via select() on tags
```

In every case, `POST /api/signal` with `{ receiver: target, data }`.
The substrate already knows how to deliver to an agent (invokes the
unit's `.on()` handler) or to a human (routes via their channel — Telegram,
web session, email — per `src/engine/human.ts`).

### The implications, which are wild

1. **"Chat with Donal" looks identical to "Chat with the SEO agent."**
   Donal's `receiver` attribute tags him as Telegram — the signal delivers
   there. He replies on Telegram. His reply routes back into the same
   `group` and appears in your chat window. The UI is oblivious.

2. **Escalation is a `target` change.** Agent says "let me hand this off"
   → the next user message has `target: 'person:donal'`. No modal. No
   "connecting you to support" screen. The conversation continues.

3. **Group chats are the same UI.** `target: 'group:founders'` means every
   member sees every message. The user's client filters by group, not by
   recipient.

4. **Substrate routing** (target omitted) lets pheromone pick the best
   responder per tag. The chat becomes a *question*, not a destination —
   whoever the world has learned is best at `seo + local + ireland` wins
   the turn.

---

## 5. Identity, across sites

From `chat-memory.md`: every actor has a Sui keypair derived from
`SUI_SEED + uid`. That primitive does all the heavy lifting.

### Anonymous visitor → claimed actor

```
visitor opens embed on customer-site.com
    │
    │  no cookie, no uid → assigned ephemeral uid
    │  signals stored with scope: private, group: visitor:<nonce>
    │
    ▼
visitor types /claim
    │
    │  substrate issues nonce
    │
    ▼
visitor DMs the bot on Telegram with /link <nonce>
    │
    │  Telegram bot signs { nonce, ts } with deriveKeypair(tg_uid)
    │
    ▼
signature verifies → visitor uid merges into tg_uid
    │
    └─ all prior signals re-attributed
       all prior path weight preserved
       memory light switches on
```

### The profound consequence

A user who has been chatting to `donal-claw` on Telegram for six months
visits elitemovers.ie, clicks the chat widget, types `/claim`, confirms
on Telegram once — and the widget **already knows their SEO preferences,
their past project, their writing style**. Not because the customer
site has a shared login — because the *actor's memory is in the substrate*,
and the chat widget is just a window into it.

No cross-site auth. No shared cookie. No OAuth dance. One Sui signature.

---

## 6. Memory, everywhere the embed goes

Per `chat-memory.md`, every turn assembles a `ContextPack` from three
parallel queries (episodic / associative / semantic). The embed inherits
this without writing any code:

```
user types →
  POST /api/signal
    → chat:ingest unit
        → persist.actor(), persist.group()
        → signal stored with scope (private for widget DMs)
    → bot:recall unit
        → 3 parallel queries: signals, open paths, hypotheses
        → ContextPack assembled
    → bot LLM call with pack
    → reply signal emitted
    → SSE stream back to the browser
  on next turn: chat:outcome unit
    → valence detector → mark() or warn()
    → substrate learns what this user cares about
```

Every mount point — `/chat`, the split pane, the floating widget — produces
signals with the same shape. Memory crosses form factors without a
single line of glue.

---

## 7. Privacy scope is a prop

The `scope` attribute on signals (from `memory.md` → *Events*) is exposed
as `policy.scope`:

```typescript
// Widget on customer-site.com: DM the user to the merchant's bot
<ChatShell target="agent:merchant-bot" mode="widget"
           policy={{ scope: 'private' }} />

// Team room embedded in an internal app
<ChatShell target="group:founders" mode="split"
           policy={{ scope: 'group' }} />

// Community board, public commentary
<ChatShell target="agent:announcer" mode="inline"
           policy={{ scope: 'public' }} />
```

`know()` (L6) promotes hypotheses only from `group` or `public` paths.
Private widget conversations never leak into the substrate's semantic
memory. Privacy is not a feature flag — it is one attribute the substrate
reads at every recall.

---

## 8. The three embed surfaces, concretely

### A. Full page (`mode="page"`)

The `/chat` route we spec in `chat-ui-upgrade.md`.

```astro
<ChatShell target={Astro.params.target ?? 'agent:concierge'}
           mode="page" client:load />
```

- Full viewport
- Virtualized conversation, persistent draft, slash commands
- Best for: deep work, long-running threads, developer consoles

### B. Split pane (`mode="split"`)

Lives next to other content. The chat *understands* what the user is looking
at.

```astro
<div class="grid grid-cols-[1fr_420px]">
  <DocView doc={doc} />
  <ChatShell target="agent:tutor"
             mode="split"
             context={{ doc_id: doc.id }}   <!-- fed into ContextPack.tools -->
             client:load />
</div>
```

- Narrow column, sticky, usually ~420px
- Receives surrounding-page context as *extra signals* the bot can query
- Best for: docs, dashboards, IDE-style pairing, admin panels
- Keyboard shortcut `⌘/` toggles collapse

### C. Floating widget (`mode="widget"`)

A bubble in the corner. Expands to a panel on click. Mounts lazy
(`client:idle`) so it doesn't affect FCP.

```astro
<ChatShell target="agent:concierge"
           mode="widget"
           client:idle />
```

- Bottom-right bubble (`bottom-6 right-6`)
- Click → panel slides up (`w-96 h-[600px] max-h-[80vh]`)
- Unread badge on bubble
- Minimized state persists to `localStorage`
- Best for: customer sites, landing pages, product tours

### D. Inline (`mode="inline"`)

Dropped into a content block, no chrome.

```astro
<article>
  <h1>How to set up your first agent</h1>
  <p>...</p>
  <ChatShell target="agent:tutor"
             mode="inline"
             initialPrompt="Walk me through step 1"
             client:visible />
  <p>When you're done, continue to step 2.</p>
</article>
```

- No fixed positioning, no modal
- Rendered at natural size, participates in document flow
- Best for: tutorials, docs, onboarding, inline demos

---

## 9. Embedding on a third-party site (SDK)

One `<script>` tag. Same component under the hood.

```html
<!-- customer-site.com/index.html -->
<script
  src="https://one.ie/chat.js"
  data-target="agent:concierge"
  data-mode="widget"
  data-theme="light"
  async
></script>
```

Under the hood:

1. `chat.js` mounts a shadow-root `<div>` with a React tree — same
   `<ChatShell>` from `/chat`.
2. Styles are scoped to shadow root (never collides with host site).
3. Signals `POST` to `https://api.one.ie/signal` (the Gateway worker) with
   `Origin` → the Gateway's origin allowlist decides whether to accept.
4. Streaming via SSE through the same `/chat-director` pipe, proxied by
   the Gateway.
5. Identity: the embed stores a signed visitor cookie; `/claim` promotes
   to a full actor via the Telegram ceremony.

### Gateway responsibilities (already in place)

The Gateway worker at `api.one.ie`:
- Validates `Origin` (per-agent allowlist — a merchant's bot only accepts
  signals from their domains)
- Rate-limits per visitor-uid
- Proxies SSE straight through (no buffering)
- Emits a deploy signal so the substrate learns which embed origins route
  the most successful turns

One domain owns the config: the agent's markdown file declares `allowedOrigins`,
and the Gateway reads from TypeDB. The merchant changes their domain → agent
markdown update → `/sync agents` → live.

---

## 10. The surface area of the component

What `<ChatShell>` needs from the rest of the codebase — all of which
exists or is planned in `chat-ui-upgrade.md`:

```
<ChatShell>
  ├── useChat()                  ← hook from chat-ui-upgrade §3
  │     ├── POST /api/signal     ← already exists
  │     ├── SSE parser           ← lib/chat/stream.ts (planned)
  │     └── useReducer state
  │
  ├── useIdentity()              ← NEW (small): visitor uid, claim, sign
  │     ├── ephemeral uid on first mount
  │     ├── /claim command       ← returns nonce, opens Telegram deep link
  │     └── stores signed cookie once linked
  │
  ├── useScopedStorage()         ← drafts + last N turns, namespaced by target
  │
  ├── <Frame mode={mode}>         ← thin wrapper, picks the chrome
  │     ├── FullPageFrame
  │     ├── SplitPaneFrame
  │     ├── WidgetFrame          ← floating bubble + panel
  │     └── InlineFrame
  │
  ├── <ConversationView>         ← virtualized, same as chat-ui-upgrade
  ├── <PromptDock>               ← controlled input, slash commands
  └── <MemoryCommands>           ← /memory, /forget, /explore (from chat-memory.md §730)
```

Two new hooks (`useIdentity`, `useScopedStorage`), four thin frame
wrappers. Everything else already exists or is being refactored. The
"universal chat" is not a new product — it is **the refactored chat with
four mounts instead of one**.

---

## 11. Three memory commands every embed ships with

From `chat-memory.md` §730. Because the substrate already implements
`reveal`, `forget`, and `frontier`, every embed — full page, split, widget,
inline — exposes three commands for free:

```
/memory   → show me what you remember (reveal: card)
/forget   → erase me (forget: TQL cascade + fade cleanup)
/explore  → what haven't we talked about? (frontier: unexplored tags)
```

This is the feature no Mem0-style chat widget can honestly offer: **the
user owns their memory, visible at any embed, portable across sites,
erasable with one command**. GDPR Articles 17 (erasure) and 20
(portability) are two substrate calls, not a compliance project.

---

## 12. Form-factor-specific polish

### Widget (the most commercially important)

- **Teaser bubble** — can show the last reply preview (*"Tony just sent
  a message — click to reply"*)
- **Unread dot** when the substrate pushed a proactive signal (e.g. L7
  frontier suggestion: *"you've never asked about X, want to?"*)
- **Proactive surface** — agent can `emit` a signal to the visitor with
  `data: { nudge: true }`; the widget shows a tooltip bubble without
  auto-opening (respect!)
- **Memory-of-absence onboarding** — on first open, the widget queries
  `persist.frontier(visitor)` and suggests 3 starting questions

### Split pane

- **Context signal** — the host page sends `window.postMessage({
  type: 'context', data: { selection, route, viewport } })`; the shell
  forwards it as a signal the bot's `ContextPack` can read
- **Smart resize** — remembers the user's preferred width per hostname
- **Pop out** → becomes a widget in a child window; same conversation,
  same memory, no reload

### Inline

- **Scroll-lock** — when the user is typing, the page scroll is paused so
  the input doesn't jump out from under them
- **Reader-mode aware** — inherits the host article's typography so the
  chat *looks like* part of the page

### Full page

- **Multi-target switcher** — a dropdown with the last 5 targets the user
  has spoken with (agents and humans, indistinguishable). Clicking
  switches the conversation group but the memory layer is unchanged.
- **Shareable URLs** — `/chat/g/<groupId>` deep-links into a conversation
  (subject to scope) — great for team rooms

---

## 13. Why this is structurally elegant (countable)

Same yardstick as `memory.md` §*The elegance claim, in numbers*:

```
                              Typical "chat platform"       ONE
───────────────────────────────────────────────────────────────
Different UIs per form factor     3 (widget + page + app)    1 component, 4 frames
Message/identity stores            2–3 (chat DB + auth DB)    1 (substrate)
Code to escalate human-in-loop     new feature, new modal     change target uid
Code to embed on 3rd-party site    custom SDK                 same component + origin
Cross-site memory                  shared login required      Sui signature
Group chat                         separate multi-user mode   target = group:<id>
GDPR erasure                       compliance project         /forget → 1 TQL
Memory portability                 export tool                /memory → memory card
```

**Elegance = countable reduction in moving parts while capability goes
up.** The universal chat is not *another feature* — it is the substrate's
natural UI, finally admitted.

---

## 14. Build order (waves, not weeks)

Assumes `chat-ui-upgrade.md` W3 has landed (ChatShell refactored).

```
wave W5  — identity hook + claim ceremony UI
    task   useIdentity()            stores visitor uid, signs claim
    task   <ClaimDialog>            nonce display, Telegram deep link
    task   /memory command          calls persist.reveal(), renders card
    task   /forget command          calls persist.forget(), confirms
    task   /explore command         calls persist.frontier(), suggests

wave W6  — frames
    task   <WidgetFrame>            floating bubble + slide-up panel
    task   <SplitPaneFrame>         sticky column, ⌘/ toggle, postMessage ctx
    task   <InlineFrame>            natural flow, no fixed positioning
    task   mode prop plumbing       <ChatShell mode={...}> picks frame

wave W7  — third-party embed
    task   chat.js                  single <script> loader
    task   shadow-root isolation    scoped styles, no host collision
    task   Gateway origin check     agent.allowedOrigins enforced
    task   signed visitor cookie    HttpOnly, per-domain

wave W8  — target-agnostic routing
    task   target="person:<uid>"    human-target UI chrome (avatar, channels)
    task   target="group:<id>"      member list, scope selector
    task   target omitted           pheromone-select dispatcher + "why this agent" popover

cycle exit   — rubric ≥ 0.65 on each form factor; embed script < 30KB gz;
              /claim round-trip < 10s; widget FCP < 200ms.
```

Every task is an atomic `.on()` handler or component. Every wave ends
with `mark()` on the paths that carried value. No calendar time.

---

## 15. The deeper claim

The chat UI is not a *product*. It is the **public surface of a world
that already remembers**. What makes it elegant is not any specific
feature — it is the absence of subsystems:

- No chat database (signals).
- No profile store (hypotheses).
- No session manager (groups).
- No cross-site auth (Sui signatures).
- No human-in-loop orchestrator (target is a uid).
- No consolidation pipeline (L6).
- No retrieval layer (typed queries).
- No memory-export service (`reveal`).
- No GDPR module (`forget`).
- No SDK server (Gateway origin allowlist + agent markdown).

Every one of these is a subsystem other chat products build, sell, and
maintain. ONE *never created them* — because the substrate was already
built for a world of actors, paths, and memory. A chat UI is just a
window on it. Put the window anywhere. The view is the same.

```
They build a chat product.
ONE points a lens at a world.
```

---

## See Also

- [chat-ui-upgrade.md](chat-ui-upgrade.md) — how we refactor the god
  component that makes all this possible
- [chat-memory.md](chat-memory.md) — the memory story this UI is a window
  onto
- [memory.md](memory.md) — the full 6-dimensional memory model
- [CHAT_ARCHITECTURE.md](CHAT_ARCHITECTURE.md) — the shipped architecture
  today (pre-refactor)
- [one-ontology.md](one-ontology.md) — the 6 dimensions
- [world-map-page.md](world-map-page.md) — visitor mode (cold-start policy)
- `src/engine/human.ts` — a person as a substrate unit
- `src/engine/persist.ts` — `actor()`, `group()`, `signal()`, `recall()`,
  `reveal()`, `forget()`, `frontier()`
- `src/lib/sui.ts` — `addressFor(uid)`, `deriveKeypair(uid)` — identity
- `nanoclaw/src/workers/router.ts` — the edge chat loop today
- `gateway/` — origin checks, broadcast, WsHub DO

---

*Chat is the view. The world is the application.*
