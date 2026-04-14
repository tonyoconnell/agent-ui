---
title: TODO Chat — Import ONE/web Chat Stack
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 10
completed: 0
status: OPEN
---

# TODO: Chat — Import ONE/web Chat Stack into Envelopes

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path.
>
> **Goal:** Port the full ChatClientV2 stack from `../ONE/web` into envelopes —
> generative UI, model selector, tool visualization, markdown, reasoning display —
> wired to envelopes' substrate-backed `api/chat.ts`.
>
> **Source of truth:** [DSL.md](DSL.md) — signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark)
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — chat is a `signal` (dim 5),
> `ChatClientV2` is a `skill` (dim 3), pheromone routes model selection on the
> `chat` tag edge.

## Routing

Signals flow down through waves. Results flow up, marking paths.

```
    signal DOWN                     result UP
    ──────────                      ─────────
    /do TODO-chat.md                result + 4 tagged marks
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W1     │  Haiku recon ────────────┤ mark(edge:fit, score)
    │  read   │  → map imports           │ mark(edge:form, score)
    └────┬────┘                          │ mark(edge:truth, score)
         │ dependency tree               │ mark(edge:taste, score)
         ▼                               │
    ┌─────────┐                          │
    │  W2     │  Opus decide             │
    │  fold   │  → copy specs            │
    └────┬────┘                          │
         │ ordered copy list             │
         ▼                               │
    ┌─────────┐                          │
    │  W3     │  Sonnet copy             │
    │  apply  │  → files copied + adapted│
    └────┬────┘                          │
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W4     │  Sonnet verify ──────────┘
    │  score  │  → tsc + biome + smoke test
    └─────────┘
```

**Context accumulates down. Quality marks flow up. Pheromone routes sideways.**

## Testing — Deterministic Sandwich

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    ├── biome check .                  ├── biome check .
    ├── tsc --noEmit                   ├── tsc --noEmit
    └── vitest run                     └── vitest run + /chat loads
```

### W0 — Baseline

```bash
bun run verify   # must be green before any cycle begins
```

---

```
   CYCLE 1: WIRE                CYCLE 2: PROVE           CYCLE 3: GROW
   Packages + deps layer        AI components            ChatClientV2 + pages
   ─────────────────────        ──────────────           ────────────────────
   12 files, ~15 writes         18 files, 0 adapts       5 files, ~3 adapts
        │                            │                        │
        ▼                            ▼                        ▼
   ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐
   │ H   O  S  S  │  ──►   │ H   O  S  S  │  ──►   │ H   O  S  S  │
   └──────────────┘        └──────────────┘        └──────────────┘

   H = Haiku (recon)    O = Opus (decide)    S = Sonnet (copy + verify)
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | Packages + UI atoms + lib + config installed | L1 (signal), L2 (path marking) |
| **PROVE** | AI elements + generative-ui + hooks copied | L3 (fade) joins L1-L2 |
| **GROW** | ChatClientV2 + pages wired, `/chat` live | L4-L5 (pheromone learns model routing) |

---

## Source of Truth

**[DSL.md](DSL.md)** — signal grammar, `{ receiver, data }`, mark/warn/fade
**[dictionary.md](dictionary.md)** — canonical names, unit/signal/path definitions
**[rubrics.md](rubrics.md)** — quality scoring: fit/form/truth/taste as tagged edges

| Item | Canonical | Notes |
|------|-----------|-------|
| `chat` tag | `{ tags: ['chat'] }` on signal data | Pheromone routes model selection |
| `api/chat.ts` | Keep existing substrate endpoint | Do not replace — it marks paths |
| `ChatClientV2` | Copy verbatim, remove `"use client"` if needed | Astro ignores it anyway |
| `config/backend.ts` | Create as shim, no Convex | `tier: 'free'`, `enabled: false` |

---

## Cycle 1: WIRE — Packages, UI atoms, lib, config

**Files touched:** `package.json`, `src/config/backend.ts`, `src/lib/claude-code-events.ts`,
`src/lib/security.ts`, `src/hooks/use-toast.ts`, 6× `src/components/ui/*.tsx`

**Why first:** ChatClientV2 and every element component import from these.
Until packages are installed and these stubs exist, `tsc` fails on every downstream file.
Wire the foundation before any component lands.

---

### Wave 1 — Recon (parallel Haiku x 4)

Read the four import surfaces that need new files. Report verbatim, line numbers.

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `../ONE/web/src/components/ui/alert.tsx` | Radix imports, exports |
| R2 | `../ONE/web/src/components/ui/{hover-card,label,select,toast,toaster}.tsx` | Same |
| R3 | `../ONE/web/src/lib/security.ts` | Exports: secureGetItem/SetItem/RemoveItem/maskSensitive |
| R4 | `../ONE/web/src/lib/claude-code-events.ts` | All exported types and AGENT_PROFILES |

**Outcome:** 4 reports with exact file contents. Advance when 3/4 in.

---

### Wave 2 — Decide (Opus)

**Context:** DSL.md + dictionary.md + this file + W1 reports.

Decisions to make:
1. Which packages to install (marked below — confirmed from ChatClientV2 imports)
2. Whether `security.ts` key `"ONE-PLATFORM-2025"` needs to change for envelopes
3. Whether `backendConfig.endpoints.api` should point to `/api` (local) or `https://api.one.ie`
4. Confirm `"use client"` can be kept verbatim (Astro ignores, no issue)

**Packages to install:**
```bash
bun add marked shiki use-stick-to-bottom ai-sdk-provider-claude-code @ai-sdk/openai
```

**Output:** copy specs for each file (source path → target path, any adaptations).

---

### Wave 3 — Edits (Sonnet x 8)

```bash
# E1 — packages
bun add marked shiki use-stick-to-bottom ai-sdk-provider-claude-code @ai-sdk/openai

# E2-E6 — missing UI components
cp ../ONE/web/src/components/ui/alert.tsx      src/components/ui/alert.tsx
cp ../ONE/web/src/components/ui/hover-card.tsx src/components/ui/hover-card.tsx
cp ../ONE/web/src/components/ui/label.tsx      src/components/ui/label.tsx
cp ../ONE/web/src/components/ui/select.tsx     src/components/ui/select.tsx
cp ../ONE/web/src/components/ui/toast.tsx      src/components/ui/toast.tsx
cp ../ONE/web/src/components/ui/toaster.tsx    src/components/ui/toaster.tsx

# E7 — lib files
cp ../ONE/web/src/lib/claude-code-events.ts src/lib/claude-code-events.ts
cp ../ONE/web/src/lib/security.ts           src/lib/security.ts

# E8 — config/backend.ts (new file, see spec below)
mkdir -p src/config

# E9 — use-toast hook
cp ../ONE/web/src/hooks/use-toast.ts src/hooks/use-toast.ts
```

**`src/config/backend.ts` spec:**
```typescript
export interface BackendConfig {
  enabled: boolean
  tier: 'free' | 'starter' | 'pro' | 'enterprise'
  features: { persistence: boolean; humanInTheLoop: boolean; analytics: boolean; rag: boolean; multiTenant: boolean }
  endpoints: { api: string; convex?: string }
}
const isBackendEnabled = import.meta.env.PUBLIC_BACKEND === 'on'
export const backendConfig: BackendConfig = {
  enabled: isBackendEnabled,
  tier: isBackendEnabled ? ((import.meta.env.PUBLIC_TIER as any) || 'starter') : 'free',
  features: { persistence: false, humanInTheLoop: false, analytics: false, rag: false, multiTenant: false },
  endpoints: { api: import.meta.env.PUBLIC_BACKEND_URL || '/api' },
}
export const isFeatureEnabled = (f: keyof BackendConfig['features']) => backendConfig.features[f]
export const isFreeTier = () => backendConfig.tier === 'free'
export const canAccessPremium = () => backendConfig.enabled
```

---

### Wave 4 — Verify (Sonnet x 1)

```bash
bun run verify   # biome + tsc + vitest
```

Check:
1. `src/config/backend.ts` — types clean, no Convex import
2. `src/components/ui/` — all 6 new files type-check with existing Radix deps
3. `src/lib/security.ts` — exports match what ChatClientV2 imports
4. `src/hooks/use-toast.ts` — imports `ToastProps` from `./components/ui/toast` correctly

**Rubric:** fit=0.9 (config is exact shim), form=0.85 (copied verbatim), truth=0.95 (types check), taste=0.8
**Exit:** `tsc --noEmit` passes, `biome check` clean on touched files.

### Cycle 1 Gate

```bash
bun run verify
ls src/config/backend.ts src/lib/security.ts src/lib/claude-code-events.ts src/hooks/use-toast.ts
ls src/components/ui/alert.tsx src/components/ui/toast.tsx src/components/ui/toaster.tsx
```

- [ ] `bun run verify` green (no regressions)
- [ ] 6 new UI components exist
- [ ] `src/config/backend.ts` exports `backendConfig`, `isFreeTier`, `canAccessPremium`
- [ ] `src/lib/security.ts` exports `secureGetItem`, `secureSetItem`, `secureRemoveItem`, `maskSensitive`

---

## Cycle 2: PROVE — AI elements, generative-ui, hooks

**Files touched:** 3× `src/components/ai/elements/`, 12× `src/components/generative-ui/`,
8× `src/hooks/ai/`

**Why second:** These are the mid-tier. Elements are consumed by top-level components.
Generative UI is consumed by `AgentMessage`. Hooks are consumed by `ChatClientV2`.
Must exist before the assembled components land in Cycle 3.

**Depends on:** Cycle 1 complete (`config/backend.ts` and lib files exist).

---

### Wave 1 — Recon (parallel Haiku x 3)

| Agent | Files | What to look for |
|-------|-------|-----------------|
| R1 | `../ONE/web/src/components/ai/elements/{conversation,message,reasoning}.tsx` | Imports from `@/components/ui/*`, `@ai-sdk/react`, `ai` |
| R2 | `../ONE/web/src/components/generative-ui/*.tsx` | All imports — recharts, @/components/ui/* |
| R3 | `../ONE/web/src/hooks/ai/**/*.ts` | Imports from `@/config/backend`, `@ai-sdk/react` |

**Outcome:** Confirm no imports from missing packages or missing components.

---

### Wave 2 — Decide (Opus)

**Key decisions:**
1. `elements/conversation.tsx`, `elements/message.tsx`, `elements/reasoning.tsx` — copy verbatim (no substrate adaptation needed, they are pure UI)
2. `generative-ui/` — copy verbatim (recharts already in deps)
3. `hooks/ai/premium/*.ts` — copy verbatim (they branch on `backendConfig.enabled` which we've shim'd)
4. `hooks/ai/useAIChat.ts` — verify it imports from `@/config/backend` (our shim handles it)

**Output:** copy specs, any import path fixes needed.

---

### Wave 3 — Edits (Sonnet x 3)

```bash
# E1 — missing AI elements
cp ../ONE/web/src/components/ai/elements/conversation.tsx src/components/ai/elements/conversation.tsx
cp ../ONE/web/src/components/ai/elements/message.tsx      src/components/ai/elements/message.tsx
cp ../ONE/web/src/components/ai/elements/reasoning.tsx    src/components/ai/elements/reasoning.tsx

# E2 — generative-ui (12 files)
mkdir -p src/components/generative-ui
cp ../ONE/web/src/components/generative-ui/GenerativeUIRenderer.tsx  src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicButton.tsx         src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicCard.tsx           src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicChart.tsx          src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicChartRecharts.tsx  src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicCheckout.tsx       src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicForm.tsx           src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicList.tsx           src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicProduct.tsx        src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicTable.tsx          src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/DynamicTimeline.tsx       src/components/generative-ui/
cp ../ONE/web/src/components/generative-ui/RechartsWrapper.tsx       src/components/generative-ui/

# E3 — hooks/ai (8 files, preserve subdirs)
mkdir -p src/hooks/ai/basic src/hooks/ai/premium
cp ../ONE/web/src/hooks/ai/useAIChat.ts                    src/hooks/ai/useAIChat.ts
cp ../ONE/web/src/hooks/ai/basic/useClientChat.ts          src/hooks/ai/basic/useClientChat.ts
cp ../ONE/web/src/hooks/ai/basic/useGenerativeUI.ts        src/hooks/ai/basic/useGenerativeUI.ts
cp ../ONE/web/src/hooks/ai/premium/useAgentActions.ts      src/hooks/ai/premium/useAgentActions.ts
cp ../ONE/web/src/hooks/ai/premium/useAgentContext.ts      src/hooks/ai/premium/useAgentContext.ts
cp ../ONE/web/src/hooks/ai/premium/useBackendChat.ts       src/hooks/ai/premium/useBackendChat.ts
cp ../ONE/web/src/hooks/ai/premium/useCompleteChatFlow.ts  src/hooks/ai/premium/useCompleteChatFlow.ts
cp ../ONE/web/src/hooks/ai/premium/useTokenUsage.ts        src/hooks/ai/premium/useTokenUsage.ts
```

---

### Wave 4 — Verify (Sonnet x 1)

```bash
bun run verify
```

Check:
1. All 3 new elements export named components
2. `GenerativeUIRenderer.tsx` imports from `./Dynamic*` — all exist
3. `useAIChat.ts` imports `backendConfig` — resolves to `src/config/backend.ts`
4. No circular imports between elements and hooks

**Exit:** `tsc --noEmit` clean, 12 generative-ui files exist, hooks resolve.

### Cycle 2 Gate

```bash
bun run verify
ls src/components/ai/elements/conversation.tsx src/components/ai/elements/message.tsx src/components/ai/elements/reasoning.tsx
ls src/components/generative-ui/GenerativeUIRenderer.tsx
ls src/hooks/ai/useAIChat.ts src/hooks/ai/basic/useClientChat.ts src/hooks/ai/premium/useBackendChat.ts
```

- [ ] `bun run verify` green
- [ ] 3 new elements exist and type-check
- [ ] 12 generative-ui files exist
- [ ] 8 hooks exist

---

## Cycle 3: GROW — Top-level components + pages + API

**Files touched:** 14× `src/components/ai/*.tsx`, `src/pages/chat.astro`,
`src/pages/api/chat-director.ts`, `src/pages/api/chat-claude-code.ts`

**Why last:** `ChatClientV2` imports from every layer below it. Wire foundation first,
then assemble. The page is the final connection that makes `/chat` live.

**Depends on:** Cycles 1 + 2 complete.

---

### Wave 1 — Recon (parallel Haiku x 3)

| Agent | Files | What to look for |
|-------|-------|-----------------|
| R1 | `../ONE/web/src/components/ai/ChatClientV2.tsx` | Every `@/` import — confirm they all exist in envelopes now |
| R2 | `../ONE/web/src/components/ai/{AgentMessage,TelegramMessage,ChatMessages,MessageList,MarkdownContent,Message,Reasoning,LoadingIndicator,PromptInput,Suggestions,CodeBlock,SimpleChatClient,FreeChatClient,Chatbot}.tsx` | Each file's imports |
| R3 | `../ONE/web/src/pages/api/{chat-director,chat-claude-code}.ts` | Imports — `@ai-sdk/openai`, `ai-sdk-provider-claude-code`, env vars |

**Outcome:** Confirm ChatClientV2's imports all resolve. Flag any that don't.

---

### Wave 2 — Decide (Opus)

**Key decisions:**
1. `ChatClientV2.tsx` posts to `/api/chat` by default — envelopes already has it (substrate endpoint). **Keep as-is, no adaptation.**
2. `api/chat-director.ts` from ONE/web is for direct OpenRouter. **Copy, keep separate** from substrate `api/chat.ts`.
3. `api/chat-claude-code.ts` uses `ai-sdk-provider-claude-code`. **Copy verbatim.**
4. `pages/chat.astro` currently renders `WorldView`. **Replace with ChatClientV2**, using `client:only="react"`, `hideHeader={true}`, `sidebarInitialCollapsed={true}`.
5. Existing `src/components/ai/ToolCall.tsx` — already exists. Skip, do not overwrite.

**Output:** copy specs for 14 components + 2 API files + 1 page update.

---

### Wave 3 — Edits (Sonnet x 4)

```bash
# E1 — 14 top-level ai components (skip ToolCall.tsx — already exists)
cp ../ONE/web/src/components/ai/ChatClientV2.tsx      src/components/ai/ChatClientV2.tsx
cp ../ONE/web/src/components/ai/AgentMessage.tsx       src/components/ai/AgentMessage.tsx
cp ../ONE/web/src/components/ai/TelegramMessage.tsx    src/components/ai/TelegramMessage.tsx
cp ../ONE/web/src/components/ai/ChatMessages.tsx       src/components/ai/ChatMessages.tsx
cp ../ONE/web/src/components/ai/MessageList.tsx        src/components/ai/MessageList.tsx
cp ../ONE/web/src/components/ai/MarkdownContent.tsx    src/components/ai/MarkdownContent.tsx
cp ../ONE/web/src/components/ai/Message.tsx            src/components/ai/Message.tsx
cp ../ONE/web/src/components/ai/Reasoning.tsx          src/components/ai/Reasoning.tsx
cp ../ONE/web/src/components/ai/LoadingIndicator.tsx   src/components/ai/LoadingIndicator.tsx
cp ../ONE/web/src/components/ai/PromptInput.tsx        src/components/ai/PromptInput.tsx
cp ../ONE/web/src/components/ai/Suggestions.tsx        src/components/ai/Suggestions.tsx
cp ../ONE/web/src/components/ai/CodeBlock.tsx          src/components/ai/CodeBlock.tsx
cp ../ONE/web/src/components/ai/SimpleChatClient.tsx   src/components/ai/SimpleChatClient.tsx
cp ../ONE/web/src/components/ai/FreeChatClient.tsx     src/components/ai/FreeChatClient.tsx
cp ../ONE/web/src/components/ai/Chatbot.tsx            src/components/ai/Chatbot.tsx

# E2 — API endpoints
cp ../ONE/web/src/pages/api/chat-director.ts     src/pages/api/chat-director.ts
cp ../ONE/web/src/pages/api/chat-claude-code.ts  src/pages/api/chat-claude-code.ts
```

- E3 — Update `src/pages/chat.astro`: replace `WorldView` mount with `ChatClientV2 client:only="react"`
- E4 — Fix any `@/providers/*` or ONE/web-specific import paths in ChatClientV2 (stub or remove)

---

### Wave 4 — Verify (Sonnet x 1)

```bash
bun run verify
# Then manually:
npm run dev
# Open localhost:4321/chat — must load ChatClientV2, stream a response
```

Check:
1. `ChatClientV2` has no unresolved `@/` imports
2. `pages/chat.astro` uses `client:only="react"` — no SSR crash
3. `api/chat-director.ts` has `export const prerender = false`
4. Free tier message sends to `/api/chat` → substrate picks model → response streams
5. Model selector renders (no crash, even if Claude Code models need auth)

**Rubric:** fit=0.9 (full chat UI visible), form=0.85 (types clean), truth=0.95 (streams work), taste=0.8

**Self-checkoff:** If W4 passes:
1. Check all checkboxes below
2. `mark('chat:wire', 5)` — path strengthens
3. Substrate pheromone on `chat` tag accumulates from first real requests

### Cycle 3 Gate

```bash
bun run verify
curl -s -X POST http://localhost:4321/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}' | head -5
```

- [ ] `bun run verify` green (biome + tsc + vitest)
- [ ] `localhost:4321/chat` loads without error
- [ ] First message streams a response from substrate
- [ ] Model selector visible in chat UI
- [ ] No console errors on load

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. tasks |
|-------|------|--------|-------|-----------|
| 1 | W1 | 4 | Haiku | Read 4 sources |
| 1 | W3 | 8 | Sonnet | 8 copy/create tasks |
| 2 | W1 | 3 | Haiku | Read 3 batches |
| 2 | W3 | 3 | Sonnet | 3 copy batches |
| 3 | W1 | 3 | Haiku | Read 3 batches |
| 3 | W3 | 4 | Sonnet | 4 copy/update tasks |

**Hard stop:** if W4 loops more than 3× on type errors, halt — one file at a time.

---

## Status

- [x] **Cycle 1: WIRE** — Packages, UI atoms, lib, config
  - [x] W0 — Baseline: 409/409 tests, biome clean, tsc clean
  - [x] W1 — Recon (Haiku x 4): 4 sources read, 0 dissolved
  - [x] W2 — Decide (Opus): 8 decisions, security.ts + use-toast skip (already present)
  - [x] W3 — Copy/create: 5 packages installed, 6 UI components, claude-code-events.ts, config/backend.ts
  - [x] W4 — Verify: 409/409 tests · biome clean · tsc clean · rubric fit=0.9 form=0.85 truth=0.95 taste=0.8
- [x] **Cycle 2: PROVE** — AI elements, generative-ui, hooks
  - [x] W1 — Recon (Haiku x 2): elements + generative-ui sources read; hooks/ai skip (8 files already present)
  - [x] W2 — Decide (Opus): streamdown install, 3 missing UI + 3 elements + 12 generative-ui, hooks skip
  - [x] W3 — Copy: streamdown installed, 15 files copied, 1 tsc fix (DynamicProduct result narrowing)
  - [x] W4 — Verify: 409/409 tests · 0 warnings · tsc clean · rubric fit=0.9 form=0.85 truth=0.95 taste=0.8
- [ ] **Cycle 3: GROW** — Top-level components + pages + API
  - [ ] W1 — Recon (Haiku x 3)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Copy + wire (Sonnet x 4)
  - [ ] W4 — Verify + smoke test (Sonnet x 1)

---

## Execution

```bash
# Run next wave of current cycle
/do TODO-chat.md

# Check state
/see tasks
/see highways
```

---

## See Also

- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [TODO-template.md](TODO-template.md) — this file's template
- `../ONE/web/src/components/ai/CHAT_ARCHITECTURE.md` — ONE/web chat design doc
- `../ONE/web/CLAUDE-CODE-CHAT.md` — Claude Code provider setup
- `src/pages/api/chat.ts` — substrate endpoint (keep, don't replace)

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet copies, Sonnet checks.
52 files. Foundation → mid-tier → apex. Chat goes live at Cycle 3 W4.*
