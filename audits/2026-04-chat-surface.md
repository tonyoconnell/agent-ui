# Chat Surface Audit — 2026-04-23

Audited against task D.r0. Binding decision for D.r1 at §3.

---

## 1. Endpoint Inventory

### `POST /api/chat` — `src/pages/api/chat.ts`

Pheromone-driven, multi-provider text chat. Accepts `{messages, model?, tags?, system?, agentId?}`. Selects a model from `CHAT_MODELS` via the substrate (`chooseModel`) unless client pins one; routes to Groq, Cerebras, or OpenRouter by model prefix. If `agentId` and a client `system` are both present, enriches the system prompt with a TypeDB context pack (5 s cap). Calls ai-sdk `streamText`, returns `result.toTextStreamResponse()` — a plain text SSE stream (`text/plain; charset=utf-8`, chunked). Marks the tag→model edge in `onFinish`.

**Streams:** yes — ai-sdk `toTextStreamResponse()` (OpenAI-compatible text/plain chunked stream).
**Session handling:** none. No `sid` or `cursor` in the body or response.

---

### `POST /api/chat-chairman` — `src/pages/api/chat-chairman.ts`

Multi-hop substrate chat for the `/chairman` surface. Accepts `{content, sessionId, tags?}`. Classifies the message, wires the chairman→ceo→director→specialist chain, streams tokens via a hand-rolled `ReadableStream` with named SSE events: `ready`, `breadcrumb`, `delta`, `done`, `error`. Auth: `chairman` role in prod; open in dev unless `X-Dev-Chairman: true` is absent. Persists turns to `/api/in/sessions` fire-and-forget. Closes the four-outcome loop (`result/timeout/dissolved/failure`) and emits `done.outcome`.

**Streams:** yes — raw SSE (`text/event-stream`) with typed events (`breadcrumb`, `delta`, `done`, `error`).
**Session handling:** accepts `sessionId` (opaque string) for in-session message logging; does NOT implement resumable cursors — `sessionId` is passed to `/api/in/sessions` for the inbox view but carries no replay semantics at this endpoint.

---

### `POST /api/chat-director` — `src/pages/api/chat-director.ts`

Multi-agent director chat using `ai-sdk-provider-claude-code`. Accepts `{messages}`. Director LLM analyses which of five hard-coded specialist agents (`agent-frontend`, `agent-backend`, `agent-builder`, `agent-quality`, `agent-designer`) should respond; each specialist is then streamed in sequence. Sends SSE events of shape `{type, sender, content, ...}` terminated with `{type: "done"}`.

**Streams:** yes — raw SSE (`text/event-stream`), event shape `data: {type, sender, content, ...}`.
**Session handling:** none. Stateless per request.

---

### `POST /api/chat-claude-code` — `src/pages/api/chat-claude-code.ts`

Claude Code provider chat with full tool access (Read, Write, Edit, Bash, Grep, Glob, WebFetch, LS). Accepts `{messages, model?, allowedTools?, disallowedTools?}`. Streams via ai-sdk `fullStream`, re-encoding each part as OpenRouter-compatible SSE chunks (`choices[0].delta.content`, `type: "tool_call"`, `type: "tool_result"`, `data: [DONE]`). 30 s connection timeout, 10 min stream timeout.

**Streams:** yes — raw SSE (`text/event-stream`), OpenRouter-compatible delta format + tool events.
**Session handling:** none. Stateless per request.

---

### `POST /api/chat/turn` — `src/pages/api/chat/turn.ts`

Memory-aware single-turn chat. Accepts `{messages, model?, apiKey?, actorUid?, lastTags?}`. Runs a six-step turn loop: `ingestMessage` (classify + ensure actor) → `measureOutcome` (mark/warn previous turn) → `buildPack` (TypeDB context pack) → `systemPromptWithPack` → `streamText` → return tags in `X-Turn-Tags` header for the caller to pass as `lastTags` on the next call. OpenRouter only.

**Streams:** yes — ai-sdk `toTextStreamResponse()` (same text/plain chunked format as `/api/chat`).
**Session handling:** partial. `lastTags` threading gives turn-to-turn outcome measurement. There is no `sid` or `cursor`; full message history must be re-sent on every call by the client. Not resumable.

---

### `POST /api/chat/summarize` — `src/pages/api/chat/summarize.ts`

Fire-and-forget session-end summariser. Accepts `{agentId, messages}`. Extracts structured insights (summary, topics, unresolved, userIntent) via a cheap LLM call (`generateText`, not streaming) and persists multiple hypotheses to TypeDB. Called by clients via `navigator.sendBeacon` on session end.

**Streams:** no — synchronous JSON response `{ok, summary, topics, unresolved, userIntent}`.
**Session handling:** none. Stateless summarisation over a provided message slice.

---

## 2. Session Handling

No existing endpoint implements `(sid, cursor)` resumable sessions. The closest approximations:

**`/api/chat-chairman`** accepts `sessionId` and mirrors messages to the inbox bus:

```typescript
// src/pages/api/chat-chairman.ts:233–238
fetch(new URL('/api/in/sessions', request.url).toString(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, sender: 'chairman', content }),
}).catch(() => {})
```

And again on result (lines 377–381):
```typescript
fetch(new URL('/api/in/sessions', request.url).toString(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, sender: specialistUid ?? 'specialist', content: resultContent }),
}).catch(() => {})
```

This is append-only logging to the inbox bus, not resumable streaming. There is no `cursor` concept, no token-offset replay, and no way for a client to reconnect mid-stream and pick up where it left off.

**`/api/chat/turn`** threads `lastTags` across turns for pheromone measurement but requires the client to re-send the full `messages` array every call. Not resumable.

---

## 3. BINDING DECISION for D.r1

**Decision: NEW**

D.r1 must create `src/pages/api/chat/stream.ts` as a net-new endpoint alongside the existing routes. Existing routes are left entirely untouched.

Rationale: `/api/chat` is called directly by at least seven distinct sites (see §4) with no session parameters in the request contract; extending it in-place would require adding `sid`/`cursor` logic while maintaining backward compatibility for all callers, and the endpoint's `toTextStreamResponse()` return path is the ai-sdk default — altering the streaming envelope would break every consumer that parses that format. `/api/chat-chairman` is closer in shape (named SSE events, a `sessionId` field) but is role-gated, chairman-chain-specific, and already doing too much to absorb a generic resumable session layer cleanly. `/api/chat/turn` has the right memory-aware architecture but uses `toTextStreamResponse()` with `X-Turn-Tags` as the session-state carrier — grafting `(sid, cursor)` onto that contract would break `useCompleteChatFlow` and `useClientChat` which already consume it. A new `src/pages/api/chat/stream.ts` can introduce the `(sid, cursor)` contract with named SSE events (matching the chairman format), own session persistence via `/api/in/sessions`, and call through to the same `ingestMessage` / `buildPack` / `systemPromptWithPack` helpers that `/api/chat/turn` already uses — without touching any existing route.

---

## 4. Files D.r1 Must NOT Break

### Endpoints called by production code — do not modify

| Endpoint | Callers |
|---|---|
| `POST /api/chat` | `src/hooks/ai/basic/useClientChat.ts:33` · `src/hooks/ai/premium/useCompleteChatFlow.ts:8` · `src/hooks/ai/useChat.ts:272` · `src/components/ai/AdChat.tsx:58` · `src/components/ai/ChatAuth.tsx:445,595` · `src/components/agents/AgentDetail.tsx:569` · `src/components/ai/AdBuyChat.tsx:401` · `src/components/ai/FastChat.tsx:42` · `src/lib/ai/chat-engine.ts:76` |
| `POST /api/chat-chairman` | `src/components/ai/ChairmanChat.tsx:40` (via `DEFAULT_ENDPOINT`) |
| `POST /api/chat-director` | `src/hooks/ai/useChat.ts:194` |
| `POST /api/chat-claude-code` | `src/hooks/ai/useChat.ts:272` (conditional on `isClaudeCode`) |
| `POST /api/chat/turn` | `src/hooks/ai/basic/useClientChat.ts` (via ai-sdk `useChat` hook pointing at `/api/chat`), `src/hooks/ai/premium/useCompleteChatFlow.ts` |
| `POST /api/chat/summarize` | `src/components/agents/AgentDetail.tsx:535,537` |

### Engine and library files that must remain unmodified

- `src/engine/chat.ts` — `ingestMessage`, `measureOutcome` (used by `/api/chat/turn`, will be reused by D.r1)
- `src/lib/chat/context-pack.ts` — `buildPack`, `systemPromptWithPack` (used by `/api/chat` and `/api/chat/turn`)
- `src/engine/chairman-chain.ts` — `wireChairmanChain`, `PRODUCTION_MARKETING_TEAM` (chairman-specific, must not drift)
- `src/engine/specialist-leaf.ts` — `leafHandler` (chairman-chain leaf streaming)
- `src/lib/tag-classifier.ts` — `classifyWithConfidence` (used by chairman endpoint)
- `src/lib/net.ts` — `getNet` singleton (shared across all chat endpoints)
- `src/lib/llm-router.ts` — `chooseModel`, `markOutcome`, `seedModels` (used by `/api/chat`)
