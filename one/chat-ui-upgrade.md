# Chat UI Upgrade — `/chat` page refactor plan

**Target:** `src/pages/chat.astro` + `src/components/ai/*`
**Source of truth:** `docs/DSL.md`, `docs/dictionary.md`, `src/schema/one.tql`
**Scope:** make it **smaller, faster, more beautiful, more substrate-native**, without regressing any feature.

---

## 1. Current state — the numbers

| File | Lines | Role |
|------|------:|------|
| `components/ai/ChatClientV2.tsx` | **2,776** | God component: state, models, demos, SSE, render, modals, styles |
| `components/ai/elements/prompt-input.tsx` | 1,134 | Every input variant in one file |
| `components/ai/elements/message.tsx` | 358 | Generic message primitives |
| `components/ai/SimpleChatClient.tsx` | 383 | Dead — superseded by V2 |
| `components/ai/FreeChatClient.tsx` | 267 | Dead — superseded by V2 |
| `components/ai/Chatbot.tsx` | 71 | Dead — superseded |
| `components/ai/chat/ChatMessage.tsx` | 318 | Parallel tree to `elements/message.tsx` |
| 28 files in `ai/elements/` | ~3,500 | Assorted primitives (mostly healthy) |
| **Total `ai/`** | **~9,500** | |

The `/chat` page is `Layout` + `<ChatClientV2 client:only="react" />` — SSR renders nothing.

### Inside ChatClientV2

- **24 `useState` hooks** at the top of one component
- **~80 lines of inline `<style>`** inside JSX (should be a CSS module or Tailwind)
- **223 lines of `POPULAR_MODELS`** — static data wedged into the render file
- **~280 lines of `DEMO_RESPONSES`** — hard-coded mock data
- **470-line `handleSubmit`** — demo detection + SSE stream parser + 3 branches + error handling
- **Textarea is uncontrolled** (`textareaRef.current.value`) — loses drafts, desyncs with state, fights React
- **`any` and `as any` casts** throughout submit wiring (`message: any`, `event as any`, `new Event('submit') as any`)
- **No memoization** of `renderMessage`, `POPULAR_MODELS.filter(...)` (runs per render × chef × filter)
- **No virtualization** — 200-message conversations re-render all nodes on every token
- **No persistence** — refresh = lost conversation
- **No error boundary** — one bad generative UI payload crashes the page
- **`client:only="react"`** — zero SSR shell, white flash until hydration

### Four-outcome hygiene

Per Rule 1 (Closed Loop), every chat submit closes the loop through the substrate.
Right now the browser `fetch` resolves and the client just appends messages.
No `mark()` / `warn()` edge is deposited on `chat → agent` paths.
**The `/chat` page is not teaching the substrate anything.**

---

## 2. Goals

1. **Shrink the god component** — `ChatClientV2` should be ≤ 250 lines
2. **One chat client** — delete `SimpleChatClient`, `FreeChatClient`, `Chatbot`
3. **One message tree** — collapse `ai/chat/` into `ai/elements/`
4. **Sub-250ms FCP** — SSR the shell, islandize only the live parts
5. **Substrate-native** — every user turn is a signal; every outcome marks/warns an edge
6. **Type-safe** — delete `any` in the hot path; narrow `Signal.data` at the router, not in the type
7. **Persistent** — drafts + recent conversation in `localStorage`, full history in D1
8. **Accessible** — focus trap on modal, `aria-live` on message list, keyboard-first model selector
9. **Deterministic results** (Rule 3) — every turn reports tokens, ms-to-first-token, model, outcome

---

## 3. Proposed architecture

```
src/pages/chat.astro                     # SSR shell: header + empty conversation + prompt skeleton
  └── <ChatShell client:load>            # small island (~200 lines): router, key boundary
        ├── <ConversationView>           # pure; virtualized; reads from useChat()
        │     └── <MessageRenderer>      # switch on message.type
        ├── <PromptDock>                 # controlled textarea + attachments + voice + model
        ├── <SettingsModal>              # API key, model picker (lazy: client:idle)
        └── <DemoSuggestions>            # only when messages.length === 0

src/hooks/ai/
  useChat.ts                # single source of truth: messages, send, stop, stream state
  useChatPersistence.ts     # localStorage draft + last conversation
  useSubstrateOutcome.ts    # on every turn: POST /api/signal with {result|timeout|warn}

src/lib/chat/
  models.ts                 # POPULAR_MODELS (was 223 lines in render file)
  demos.ts                  # DEMO_RESPONSES + suggestionGroups
  stream.ts                 # SSE parser — one pure function, fully tested
  types.ts                  # Message, ExtendedMessage, ChatState
```

**Delete:** `SimpleChatClient.tsx`, `FreeChatClient.tsx`, `Chatbot.tsx`, `ai/chat/` folder (after collapse).

---

## 4. Refactor plan — in waves

### W0 — Baseline

```bash
npm run verify   # tests green before we start
```
Screenshot `/chat` empty + mid-conversation + demo-response for regression comparison.

### W1 — Recon (read-only)

- [ ] Grep every importer of `SimpleChatClient`, `FreeChatClient`, `Chatbot`
- [ ] Diff `ai/chat/ChatMessage.tsx` vs `ai/elements/message.tsx` — what's unique?
- [ ] Identify which `ai/elements/*` are actually used (28 files, probably ~12 live)
- [ ] Map every `useState` in ChatClientV2 to one of: server-state, UI-state, transient-UI, derived

### W2 — Decide

| Decision | Choice |
|----------|--------|
| State management | `useReducer` for chat state; `useState` only for modal toggles |
| Textarea | **Controlled** — `value={draft}`, persist to `localStorage` on debounce |
| SSE parsing | Extract to `lib/chat/stream.ts`; test with fixtures; consider `@vercel/ai/react`'s `useChat` |
| Styling | Replace inline `<style>` with Tailwind utilities + one `@layer components` rule in `globals.css` |
| Data files | Move `POPULAR_MODELS`, `DEMO_RESPONSES`, `suggestionGroups` to `lib/chat/` |
| SSR | Keep interactive island but add `client:load` (not `client:only`) so Astro can render the empty shell |
| Demo detection | Replace string-match in `handleSubmit` with `demos.find(d => d.match(text))` declarative table |

### W3 — Edit (in order, small PRs)

1. **Extract data** — `lib/chat/models.ts`, `lib/chat/demos.ts`. ChatClientV2 shrinks ~500 lines, no behavior change.
2. **Extract SSE** — `lib/chat/stream.ts` with `parseDirectorStream(reader): AsyncIterable<StreamEvent>`. Unit test with canned streams.
3. **Extract components** — `ConversationView`, `PromptDock`, `SettingsModal`, `DemoSuggestions` under `components/ai/chat-v3/`.
4. **Hook consolidation** — `useChat()` returns `{ messages, send, stop, isStreaming, error }`. Internal `useReducer` replaces 15 of the 24 useStates.
5. **Delete dead clients** — `SimpleChatClient`, `FreeChatClient`, `Chatbot`. Search for usages first; they have none.
6. **Collapse `ai/chat/`** — Move `ChatWelcome`, `ChatSettings`, etc. into `ai/chat-v3/` or `ai/elements/` as appropriate.
7. **Substrate wiring** — after stream ends, POST `/api/signal` with receiver=`chat:outcome`, data=`{outcome, ms, tokens, model}`. Marks the `chat → model` edge.
8. **SSR the shell** — `chat.astro` renders header + empty conversation + prompt placeholder. Hydrate only on user focus/type.

### W4 — Verify

- [ ] `npm run verify` green
- [ ] Visual regression against W0 screenshots
- [ ] Lighthouse: FCP < 500ms, CLS = 0, TTI < 1.5s (currently ~white screen until JS loads)
- [ ] Token-stream smoothness: no visible re-flow per token (DevTools perf trace)
- [ ] `ChatClientV2.tsx` line count < 300 (was 2,776) — target 10× reduction
- [ ] Report rubric: `{ fit, form, truth, taste }` for the new shell

---

## 5. User-facing upgrades (what "more beautiful, more user-friendly" means)

These are the features the refactor *enables*; most are not possible today without surgery on the monolith.

### A. Persistence & resumability
- **Draft survives refresh** — controlled textarea + `localStorage.setItem('chat-draft', draft)` on debounce
- **Conversation history** — `/chat?id=<uuid>` loads past conversations from D1; default URL is a new conversation
- **"Continue where you left off"** pill on page load if the last conversation is < 24h old

### B. Input polish
- **Slash commands** — `/model claude-haiku`, `/clear`, `/fork`, `/share` — teaches power users, keeps the UI clean
- **Command palette** (⌘K) for model switching, clear, share — replaces the three always-visible buttons
- **Paste-to-attach** — screenshots from clipboard auto-attach
- **Drag-and-drop** zone lights up on drag-over anywhere on the page
- **Stop button** is **always visible while streaming** (today it's buried)
- **Resend last message** on error with one click (today: retype)

### C. Message rendering
- **Virtualized list** (`react-virtuoso` or `use-stick-to-bottom` which is already installed)
- **Collapsible long code blocks** auto-collapse over 30 lines with "expand"
- **"Copy code"** inline button per `<pre>` (uses `CodeBlock`)
- **Streaming shimmer** while waiting for first token — use `elements/shimmer.tsx` (already exists, unused)
- **Message actions** on hover: copy / retry / fork / cite-into-next-turn
- **Edit user message** — re-submit from that point, discard downstream (like ChatGPT)
- **Reasoning chips** collapsed by default; click to expand

### D. Model selector
- **Recent models** group at top (last 3 used)
- **Search-as-you-type** already works via `ModelSelectorInput` — make it default-focused
- **Per-model stats** pulled from substrate: avg tokens/sec, avg cost, pheromone strength on `chat → model`
- **Free badge** becomes a price chip when a key is set (`$0.15/M`)
- **Cmd-number** keyboard shortcuts for the top 5

### E. Multi-agent visibility (Director mode)
- **Agent pills** animate in as the director assigns them (works in backend; UI is cramped)
- **Parallel streams** render side-by-side when > 1 agent is active (currently interleaved)
- **Per-agent color** matches the skin in `/world`
- **"Why this agent?"** popover shows the pheromone path that routed here

### F. Generative UI
- **GenerativeUIRenderer** (already imported by PLAN-chat) rendered inside a message bubble with a border and a "generated" badge
- **Download / copy as JSON** on every generated component
- **"Pin to sidebar"** promotes a generated chart/card to a persistent panel next to the conversation

### G. Accessibility
- `aria-live="polite"` on the conversation region for screen readers
- Focus trap on `SettingsModal` (`@radix-ui/react-dialog` — already in shadcn)
- `Escape` closes the model selector, modal, image previews
- Keyboard-only flow: Tab from textarea → model → send; no mouse required
- High-contrast theme variant (today some `text-muted-foreground` fails WCAG AA on `bg-sidebar`)

### H. Mobile
- Bottom-sheet pattern for settings on `< md` (currently a centered modal that gets clipped)
- Sticky prompt-dock with `env(safe-area-inset-bottom)` padding for iOS home-indicator
- Voice button as FAB when keyboard is up

### I. Performance
- **SSR the shell** — header + empty state render with zero JS; FCP drops from ~800ms to ~150ms
- **Lazy-load** heavy elements: `ModelSelector` only when the pill is clicked; `SettingsModal` on `client:idle`
- **Memoize** `renderMessage` by `msg.id` + content length
- **Virtualize** messages over 30 (use `use-stick-to-bottom` which is already installed)
- **Code-split** demo data — only imported when `messages.length === 0`

### J. Substrate integration (the ONE-specific upgrade)
- **Every turn is a signal**: `POST /api/signal { receiver: "chat:turn", data: { tags: [model, "user"], content: text } }`
- **Outcome closes the loop**: on stream end → `/api/signal { receiver: "chat:outcome", data: { outcome: "result"|"timeout"|"dissolved", ms, tokens, model } }` — which then `mark()`s the `chat → model` edge
- **Model selector weights** read from `net.highways()` — fast models that produce results on this user's prompts rise
- **"Why this answer?"** — tiny pheromone-strength bar on each assistant message showing the path weight that routed it
- **Pin a conversation** = harden the path, promote to knowledge (L6)

---

## 6. Proposed file layout (after refactor)

```
src/pages/chat.astro                        # 40 lines: SSR shell + <ChatShell client:load>
src/components/ai/chat-v3/
  ChatShell.tsx                             # ~200 lines — top-level island
  ConversationView.tsx                      # ~150 lines — virtualized message list
  MessageRenderer.tsx                       # ~180 lines — switch on msg.type
  PromptDock.tsx                            # ~150 lines — controlled textarea + dock
  SettingsModal.tsx                         # ~100 lines — lazy-loaded
  DemoSuggestions.tsx                       # ~80 lines  — welcome cards
  index.ts                                  # barrel

src/hooks/ai/
  useChat.ts                                # reducer + send + stop
  useChatPersistence.ts                     # draft + conversation localStorage
  useSubstrateOutcome.ts                    # signal router
  useStreamingBubble.ts                     # shimmer → first token → full text

src/lib/chat/
  models.ts                                 # POPULAR_MODELS (pure data)
  demos.ts                                  # DEMO_RESPONSES + suggestionGroups
  stream.ts                                 # parseDirectorStream() — pure, tested
  types.ts                                  # Message, ChatState, StreamEvent

src/styles/chat.css                         # was inline <style> in JSX

# DELETED
src/components/ai/ChatClientV2.tsx           # replaced
src/components/ai/SimpleChatClient.tsx       # dead
src/components/ai/FreeChatClient.tsx         # dead
src/components/ai/Chatbot.tsx                # dead
src/components/ai/chat/                      # folded into chat-v3/ or elements/
```

Expected total: **~1,100 lines** of owned chat code (was ~4,000). Feature parity + new features.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Behavior regression in Director mode streaming | Unit test `parseDirectorStream` with canned SSE fixtures captured from prod |
| Lost drafts during refactor | Ship persistence in W3 step 1, before touching submit flow |
| Visual regression | Playwright screenshot diff at W0 vs each W3 step |
| Premium-tier gating logic tangled | Extract `canUseModel(model, apiKey)` pure function first, test independently |
| `use-stick-to-bottom` + virtualization fight | Pick one (use-stick-to-bottom already in deps); test on 500-msg conversations |

---

## 8. Deterministic exit (Rule 3)

W4 reports, numbers-first, before closing:

```
tests   : 320/320 passing
biome   : clean
tsc     : clean, no `any` in chat-v3/
lines   : ChatClientV2 2776 → ChatShell 204 (92.6% reduction)
files   : deleted 3 dead clients (721 lines removed)
FCP     : was 850ms, now 180ms  (Lighthouse, 3G throttled)
TTI     : was 1800ms, now 450ms
bundle  : /chat chunk 420KB → 180KB (code-split demos, lazy modal)
rubric  : { fit: 0.92, form: 0.88, truth: 0.90, taste: 0.90 }
```

If any number misses, `warn(0.5)` the refactor edge and iterate.

---

## See Also

- `docs/CHAT_ARCHITECTURE.md` — current architecture (pre-refactor reference)
- `docs/PLAN-chat.md` — prior import plan from ONE/web (context)
- `docs/TODO-chat.md` — imported-component checklist
- `docs/DSL.md` — signal grammar (every turn is a signal)
- `docs/dictionary.md` — canonical names (chat is a `skill` on Dimension 3)
- `src/schema/one.tql` — chat ontology (signal = Dimension 5)
- `.claude/rules/react.md` — React 19 patterns (actions, `use()`, transitions — chat should use them)
- `.claude/rules/astro.md` — hydration directives (replace `client:only` with `client:load` + SSR shell)
- `.claude/rules/engine.md` — the three locked rules (closed loop, structural time, deterministic results)
