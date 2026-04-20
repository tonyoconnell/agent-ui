# Broadcast

Debby types a message in the admin panel → it goes to every active student across all channels.

## How It Works

```
/chat-debby-admin (ClawAdmin)
        │
        ▼
POST /broadcast { text, sender }
        │
        ├── Query D1: all group_ids with messages in last 7 days
        │
        ├── For each group:
        │     ├── INSERT INTO messages (role=assistant, sender=admin)
        │     └── send(env, group, text)
        │           ├── tg-*   → Telegram sendMessage API
        │           ├── dc-*   → Discord channel message API
        │           └── web-*  → stored in D1 (client polls)
        │
        └── Return { sent, failed, total }
```

## Student Side (/chat-debby)

DebbyChat polls `GET /messages/:group` every 4 seconds. New assistant messages
(by ID + content dedup) appear in the chat as regular bubbles.

```
poll() → fetch /messages/:group
       → filter: role=assistant AND ts > lastServerTs
       → dedup by ID + content match
       → append to local React state
```

## API

### `POST /broadcast`

Send a message to all active conversations.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | string | required | Message content |
| `sender` | string | `"admin"` | Sender label stored in D1 |

**Response:**
```json
{ "ok": true, "sent": 12, "failed": 0, "total": 12 }
```

**Scope:** Conversations with messages in the last 7 days. Stale groups are excluded.

**Auth:** Protected by `API_KEY` middleware (same as all non-webhook routes).

### `GET /conversations`

Lists active conversations for the admin sidebar. Already existed before broadcast.

### `POST /conversations/:group/reply`

Reply to a single conversation. Unchanged — used for 1:1 admin replies.

## Admin UI (ClawAdmin)

Green broadcast bar pinned to top of the main panel, always visible.

- Shows count of active conversations
- Textarea + "Broadcast" button
- After send: shows "Sent to X/Y channels" confirmation
- Enter sends (Shift+Enter for newline)

## Known Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| No confirm dialog | Accidental broadcast | Add confirmation step before POST |
| Web students need tab open | Missed if tab closed | Future: web push notifications |
| No broadcast history | Can't review past broadcasts | Query D1 by sender=admin pattern |
| No visual distinction | Student can't tell broadcast from AI | Tag with `[From Debby]` prefix or styled differently |
| No audience filter | All-or-nothing | Add tag/stage filter to broadcast endpoint |

## Files

| File | What |
|------|------|
| `nanoclaw/src/workers/router.ts` | `POST /broadcast` endpoint |
| `nanoclaw/src/channels/index.ts` | `send()` dispatcher (Telegram/Discord/web) |
| `src/components/ai/ClawAdmin.tsx` | Broadcast bar UI + `sendBroadcast()` |
| `src/components/ai/DebbyChat.tsx` | 4s poll for new server messages |
| `src/pages/chat-debby-admin.astro` | Admin page (renders ClawAdmin) |
| `src/pages/chat-debby.astro` | Student page (renders DebbyChat) |

## Channel Dispatch

The `send()` function in `channels/index.ts` routes by group prefix:

| Prefix | Channel | Push method |
|--------|---------|-------------|
| `tg-` | Telegram | `sendMessage` API (instant) |
| `tg-donal-` | Telegram (Donal bot) | `sendMessage` with DONAL token |
| `tg-one-` | Telegram (@onedotbot) | `sendMessage` with ONE token |
| `dc-` | Discord | Channel message API (instant) |
| `web-*` | Web chat | Stored in D1, client polls every 4s |
