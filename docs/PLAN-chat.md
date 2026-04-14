# PLAN-chat.md — Import ONE/web Chat to Envelopes

**Source:** `../ONE/web/src/`
**Target:** `src/` (envelopes)
**Goal:** Bring the full ChatClientV2 stack into envelopes — generative UI, model selector, tool visualization, markdown, reasoning display — wired to envelopes' substrate-backed `api/chat.ts`.

**Source of truth:** `docs/DSL.md`, `docs/dictionary.md`, `src/schema/one.tql`
**Routing:** signal → substrate → LLM → mark/warn on outcome

---

## Signal Flow

```
browser ChatClientV2
  → POST /api/chat          (substrate picks model via pheromone routing)
  → POST /api/chat-director (OpenRouter direct, for non-substrate models)
  ← streaming SSE response
  → TelegramMessage / AgentMessage / GenerativeUIRenderer
  → mark(edge) on success | warn(edge) on error
```

---

## Schema Reference

Dimension 5 (Events / signal): every chat message is a signal.
Dimension 3 (Things / skill): `chat` skill, tag `chat`.
Dimension 2 (Actors / unit): LLM unit selected by substrate.

---

## Wave Structure

### W0 — Baseline

```bash
npm run verify   # biome + tsc + vitest — must be green before starting
```

---

### W1 — Recon (what exists, what's missing)

| # | Check | Status |
|---|-------|--------|
| 1.1 | `src/components/ai/elements/` already has 28/31 files | ✅ partial |
| 1.2 | `src/components/ai/chat/` has 5 basic components | ✅ partial |
| 1.3 | `src/components/ai/` missing top-level assembled components | ❌ |
| 1.4 | `src/components/generative-ui/` does not exist | ❌ |
| 1.5 | `src/hooks/ai/` does not exist | ❌ |
| 1.6 | `src/config/` does not exist | ❌ |
| 1.7 | `src/lib/claude-code-events.ts` does not exist | ❌ |
| 1.8 | `src/lib/security.ts` does not exist | ❌ |
| 1.9 | `src/components/ui/` missing: alert, hover-card, label, select, toast, toaster | ❌ |
| 1.10 | packages missing: `marked`, `shiki`, `use-stick-to-bottom`, `ai-sdk-provider-claude-code` | ❌ |

---

### W2 — Decide (import order, adapter decisions)

**Decision 1 — Keep envelopes `api/chat.ts` as primary.**
The existing substrate-routed endpoint uses pheromone to pick models. Keep it.
Add `api/chat-director.ts` from ONE/web for direct OpenRouter fallback.

**Decision 2 — Create `src/config/backend.ts` as a thin shim.**
ONE/web's `backendConfig` drives free/premium branching in ChatClientV2.
Envelopes has no Convex — set `enabled: false`, `tier: "free"` as default.
The `PUBLIC_BACKEND` env var can override to unlock premium paths later.

**Decision 3 — Import `"use client"` components verbatim.**
The `"use client"` directive is a Next.js/framework hint; Astro ignores it.
Copy as-is — no stripping needed.

**Decision 4 — Wire `ChatClientV2` to envelopes `api/chat.ts`.**
ChatClientV2 posts to `/api/chat` by default. That already exists and works.
The `apiKey` field maps to `OPENROUTER_API_KEY` in the substrate endpoint.

---

### W3 — Edit (copy in order, dependencies first)

#### Task 3.1 — Install missing packages

```bash
bun add marked shiki use-stick-to-bottom ai-sdk-provider-claude-code @ai-sdk/openai
```

**Packages:**
- `marked` — markdown → HTML parsing in MarkdownContent
- `shiki` — syntax highlighting in elements/code-block
- `use-stick-to-bottom` — scroll-to-bottom in ChatMessages
- `ai-sdk-provider-claude-code` — Claude Code CLI as AI provider
- `@ai-sdk/openai` — standard OpenAI adapter (used by api/chat-director)

**tags:** `[install, P0]` | **blocks:** all W3 tasks

---

#### Task 3.2 — Add missing UI components

```bash
cp ../ONE/web/src/components/ui/alert.tsx     src/components/ui/alert.tsx
cp ../ONE/web/src/components/ui/hover-card.tsx src/components/ui/hover-card.tsx
cp ../ONE/web/src/components/ui/label.tsx     src/components/ui/label.tsx
cp ../ONE/web/src/components/ui/select.tsx    src/components/ui/select.tsx
cp ../ONE/web/src/components/ui/toast.tsx     src/components/ui/toast.tsx
cp ../ONE/web/src/components/ui/toaster.tsx   src/components/ui/toaster.tsx
```

| File | Needed by |
|------|-----------|
| `alert.tsx` | ChatClientV2 |
| `hover-card.tsx` | ChatClientV2 |
| `label.tsx` | ChatClientV2 |
| `select.tsx` | ChatClientV2 |
| `toast.tsx` | use-toast hook |
| `toaster.tsx` | ChatClientV2 |

**tags:** `[ui, P0]` | **blocks:** 3.4

---

#### Task 3.3 — Add missing AI elements

```bash
cp ../ONE/web/src/components/ai/elements/conversation.tsx src/components/ai/elements/conversation.tsx
cp ../ONE/web/src/components/ai/elements/message.tsx      src/components/ai/elements/message.tsx
cp ../ONE/web/src/components/ai/elements/reasoning.tsx    src/components/ai/elements/reasoning.tsx
```

(All other elements already exist in envelopes.)

**tags:** `[ai-elements, P0]` | **blocks:** 3.4

---

#### Task 3.4 — Add lib dependencies

```bash
cp ../ONE/web/src/lib/claude-code-events.ts src/lib/claude-code-events.ts
cp ../ONE/web/src/lib/security.ts           src/lib/security.ts
```

**tags:** `[lib, P0]` | **blocks:** 3.5

---

#### Task 3.5 — Create config/backend.ts

Create `src/config/backend.ts` — thin shim, no Convex dependency:

```typescript
// Mirrors ONE/web/src/config/backend.ts
// Envelopes defaults: free tier, no Convex, substrate as backend
export interface BackendConfig { ... }
const isBackendEnabled = import.meta.env.PUBLIC_BACKEND === 'on'
export const backendConfig: BackendConfig = {
  enabled: isBackendEnabled,
  tier: isBackendEnabled ? 'starter' : 'free',
  endpoints: { api: import.meta.env.PUBLIC_BACKEND_URL || '/api' },
  features: { persistence: false, humanInTheLoop: false, analytics: false, rag: false, multiTenant: false }
}
```

**tags:** `[config, P0]` | **blocks:** 3.6

---

#### Task 3.6 — Add hooks/ai

```bash
cp ../ONE/web/src/hooks/use-toast.ts src/hooks/use-toast.ts
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

**tags:** `[hooks, P1]` | **blocks:** 3.7

---

#### Task 3.7 — Add generative-ui components

```bash
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
```

**tags:** `[generative-ui, P1]` | **blocks:** 3.8

---

#### Task 3.8 — Add top-level ai components

```bash
# Do NOT copy ToolCall.tsx — already exists in envelopes
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
```

**tags:** `[ai-components, P0]` | **blocks:** 3.9

---

#### Task 3.9 — Add API endpoint: chat-director

```bash
cp ../ONE/web/src/pages/api/chat-director.ts      src/pages/api/chat-director.ts
cp ../ONE/web/src/pages/api/chat-claude-code.ts   src/pages/api/chat-claude-code.ts
```

Direct OpenRouter endpoint (no substrate routing). ChatClientV2 routes Claude Code
models to `/api/chat-claude-code` and non-substrate models via the director.
The substrate `api/chat.ts` remains untouched.

**tags:** `[api, P1]` | **blocks:** 3.10

---

#### Task 3.10 — Update pages/chat.astro

Update existing `src/pages/chat.astro` to mount `ChatClientV2`:

```astro
---
export const prerender = false
import { ChatClientV2 } from "@/components/ai/ChatClientV2"
import Layout from "@/layouts/Layout.astro"
---
<Layout title="AI Chat" sidebarInitialCollapsed={true} hideHeader={true} fullHeight={true}>
  <ChatClientV2 client:only="react" />
</Layout>
```

Also add thread page: `src/pages/chat/[threadId].astro` (copied verbatim, non-functional until backend enabled).

**tags:** `[pages, P0]` | **blocks:** W4

---

### W4 — Verify

```bash
npm run verify   # biome + tsc + vitest — no regressions
```

Manual check:
- `localhost:4321/chat` loads ChatClientV2
- Model selector shows available models  
- Free tier chat works (no API key, substrate picks model)
- Markdown renders in responses
- Code blocks syntax-highlight
- Tool call cards render
- Reasoning section expands/collapses

**Exit criteria:** `npm run verify` green, `/chat` loads and streams a response.

---

## File Count

| Layer | Files to copy | Already exists |
|-------|--------------|---------------|
| `components/ai/` (top-level) | 15 | 1 (ToolCall.tsx) |
| `components/ai/elements/` | 3 | 28 |
| `components/generative-ui/` | 12 | 0 |
| `components/ui/` | 6 | 14 |
| `hooks/ai/` | 9 | 0 |
| `hooks/` | 1 | 0 |
| `lib/` | 2 | 0 |
| `config/` | 1 (new) | 0 |
| `pages/api/` | 2 | 1 (chat.ts kept) |
| `pages/` | 1 update + 1 new | 1 |
| **Total** | **52** | — |

---

## New Packages

| Package | Version | Why |
|---------|---------|-----|
| `marked` | ^16 | Markdown parsing in MarkdownContent |
| `shiki` | ^3 | Syntax highlighting in code-block |
| `use-stick-to-bottom` | ^1 | Scroll-lock in ChatMessages |
| `ai-sdk-provider-claude-code` | ^2 | Claude Code CLI as AI provider |
| `@ai-sdk/openai` | ^2 | Standard OpenAI adapter for chat-director |

---

## See Also

- `docs/DSL.md` — signal/emit/mark/warn primitives
- `docs/dictionary.md` — canonical dimension names
- `docs/TODO-template.md` — task metadata format
- `src/schema/one.tql` — ontology (chat = signal dimension 5)
- `../ONE/web/src/components/ai/CHAT_ARCHITECTURE.md` — ONE/web chat design
- `../ONE/web/CLAUDE-CODE-CHAT.md` — Claude Code provider setup guide
