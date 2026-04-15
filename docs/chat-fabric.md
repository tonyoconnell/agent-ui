# Chat-Fabric — one memory, every platform

**The claim:** ONE is the *central message fabric* for the world. A message
on Discord, WhatsApp, Telegram, iMessage, Slack, email — is a `signal`.
A conversation across platforms is a `group`. Users chat wherever they
are; the substrate remembers everywhere.

**Source of truth:** `docs/memory.md`, `docs/chat-memory.md`,
`docs/chat-universal.md`, `src/schema/one.tql`. This doc is the *routing
consequence* of those specs — what it means to syndicate, mirror, and
de-duplicate across platforms.

---

## 1. The claim in one picture

```
┌──────────────────────────────────────────────────────────────────┐
│                       ONE SUBSTRATE                              │
│                                                                  │
│   signal ─┬──────────────┬──────────────┬──────────────┐         │
│           │              │              │              │         │
│        recalls         paths         hypotheses       fade       │
│           │              │              │              │         │
│           └──────────────┴──────────────┴──────────────┘         │
│                                                                  │
└──────────┬────────────┬────────────┬────────────┬────────────────┘
           │            │            │            │
      ┌────┴───┐  ┌─────┴───┐  ┌─────┴──┐  ┌──────┴─┐
      │Discord │  │WhatsApp │  │Telegram│  │  Web   │  ... iMessage,
      │adapter │  │adapter  │  │adapter │  │adapter │      Slack,
      └────┬───┘  └─────┬───┘  └─────┬──┘  └──────┬─┘      Email
           │            │            │            │
      Discord       WhatsApp     Telegram       Web
      servers      numbers       chats         widgets
```

One substrate. N channel adapters. **A conversation is not on a
platform — it lives in the substrate and surfaces on the platforms
its members use.**

---

## 2. The mapping (everything is already a primitive)

| Fabric concept | ONE primitive | Schema |
|---|---|---|
| Message on any platform | `signal` | dim 5 |
| Conversation across platforms | `group` with multi-channel bindings | dim 1 |
| User, wherever they are | `actor` with N `channel` attributes | dim 2 |
| "Discord #general ↔ WhatsApp Team ↔ Tg Founders" link | 3 `binding`s on one `group` | dim 1 |
| Mirror rule (`#alerts` → email) | `fan-out` path on the group, weighted | dim 4 |
| Platform itself | a `thing` (adapter kind) | dim 3 |
| Delivery status | `mark()` on success, `warn()` on failure | dim 4 |
| Dedupe / idempotency | signal `origin-id` + content hash | dim 5 |
| Who-said-what-where | signal `sender` + `channel` attributes | dim 5 |

No new entities. The existing ontology already encodes "this conversation
has three platform surfaces."

---

## 3. The group as a fabric node

The critical move: promote `group` to carry **multi-channel bindings**.
One group, many surfaces.

```typeql
# New relation: a group is bound to a channel address
binding sub relation,
  relates group, relates channel,
  owns channel-kind,        # discord | whatsapp | telegram | slack | email | web
  owns channel-addr,        # "#general" | "+353851234567" | "-1001234567" | "#eng"
  owns direction,           # in | out | both
  owns mirror-policy;       # full | filtered | summary | none

group plays binding:group;
```

Example — one group, three platform surfaces:

```typeql
insert
  $g isa group, has group-id "founders";

  (group: $g, channel: $c1) isa binding,
    has channel-kind "discord", has channel-addr "#founders-chat",
    has direction "both", has mirror-policy "full";

  (group: $g, channel: $c2) isa binding,
    has channel-kind "whatsapp", has channel-addr "+353851111111@g.us",
    has direction "both", has mirror-policy "full";

  (group: $g, channel: $c3) isa binding,
    has channel-kind "telegram", has channel-addr "-1001234567",
    has direction "both", has mirror-policy "full";
```

**Consequence:** `persist.open({fromGroup:"founders"})` returns paths
earned from every platform combined. Memory is per-group, not per-platform.

---

## 4. The inbound flow — normalize to signal

Every adapter does one thing: *translate a platform event into a signal
and hand it to the substrate.*

```
  discord webhook         whatsapp webhook        telegram webhook
        │                       │                       │
        ▼                       ▼                       ▼
   ┌────────────────────────────────────────────────────────────┐
   │  channel adapter        normalize(event) → Signal           │
   │  - strip platform quirks   - resolve actor via Sui          │
   │  - attach origin-id         - infer group from binding      │
   │  - hash content (dedupe)    - set scope from channel type   │
   └────────────────────────────┬───────────────────────────────┘
                                ▼
                       POST /api/signal
                                │
                                ▼
   ┌────────────────────────────────────────────────────────────┐
   │  chat:ingest unit    (dedupe gate, then forward)            │
   │  if seen(origin-id) → dissolve                              │
   │  else signal → chat:respond + chat:fanout                   │
   └────────────────────────────────────────────────────────────┘
```

### The signal shape

```typescript
{
  receiver: 'group:founders',     // the substrate group, not the platform
  sender:   'person:donal',        // resolved via channel → uid lookup
  data: {
    origin: {
      channel:   'discord',        // where it came from
      addr:      '#founders-chat', // platform-native address
      id:        '1234567890',     // platform message id (for dedupe)
      ts:        1731234567890,
    },
    content: 'new pricing looks off',
    tags:    ['pricing', 'feedback'],
    scope:   'group',              // per §147 of chat-memory.md
    content_hash: 'sha256:ab12…',   // for cross-platform dedupe
    replyTo: 'signal:9f3…',         // if threading
    media:   [{ kind:'image', url:'...', cas:'sha256:…' }]
  }
}
```

**`origin.channel` is the anti-ping-pong field.** When we fan out, the
outbound signal inherits it — adapters skip any binding whose `channel-kind
+ addr` matches the origin.

---

## 5. The outbound flow — syndicate via fan-out

```
   signal lands on group:founders
              │
              ▼
   ┌────────────────────────────────────────────────────────────┐
   │  chat:fanout unit                                           │
   │                                                             │
   │  bindings = query(group:founders, isa binding)              │
   │  for each b in bindings:                                    │
   │    if b.channel-kind + b.addr == signal.origin → SKIP       │
   │    if b.direction is 'in' only                 → SKIP       │
   │    if signal.scope is 'private'                → SKIP       │
   │    if b.mirror-policy == 'none'                → SKIP       │
   │                                                             │
   │    emit({ receiver: `${b.channel-kind}:send`,               │
   │           data: { addr: b.addr, signal } })                 │
   └────────────────────────────┬───────────────────────────────┘
                                ▼
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
     discord:send        whatsapp:send         telegram:send
           │                    │                    │
     (posts in              (posts in            (posts in
      #founders-chat)        group chat)         -1001234567)
```

Each `{platform}:send` is a **unit** — an adapter that speaks the platform
and returns success/failure. `mark()` on delivery, `warn()` on rate-limit
or refusal. The substrate learns which channels are reliable, which throttle,
which drop messages, and routes accordingly.

---

## 6. Identity — one actor across Discord, WhatsApp, Telegram, web

From `chat-memory.md` §102: the Sui claim ceremony. Every actor has a
deterministic Sui keypair from `SUI_SEED + uid`. Cross-channel identity
is a signature, not a federation service.

```typeql
actor plays channel-identity:actor;

channel-identity sub relation,
  relates actor, relates channel,
  owns channel-kind,
  owns raw-id,              # platform-native user id
  owns claimed-at,
  owns claim-signature;     # Sui sig proving the binding
```

### The unified resolution table

| Platform | Raw id we see | How we map to uid |
|---|---|---|
| Discord | `discord:283746...` | `channel-identity` lookup |
| WhatsApp | `+353851234567` | `channel-identity` lookup |
| Telegram | `tg:98765432` | `channel-identity` lookup |
| Slack | `U09A4B2X` + team | `channel-identity` lookup |
| Web (anon) | session uuid | ephemeral uid; `/claim` promotes |
| Email | `tony@one.ie` | `channel-identity` lookup |

**First time** we see a raw id → create `person:<nanoid>` with one
`channel-identity` attached.

**`/claim` on another platform** → Sui signature verifies → merge: the
second platform's `channel-identity` attaches to the first actor. All
memory (paths, hypotheses, highways) is inherited instantly.

### The "claim everywhere" flow

```
day 1: donal chats on Telegram for 6 months → person:donal, 47 paths,
       12 hypotheses, 3 highways
day 2: donal joins founders Discord → auto-creates person:donal-2
       because we've never seen that Discord id
day 3: donal types /claim in Discord → bot DMs him on Telegram:
       "is this you? press confirm" → Telegram bot signs nonce →
       discord identity merges into person:donal → person:donal-2 deleted
       → all 47 paths + 12 hypotheses inherited
```

**From donal's point of view**: Monday the Discord bot was a stranger.
Tuesday it knew his writing style, project history, and preferences.
One Telegram tap.

---

## 7. Idempotency — no message ping-pongs

Three defenses, in order:

### Defense 1 — origin channel skip (already in §5)

A signal whose `origin.channel == binding.channel-kind` is never fanned
out to that binding. The Discord message that triggered the signal
never loops back to Discord.

### Defense 2 — content hash dedupe

Every inbound signal computes `sha256(content + sender + group + minute_bucket)`.
`chat:ingest` maintains a 5-minute LRU of seen hashes. If a WhatsApp
webhook arrives with content we just syndicated *to* WhatsApp, the hash
matches → dissolve.

```typescript
unit('chat:ingest')
  .on('inbound', async (sig, emit) => {
    const hash = sig.data.content_hash
    if (seenHashes.has(hash)) return              // dissolve
    seenHashes.add(hash, { ttl: 5*60*1000 })
    emit({ receiver: 'chat:fanout', data: sig })
  })
```

### Defense 3 — origin-id dedupe

Even if content hashes collide legitimately (two users sent "yes" seconds
apart), `origin.id` — the platform-native message id — is unique per
platform. We dedupe `(channel, id)` tuples in D1 for the last 24 hours.
Re-delivered webhooks never double-process.

```
- inbound identity defense:   sender + channel-identity lookup
- inbound dedupe:              (origin.channel, origin.id) unique in 24h
- content dedupe:              sha256 hash LRU, 5min
- outbound loopback:           origin.channel != binding.channel
- outbound failure:            retry w/ backoff, warn() on terminal fail
```

Four gates. The ping-pong is structurally impossible.

---

## 8. Mirror policies — not everything fans out equally

Sometimes a group should *partially* mirror — not every Discord message
belongs in the WhatsApp group. The `mirror-policy` attribute on
`binding` handles this with four modes:

```
full       — every signal, no filter (default for symmetric team rooms)
filtered   — only signals with certain tags (e.g. only #announcements → email)
summary    — chat:fanout runs an LLM summarizer every N turns, posts digest
none       — inbound only, this binding never receives fan-out
```

```typeql
(group: $g, channel: $c) isa binding,
  has channel-kind "email", has channel-addr "team@one.ie",
  has direction "out",
  has mirror-policy "summary",         # daily digest
  has summary-cron "0 9 * * *";
```

The filter function for `filtered` is a **skill** — `filter:founders-to-whatsapp`.
It evolves via L5 if it starts dropping important messages (success-rate
< 0.50 over 20 samples).

---

## 9. Threading across platforms

Every platform has its own reply model: Discord has thread messages,
Telegram has `reply_to_message_id`, WhatsApp has quoted messages, Slack
has thread_ts. Normalize at ingest, denormalize at send.

```typescript
// ingest
signal.replyTo = adapter.resolveReply(event)   // → parent signal uid

// fanout
for (const b of bindings) {
  const parentSig = signal.replyTo
  const platformParent = parentSig
    ? lookupPlatformId(parentSig, b.channel-kind)   // reverse map
    : undefined
  emit({
    receiver: `${b.channel-kind}:send`,
    data: { addr: b.addr, reply_to: platformParent, signal }
  })
}
```

The forward + reverse map lives in `signal.origin_ids` — an array of
`{channel, addr, id}` tuples recording every platform where *this signal*
was surfaced. A reply on any platform can resolve to the same signal,
and fan-out can thread correctly on every destination.

**Net effect**: reply on Telegram, reply appears threaded on Discord and
quoted on WhatsApp. One conversation, native affordances per platform.

---

## 10. Scope — private stays private

`signal.scope` (from `memory.md` §395) is enforced at fan-out:

```
private  — never fanned out. DM stays on the platform it arrived on.
group    — fanned out to every binding on the group (the default)
public   — fanned out + may be consumed by public aggregators
```

A user's DM to `@donalbot` on Telegram never appears in the Discord
channel bound to the founders group, because:

1. DMs arrive on `group: conv:donal:donalbot`, not `group: founders`.
2. Their scope is `private`.
3. Even if misrouted, `chat:fanout` refuses `private` signals.

Privacy is not a feature flag — it is one attribute enforced at one
location.

---

## 11. Media, attachments, big content

Platforms disagree wildly about file limits (Discord 10MB free,
WhatsApp 16MB, Slack 1GB). Our strategy: **content-addressed storage +
per-platform rewrite.**

```typescript
// ingest
const cas = await uploadToR2(attachment.bytes)        // content-addressed hash
signal.data.media.push({ kind: 'image', cas, size, mime })

// fanout
for (const b of bindings) {
  const rendered = await renderMedia(signal.media, b.channel-kind)
  // - small images: inline attach
  // - large video: post link (via /m/<cas>)
  // - voice: transcode if platform doesn't support format
  emit({ receiver: `${b.channel-kind}:send`, data: { addr, rendered, signal } })
}
```

R2 (Cloudflare) gives us a cheap blob store keyed by content hash. Each
channel adapter chooses *inline vs link* based on its limits. The substrate
never stores bytes in TypeDB — only the CAS hash.

---

## 12. Backfill — history lights up on connect

When we add a new binding to a group that already has memory:

```
new WhatsApp binding added to group:founders
    │
    │ - past signals stay on their origin channel
    │ - WhatsApp members see: "Conversation continued from Discord
    │   and Telegram. Last 48h of activity:" + brief summary
    │ - chat:summary unit generates the digest from signals
    │
    └─> from this moment forward, full fan-out
```

No attempt to backfill into the new platform (illegal on most; fragile
on all). Instead: a one-shot digest at binding time. The *memory*
(hypotheses, paths) is already universal, so the bot's behavior in the
new binding is already personalized from turn one.

---

## 13. What this unlocks for users — the small wonderful moments

1. **"Continue on Telegram"** — I'm chatting on the web widget, my laptop
   dies, I open Telegram — the conversation resumes. Because it was
   never *on* the web widget; it was in the substrate.

2. **"I sent you something on WhatsApp"** — Works even if the bot lives
   on Discord. Signal → group → fan-out. One message, delivered
   everywhere the user has bound.

3. **Group chat with a member who doesn't use your platform** — Donal
   lives on Telegram, Tony on Discord, Mary on WhatsApp. The `founders`
   group binds all three. Each writes on their platform; each reads on
   their platform. None of them ever sees "please install X."

4. **Unified search** — `/find "pricing"` on any platform searches every
   signal in every group you're a member of, returns platform-linked
   results. The substrate is the index.

5. **"Summarize what I missed"** — a signal to `self:digest` pulls the
   last N signals in every group you're in, across platforms. One
   command. One digest.

6. **Cross-platform handoff mid-conversation** — agent starts on web
   widget → says "this is complex, let me pull in Donal" → Donal gets
   a Telegram message with full context. Same group. Same memory.
   Different chrome.

7. **The `/chat` page as universal inbox** — one timeline showing every
   message from every platform, filterable by group, channel, actor.
   Like a phone's messages app, but for Discord + WhatsApp + Telegram +
   Slack + email + web, from one pane. And the bot's memory is the
   side-panel.

---

## 14. Why other systems can't do this (honestly)

| Product | What they are | Why this is hard for them |
|---|---|---|
| Beeper / Matrix bridges | Protocol bridges, E2EE-aware | No typed memory; federation-heavy; identity fragmentation per bridge |
| Rocket.Chat / Mattermost | Platform with federation | Bring-your-own-platform — doesn't syndicate *into* existing Discord/WhatsApp |
| Zapier / Make | Workflow automation | No conversational memory; no identity model; no outcome learning |
| Mem0 / Zep chat | Memory layer for one bot | No platform transport; assume you ship the chat UI |
| Discord bots | Per-platform | Don't cross to WhatsApp; no shared memory; no identity |
| Twilio / MessageBird | Omnichannel messaging | No memory; no substrate; you build the smarts |

ONE is the *first* architecture where **memory + routing + identity +
platform transport are the same system**. Not integrations between four
products — one substrate doing all four because the primitives already
cover them.

---

## 15. The adapter contract (how to add a platform)

Every platform is ~200 lines:

```typescript
// nanoclaw/src/channels/<platform>.ts
export const adapter: ChannelAdapter = {
  kind: 'whatsapp',

  // 1. INBOUND — webhook handler
  async normalize(request: Request): Promise<Signal> {
    const event = await request.json()
    const actor = await resolveActor('whatsapp', event.from)
    const group = await resolveGroup('whatsapp', event.chat)
    return {
      receiver: group,
      sender: actor,
      data: {
        origin: { channel: 'whatsapp', addr: event.chat, id: event.id, ts: event.ts },
        content: event.text,
        content_hash: sha256(event.text),
        scope: event.chat.startsWith('+') ? 'private' : 'group',
        media: event.media?.map(toCAS) ?? [],
        replyTo: event.quoted ? resolveReplyToSignal(event.quoted) : undefined,
      }
    }
  },

  // 2. OUTBOUND — send handler
  async send(addr: string, payload: Outbound): Promise<Delivery> {
    const res = await fetch(WA_API, {
      method: 'POST',
      body: JSON.stringify({
        to: addr,
        text: payload.signal.data.content,
        reply_to: payload.reply_to,
        media: payload.rendered,
      }),
    })
    return res.ok
      ? { status: 'delivered', platformId: (await res.json()).id }
      : { status: 'failed', retryable: res.status === 429 }
  },

  // 3. SCOPE INFERENCE
  inferScope(raw: any) { /* DM → private, group → group, channel → public */ },
}
```

Register once in `nanoclaw/src/channels/index.ts` — auto-discovered by
the router, the fanout unit, and the substrate.

---

## 16. Substrate-native benefits you get for free

Because fan-out is just signals, every existing substrate capability
applies:

- **Pheromone on deliveries.** `mark()` a binding when its fan-out
  produces engagement (user replies on that channel). Over time the
  substrate learns which bindings this user *actually reads*. Cold
  bindings get `warn()`'d and eventually mirrored as summaries instead
  of full fan-out.

- **Agent evolution on adapters.** `whatsapp:send` is a unit. If it
  starts failing (rate-limited, banned numbers), L5 can rewrite its
  retry policy. If a cheaper adapter emerges, pheromone routes more
  traffic through it.

- **Economic layer.** Each adapter has a `capability` with a price
  (SMS/WhatsApp cost real money). The substrate picks the cheapest
  reliable binding per message (e.g., prefer WhatsApp free over SMS paid
  when both are available).

- **Frontier detection on platforms.** `persist.frontier('whatsapp')`
  returns tag clusters users talk about on WhatsApp but the substrate
  hasn't classified yet — what's emerging from that channel.

- **GDPR.** `persist.forget(uid)` cascades through every
  `channel-identity`, every signal sender, every path. Delete on one
  platform? Deleted everywhere by construction.

---

## 17. The architecture summary

```
┌───────────────────────────────────────────────────────────────┐
│   ONE SUBSTRATE                                               │
│                                                               │
│   actors (with N channel-identities)                          │
│   groups (with N bindings)                                    │
│   signals (episodic, with origin + scope + content_hash)      │
│   paths (learn which bindings actually work)                  │
│   hypotheses (memory, promoted hourly)                        │
│                                                               │
│   units:                                                      │
│     chat:ingest        dedupe + route to group                │
│     chat:fanout        expand signal across group bindings    │
│     chat:respond       LLM turn (the one probabilistic step)  │
│     chat:outcome       valence → mark/warn                    │
│     {platform}:send    per-platform delivery adapter          │
│     filter:<rule>      per-group filter skill                 │
│     summary:<cadence>  digest generator                       │
│                                                               │
│   loops:                                                      │
│     L1 per message     signal → fanout → delivery             │
│     L2 per outcome     mark/warn on binding paths             │
│     L3 fade            stale bindings weaken                  │
│     L4 economic        cheapest reliable binding wins traffic │
│     L5 adapter evolve  retry policies, rate-limit strategies  │
│     L6 know            "user always replies on WhatsApp" …    │
│     L7 frontier        emerging topics per platform           │
└───────────────────────────────────────────────────────────────┘
```

No new subsystems. Everything slots into the existing 670-line engine.

---

## 18. Build order (waves)

Assumes `chat-ui-upgrade.md` (refactored ChatShell) and
`chat-universal.md` W5–W7 (ChatShell mounts everywhere + third-party
embed) have landed.

```
wave W9   — schema + fan-out core
  task  extend world.tql with binding, channel-identity, origin attrs
  task  chat:ingest unit (dedupe + route to group)
  task  chat:fanout unit (multi-binding emission)
  task  D1 table for (origin.channel, origin.id) dedupe
  task  content-hash LRU in globalThis

wave W10  — platform adapters (existing + new)
  task  formalize nanoclaw/src/channels contract
  task  discord adapter       (already exists — refactor)
  task  telegram adapter      (already exists — refactor)
  task  web adapter           (already exists — refactor)
  task  whatsapp adapter      (new: Business Cloud API)
  task  slack adapter         (new)
  task  email adapter         (new: Postmark/SES + IMAP)
  task  imessage adapter      (optional: via relay server; tricky)

wave W11  — identity fabric
  task  channel-identity relation + queries
  task  /claim command in ChatShell (reuse from chat-universal.md W5)
  task  /claim command in every bot persona (nanoclaw personas.ts)
  task  merge ceremony — actor consolidation + path transfer

wave W12  — mirror policies
  task  mirror-policy: full, filtered, summary, none
  task  filter:* skills per group (evolvable)
  task  summary:* scheduled digests
  task  per-binding rate-limit strategy

wave W13  — UX on top
  task  universal inbox (the /chat page as cross-platform timeline)
  task  cross-platform search (/find over signals)
  task  /missed command — digest of what the user missed per group
  task  binding management UI (add/remove platform links to a group)

cycle exit   — rubric ≥ 0.65 per platform adapter;
              ping-pong test passes (0 loops);
              claim round-trip < 10s;
              digest quality rubric ≥ 0.80;
              substrate learns binding reliability within 100 messages.
```

Every wave produces marks on the paths that carried value. No calendar
time.

---

## 19. The elegance claim — countable

Same yardstick as `memory.md` and `chat-universal.md`:

```
                                        Typical "omnichannel"    ONE
─────────────────────────────────────────────────────────────────────────
Per-platform message stores                 N (one per platform)     1 (substrate)
Identity mapping service                    federation service       Sui signature
Per-platform user database                  N                        0 (channel-identity relation)
Dedupe / loop-prevention                    ad-hoc per bridge        (origin, hash) — 1 rule
Cross-platform memory                       impossible / separate    native (per-group)
Adding a new platform                       new backend service      ~200 LOC adapter
Mirror policies                              custom code per bridge   1 attribute on binding
Cross-platform search                        N search services        1 TQL query
Scope / privacy enforcement                 per-platform ACLs        1 signal attribute
GDPR erasure                                N compliance pipelines   1 TQL cascade
```

Every row collapses N moving parts into one because the substrate was
*already* a routing + memory + identity system. We're just pointing the
adapters at it.

---

## 20. The deeper claim

The chat-fabric claim is the natural extension of `chat-memory.md`:

- `chat-memory.md`: "**memory is a substrate side-effect.**"
- `chat-universal.md`: "**UI surface is a substrate view.**"
- `chat-fabric.md`: "**transport is a substrate loop.**"

Three extensions, zero new subsystems each. Memory, UI, and transport
are *the same system* — not three integrated services.

The 670-line engine doesn't know what a "chat platform" is. It knows
about actors, signals, groups, paths, and loops. *Platforms are just
things that send signals and receive signals.* From the substrate's
point of view, Discord and `chat:respond` are the same kind of unit —
both receive a signal and either produce a result (mark) or not (warn).

```
They build an omnichannel messaging platform.
ONE is a world where messages happen — surfaces are incidental.
```

---

## See Also

- [memory.md](memory.md) — the 6-dimensional memory model (scope,
  source, bi-temporal)
- [chat-memory.md](chat-memory.md) — the per-chatbot memory story;
  Sui claim ceremony
- [chat-universal.md](chat-universal.md) — `<ChatShell>` as universal
  UI; target-agnostic routing
- [chat-ui-upgrade.md](chat-ui-upgrade.md) — the refactor that makes
  the UI wireable
- [one-ontology.md](one-ontology.md) — 6 dimensions (this doc extends
  groups and events)
- `src/schema/one.tql` — add `binding`, `channel-identity`,
  `origin-id` attributes here
- `src/engine/persist.ts` — `actor()`, `group()`, `signal()` (extend
  with multi-channel)
- `src/engine/human.ts` — a person as a substrate unit
- `nanoclaw/src/channels/` — the adapter contract lives here; refactor
  per §15
- `nanoclaw/src/workers/router.ts` — the edge ingest path today
- `gateway/` — origin allowlist, rate limiting, broadcast DO

---

*One memory. Every platform. Messages are signals; platforms are
adapters; the conversation is the substrate.*
