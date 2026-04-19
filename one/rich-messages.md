# Rich Messages

**Goal:** Send embeds, threads, reactions, and rich formatting through Signal to Discord, Web, and Telegram while keeping Signal type frozen.

---

## Design Principle

Signal stays frozen: `{ receiver, data?: unknown }`. Rich message **metadata** goes inside `data` as a wrapper that channel adapters unwrap at send time.

```typescript
// Signal (frozen, universal)
interface Signal {
  receiver: string
  data?: unknown
}

// RichMessage (optional payload inside data)
interface RichMessage {
  type: 'text' | 'embed' | 'thread' | 'reaction'
  content: string
  embed?: EmbedMetadata
  payment?: PaymentMetadata
  reactions?: string[]
  thread?: ThreadMetadata
}

interface PaymentMetadata {
  receiver: string        // Recipient wallet address (derive via addressFor(uid))
  amount: number          // In SUI or cents
  action: string          // 'unlock_report', 'donate', 'purchase', etc.
  currency?: 'SUI' | 'USD'
  transactionDigest?: string  // Sui tx digest (recorded after payment)
}

// Usage
const signal: Signal = {
  receiver: 'discord:channel-123',
  data: {
    rich: {
      type: 'embed',
      content: 'Summary of results',
      embed: { title: '...', fields: [...] }
    } as RichMessage
  }
}
```

---

## Rich Message Types

### **1. Text (Plain)**
```typescript
{
  type: 'text',
  content: 'Simple message'
}
```
**Supported on:** Telegram, Discord, Web

---

### **2. Embed (Structured Data)**
```typescript
{
  type: 'embed',
  content: 'Fallback plain text',
  embed: {
    title: 'Results Summary',
    description: 'Overview of findings',
    fields: [
      { name: 'Metric', value: '123' },
      { name: 'Status', value: 'Complete' }
    ],
    color: 0x0099ff,  // Discord color code
    thumbnail?: { url: '...' },
    image?: { url: '...' }
  }
}
```
**Supported on:** Discord (native), Web (custom render), Telegram (formatted text fallback)

---

### **3. Thread (Conversation Context)**
```typescript
{
  type: 'thread',
  content: 'Reply in thread',
  thread: {
    parentId: 'msg-123',     // Parent message ID
    depth: 1,                 // Thread nesting depth
    title?: 'Discussion',     // Optional thread title
    archived?: false
  }
}
```
**Supported on:** Discord (native), Web (custom), Telegram (group → topic)

---

### **4. Reactions (Interactive Signals)**
```typescript
{
  type: 'reaction',
  content: 'React to this',
  reactions: ['👍 Approve', '❌ Reject', '💬 Review']  // Labels or emoji
}
```
**Supported on:** Discord (add reactions), Web (render buttons), Telegram (inline keyboard fallback)

**Handoff Pattern:** When human clicks a reaction button, it triggers a `durableAsk()` in the backend:
- Button click captured → POST `/api/ask/reply` with `{ askId, choice }`
- Backend resolves ask in D1
- Result routed back to agent via `replyTo` auto-reply

---

### **5. Payment (Revenue + Lifecycle)**
```typescript
{
  type: 'embed',
  content: 'Full report available',
  embed: { title: 'Report', fields: [...] },
  payment: {
    receiver: 'agent-xyz-wallet-address',
    amount: 0.01,
    action: 'unlock_report',
    currency: 'SUI'
  }
}
```

**Supported on:** Discord (embed + link button), Web (payment button component), Telegram (text link)

**Payment Flow:**
1. Agent emits rich message with payment metadata
2. Channel adapter renders payment UI (button, link, QR code)
3. User clicks → Sui wallet transaction (or stripe gateway)
4. Transaction digest stored in `transactionDigest` field
5. D1 records payment in `messages` table: `payment_receiver`, `payment_amount`, `payment_action`, `transaction_digest`
6. Path marked with payment amount: `mark(edge, strength + amount)` (revenue IS weight)
7. Pheromone learns: payment path = high-value path

**Phase status:** Payment metadata wired (Cycle 3). Sui integration pending (Phase 5: x402 wallet + link generation)

---

## Channel Adapters

### **Discord** (Full Support)
```typescript
if (signal.data?.rich?.embed) {
  // Send as Discord embed
  await sendDiscordEmbed(channel, signal.data.rich.embed)
}
if (signal.data?.rich?.thread) {
  // Create/reply in thread
  await createDiscordThread(channel, signal.data.rich.thread)
}
if (signal.data?.rich?.reactions) {
  // Add emoji reactions to message
  await addDiscordReactions(messageId, signal.data.rich.reactions)
}
```

### **Web** (Custom Render)
```typescript
// In ChatMessage.tsx
if (message.rich?.embed) {
  return <RichEmbed embed={message.rich.embed} />
}
if (message.rich?.thread) {
  return <ThreadView thread={message.rich.thread} messages={...} />
}
```

### **Telegram** (Graceful Fallback)
```typescript
if (signal.data?.rich?.embed) {
  // Format as bold text + key-value pairs
  const text = `*${embed.title}*\n${embed.description}\n` +
    embed.fields.map(f => `${f.name}: ${f.value}`).join('\n')
  await sendTelegramText(chat, text)
}
```

---

## Storage

### **D1 (nanoclaw)**
```sql
-- Extend messages table
ALTER TABLE messages ADD COLUMN rich_type TEXT;  -- 'text' | 'embed' | 'thread' | 'reaction'
ALTER TABLE messages ADD COLUMN rich_data JSON;  -- Embed/thread/reaction metadata
```

### **KV (rich message cache)**
```typescript
const cacheKey = `rich:${signal.receiver}:${messageId}`
const cached = await env.KV.get(cacheKey)  // 5-min TTL for re-renders
```

### **TypeDB (signal history)**
```tql
insert $sig isa signal,
  has uid "sig-123",
  has receiver-id "discord:channel-123",
  has type "embed",
  has rich-data "{...embed metadata...}";
```

---

## Lifecycle

1. **LLM generates response** (router.ts)
   - Rich message wrapper created inside `data`
   - Signal emitted with `{ receiver, data: { rich: {...} } }`

2. **Signal routed** (loop.ts)
   - Persisted to D1 + TypeDB
   - Enqueued for channel dispatch

3. **Channel adapter receives** (channels/index.ts)
   - Checks `signal.data?.rich?.type`
   - Unwraps embed/thread/reaction metadata
   - Renders per-channel format (Discord native, Web custom, Telegram text)

4. **Message sent** (send function)
   - Discord: POST with `{ embeds: [...] }` or thread ID
   - Web: D1 + React render
   - Telegram: formatted text or keyboard markup

5. **User sees** 
   - Discord: rich embed with fields, colors, images
   - Web: custom component with threading/reactions
   - Telegram: plain text (fallback), or inline keyboard buttons

---

## Example: Multi-Format Response

```typescript
// Router decides response is complex, needs rich formatting
const response = await respond(pack, messages)

const richMessage: RichMessage = {
  type: 'embed',
  content: response,  // Fallback for Telegram
  embed: {
    title: 'Analysis Results',
    description: response.substring(0, 100) + '...',
    fields: [
      { name: 'Confidence', value: '0.87' },
      { name: 'Sources', value: '5 URLs fetched' }
    ],
    color: 0x0099ff
  },
  thread: {
    parentId: lastMessageId,
    depth: 1
  },
  reactions: ['👍', '📌', '❓']
}

const signal: Signal = {
  receiver: `${channel}:${groupId}`,
  data: { rich: richMessage }
}

// Each adapter handles its format
await send(env, signal)
```

---

## Testing Checklist

- [ ] Discord embeds render with colors, fields, thumbnails
- [ ] Web embeds render with custom CSS
- [ ] Telegram embeds fall back to formatted text
- [ ] Threads nest correctly (depth tracking)
- [ ] Reactions add to messages (Discord) / render as buttons (Web)
- [ ] D1 stores rich metadata
- [ ] KV cache prevents re-renders
- [ ] Signal type stays frozen (no breaking changes)

---

## See Also

- [lifecycle.md](one/lifecycle.md) — Agent/human handoffs via rich messages
- [TODO-rich-messages.md](TODO-rich-messages.md) — Implementation roadmap
- [claw.md](claw.md) — Rich messaging in Claw context

---

*Rich messaging bridges the gap between structured data and human-friendly presentation.*
