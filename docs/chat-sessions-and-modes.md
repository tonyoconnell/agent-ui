# Chat Sessions and Access Modes

Source: `src/lib/chat/cursor.ts`, `src/lib/chat/stream.ts`, `src/pages/chat/index.astro`,
`src/components/chat/CmdKWidget.tsx`, `interfaces/chat/` (8 contract files).

---

## Session Primitive

Every chat conversation is identified by a **session ID** (`Sid`). The session tracks:

```typescript
interface ChatSession {
  sid: Sid
  uid?: Uid        // null for anonymous
  cursor: Cursor
  createdAt: string
  lastActiveAt: string
}
```

### Cursor

A cursor encodes the exact position in the stream: `<sid>:<epochMs>:<seqNum>`.

```typescript
interface Cursor {
  sid: string
  epochMs: number
  seq: number
}
```

Functions:
- `encodeCursor(c)` — serialize to wire string
- `decodeCursor(s)` — parse from wire string, returns `null` on malformed input
- `nextCursor(prev)` — advance after each chunk (bumps `seq`, resets `epochMs` to `Date.now()`)
- `isCursorStale(incoming, lastKnown)` — server-side guard: rejects if `seq` went backwards OR epoch gap exceeds 1 hour

**1-hour disconnect reattach.** A client that reconnects within one hour can resume with its stored cursor. The server replays missed events from that position. Connections older than one hour are rejected with `"cursor-stale"` — the client must create a new session.

**Browser persistence.** Cursors survive page refresh via IndexedDB (`one-chat` database, `cursors` store, keyed by `sid`). `storeCursor(sid, cursor)` and `loadCursor(sid)` are the read/write API. The `CmdKWidget` stores its session key in `localStorage` (`one-cmdk-sid`).

---

## Streaming

Two stream parsers live in `src/lib/chat/stream.ts`:

| Parser | Endpoint | Yields |
|---|---|---|
| `parseChatStream` | `/api/chat/stream` | `text`, `reasoning`, `tool_call`, `tool_result`, `ui` chunks |
| `parseDirectorStream` | `/api/chat-director` | `message`, `agent-presence`, `done`, `error` events |

Both parsers are `AsyncGenerator<StreamEvent>` — they swallow malformed JSON chunks rather than crashing the stream.

Stream chunk shape from `interfaces/chat/stream.d.ts`:

```typescript
interface StreamChunk {
  type: "text" | "rich" | "done" | "error"
  content?: string
  richType?: string      // e.g. "payment-card", "agent-card"
  richPayload?: unknown
  cursor?: Cursor        // updated cursor after each chunk
  error?: string
}
```

---

## Five Access Modes

### 1. Web (`/chat`)

Route: `src/pages/chat/index.astro` → `ChatIslandWithBoundary` (`client:load`).

- Anonymous or authenticated (Better Auth session).
- Full `ChatIsland`: model selector, reasoning traces, tool calls, rich message rendering.
- Session persisted in IndexedDB via `storeCursor` / `loadCursor`.
- Reconnects automatically within the 1-hour window.

```typescript
// interfaces/chat/web.d.ts
interface ChatIslandProps {
  initialSid?: Sid
  initialCursor?: Cursor
  embedded?: boolean  // true for ⌘K widget
}
```

### 2. Embedded ⌘K (`CmdKWidget`)

Mount `<CmdKWidget client:load />` anywhere in a layout. Activates on `Cmd+K` / `Ctrl+K`, closes on `Esc` or backdrop click.

- Session key stored in `localStorage` (`one-cmdk-sid`).
- POSTs `{ sid, message }` to `/api/chat/stream`.
- Minimal UI: modal overlay, message thread, inline stop button.
- Emits `ui:chat:cmdK` on open, `ui:chat:send` on each message.

```typescript
// interfaces/chat/embedded.d.ts
interface EmbeddedChatProps {
  trigger?: "cmd-k" | "button"
  position?: "center" | "bottom-right"
  placeholder?: string
}
```

### 3. API (`/api/chat/*`)

Direct HTTP. No JavaScript required.

```bash
curl -X POST https://one.ie/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{ "message": "hello", "sid": "optional-resume-sid" }'
```

Response is an SSE stream. The `sid` is returned in the first chunk so clients can resume later.

```typescript
// interfaces/chat/api.d.ts
interface ApiChatRequest  { message: string; sid?: Sid }
interface ApiChatResponse { sid: Sid; message: string; richMessages?: unknown[] }
```

### 4. SDK

`@oneie/sdk` — browser or server, same-origin via `window.location.origin`.

```typescript
import { sdk } from "@/lib/sdk"
const { sid, message } = await sdk.chat("What agents are available?", { stream: false })
```

```typescript
// interfaces/chat/sdk.d.ts
interface SdkChatOptions { sid?: Sid; stream?: boolean }
declare function chatSdk(message: string, opts?: SdkChatOptions): Promise<{ sid: Sid; message: string }>
```

### 5. MCP and CLI

**MCP** — tool contract for Claude Desktop and other MCP hosts:

```typescript
// interfaces/chat/mcp.d.ts
interface McpChatToolInput  { message: string; sessionId?: string }
interface McpChatToolOutput { content: string; sessionId: string }
```

**CLI** — `npx oneie chat` flag contract:

```typescript
// interfaces/chat/cli.d.ts
interface CliChatArgs {
  message: string
  session?: string  // resume session ID
  json?: boolean    // output JSON instead of plain text
}
```

Both modes map to the same `/api/chat/stream` endpoint. Session IDs are stable across mode switches — a conversation started via the web can be resumed via CLI with the same `sid`.
