# Agent ↔ Owner ↔ Student: Telegram Interaction Model

How humans and agents share a conversation without stepping on each other.

---

## The Three Actors

```
STUDENT (human)          AGENT (AI)              OWNER (human)
  talks to agent           responds to student      watches, can interrupt
  sees one "person"        steps aside when told     takes over when needed
  never knows who's        resumes when owner        gets notified of activity
  typing                   is done
```

The student always sees one voice. Whether Amara or Debby is typing, the
student experiences a single conversation partner. The handoff is invisible.

---

## Conversation Modes

### 1. **AUTO** (default)

Agent handles everything. Owner gets notifications per alert level.

```
Student → Agent → reply                    Owner sees notification
Student → Agent → reply                    Owner sees notification
Student → Agent → reply                    ...
```

### 2. **PAUSED** (owner takes over)

Owner sends `/pause` or clicks Pause in admin. Agent stops responding.
Owner types directly to the student. Agent watches (stores messages for context).

```
Student → message stored, NO agent reply   Owner types reply → student
Student → message stored, NO agent reply   Owner types reply → student
```

The agent's system prompt gets the full conversation including owner messages.
When the owner is done, they send `/resume`. Agent picks up where the
conversation left off, with full context of what the owner said.

### 3. **ASSIST** (agent drafts, owner approves)

Owner sends `/assist`. Agent generates a reply but does NOT send it.
Instead, the draft is sent to the owner for review. Owner can:
- **Approve** → reply goes to student as-is
- **Edit** → owner modifies, then send
- **Reject** → owner writes their own reply

```
Student → Agent drafts reply → sent to Owner (not student)
  Owner approves / edits / rejects → reply → Student
```

Useful for: sensitive conversations, sales, support escalation, new agents
still being trained.

---

## Signal Flow

```
                    ┌─────────────┐
                    │   Student   │
                    └──────┬──────┘
                           │ message
                           ▼
                    ┌─────────────┐
                    │  NanoClaw   │◄──── /pause, /resume, /assist (owner)
                    │   Router    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         mode=auto    mode=paused   mode=assist
              │            │            │
         Agent reply   Store only   Agent drafts
              │            │            │
              ▼            │            ▼
         send(student)     │       send(owner)
              │            │            │
              ▼            ▼            ▼
         notifyOwner   Owner replies  Owner approves
                       send(student)  send(student)
```

---

## Implementation

### D1 Schema Addition

```sql
-- Add mode column to groups table
ALTER TABLE groups ADD COLUMN mode TEXT DEFAULT 'auto';
-- mode: 'auto' | 'paused' | 'assist'

-- Owner messages stored with role='owner' so agent can distinguish
-- from its own 'assistant' messages in context
```

### API Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `POST /owner` | POST | API key | Register owner for notifications |
| `GET /owner` | GET | API key | Get owner config |
| `POST /conversations/:group/pause` | POST | API key | Pause AI, owner takes over |
| `POST /conversations/:group/resume` | POST | API key | Resume AI |
| `POST /conversations/:group/assist` | POST | API key | Switch to assist mode |
| `POST /conversations/:group/reply` | POST | API key | Owner sends message to student (exists) |
| `GET /conversations` | GET | API key | List active conversations (exists) |

### Router Logic Change

```typescript
// In webhook handler, before LLM call:
const group = await loadGroupWithMode(env, signal.group)

if (group.mode === 'paused') {
  // Store message but don't respond — owner is driving
  // Notify owner: "Student said: ..."
  await notifyOwner(env, { ...opts, paused: true })
  return
}

if (group.mode === 'assist') {
  // Generate reply but send to owner, not student
  const draft = await generateReply(env, signal, context)
  await notifyOwner(env, { ...opts, draft })
  return
}

// mode === 'auto' → normal flow
```

### Owner Commands (via Telegram)

If the owner messages the bot directly (from their registered owner group):

| Command | Effect |
|---------|--------|
| `/pause <group>` | Pause AI for that student conversation |
| `/resume <group>` | Resume AI |
| `/assist <group>` | Switch to assist mode |
| `/status` | List all active conversations + their mode |
| (plain text) | Reply to most recent paused conversation |

For convenience, when there's only one paused conversation, plain text from
the owner goes to that student without needing to specify a group.

---

## Notification Alert Levels

Configured per-owner via `POST /owner`:

| Level | What triggers a notification |
|-------|------------------------------|
| `off` | Nothing |
| `first` | First message from a new student only |
| `low-confidence` | First message + any low-confidence AI response |
| `all` | Every incoming student message (short digest) |

### Notification Format

```
💬 Message

From: maria_v
> Can you help me practice for my job interview tomorrow?

Reply:
Of course! Let's do a mock interview. What position are you...

---
/pause tg-12345 to take over
```

For paused conversations:

```
⏸️ Paused conversation

From: maria_v
> Thank you so much for the tips!

---
Reply here or /resume tg-12345
```

---

## Human + Agent Context Sharing

When the owner takes over, the agent doesn't disappear — it watches.

1. **Owner messages** are stored with `role: 'owner'` in D1
2. When AI resumes, its context includes the owner's messages
3. The system prompt gets an extra line:

```
[The conversation was handled by the school owner for the last 3 messages.
They discussed: job interview preparation. Continue from where they left off.
Do not repeat what the owner already covered.]
```

This prevents the agent from re-asking questions the owner already answered.

---

## Multi-Owner Support

For teams (Elevare has Debby + future tutors):

```sql
CREATE TABLE IF NOT EXISTS claw_owners (
  claw_id TEXT,
  owner_uid TEXT,
  owner_channel TEXT NOT NULL,
  owner_group_id TEXT NOT NULL,
  alert_level TEXT DEFAULT 'all',
  role TEXT DEFAULT 'owner',          -- owner, tutor, admin
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (claw_id, owner_uid)
);
```

- **Owner** sees everything, can pause/resume/assist
- **Tutor** sees only their assigned students, can assist
- **Admin** sees aggregate stats, no individual messages

---

## Seamless Handoff Rules

1. **Never reveal the handoff.** The student sees one conversation partner.
   Owner messages appear as the same bot/persona.

2. **Context is continuous.** Whether the agent or owner is typing, the
   conversation history is shared. No "let me transfer you" moment.

3. **Owner always wins.** If the owner and agent both try to respond,
   the owner's message takes priority. The agent's draft is discarded.

4. **Warm resume.** When switching from paused → auto, the agent reads
   the owner's messages and picks up the thread naturally.

5. **No double-notification.** If the owner is actively typing in a
   paused conversation, suppress notifications for that group.

6. **Timeout.** If a conversation is paused for >30 minutes with no
   owner activity, auto-resume with a gentle agent message:
   "Sorry for the wait — let's continue!"

---

## Use Cases

### Debby's Day

```
08:00  Notifications arrive: 3 students messaged overnight
       → Agent handled all 3. Debby reviews the summaries.

09:15  New student: nervous, first message ever
       → Debby sees 🆕 notification. Decides to take over.
       → /pause tg-789
       → Types a personal welcome. Student feels special.
       → /resume tg-789. Agent continues.

11:00  Student asks about pricing (complex, sensitive)
       → Agent response has ⚠️ low confidence
       → /assist tg-456. Agent drafts, Debby reviews.
       → Edits the pricing details. Sends.
       → /resume tg-456.

14:00  Regular practice sessions
       → Agent handles everything. Debby checks summaries at EOD.
```

### Sales Conversation

```
Prospect → Concierge (auto)
  "What programs do you have?"
  → Agent explains Lingua, Rise, Flex Nexus

Prospect → "What's the pricing?"
  → Agent explains tiers
  → Owner gets notification (pricing = high-value)

Owner → /assist tg-prospect-123
  → Agent drafts: "Lingua Live is $149/mo..."
  → Owner edits: adds personal discount offer
  → Sends

Owner → /resume tg-prospect-123
  → Agent continues enrollment flow
```

---

## Telegram-Specific Notes

- Owner registers their Telegram chat ID via `POST /owner` or by messaging
  the bot with `/register`
- Bot uses the same token for student and owner messages — differentiated by
  chat ID (owner's personal chat vs student group)
- Owner can reply to notification messages directly in Telegram — the bot
  routes the reply to the correct student conversation
- Inline keyboards on notifications: `[Pause] [Assist] [View Full]`

---

*One voice. Two minds. The student never knows.*
