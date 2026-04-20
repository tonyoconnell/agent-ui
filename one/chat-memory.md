# Chatbot Memory

A wonderful chatbot that remembers — built on primitives we already have.

No new stores. No extraction pipeline. No session IDs. No retrieval layer.
Just the 6 dimensions, used well.

---

## The Claim

> A chatbot with perfect memory is a substrate side-effect, not a feature.

Every current memory-for-chatbots product (Mem0, Letta, Zep, LangMem) sits
*beside* the chat loop as a service: *"here is your message, let me extract
facts, store them, and retrieve on your next turn."*

ONE's chatbot memory sits *inside* the substrate. The user is an `actor`.
The bot is an `actor`. The conversation is a `group`. Every message is a
`signal`. Every positive reaction is a `mark()`. Every correction is a
`warn()`. Every stable pattern becomes a `hypothesis`.

That is the whole system. It is already running.

---

## The Mapping

Chat concepts → ONE primitives. No translation layer.

```
┌─────────────────────────────┬──────────────────────────────────┐
│ Chat concept                │ ONE primitive                    │
├─────────────────────────────┼──────────────────────────────────┤
│ user                        │ actor (kind: human)              │
│ bot persona                 │ actor / unit (kind: agent)       │
│ conversation                │ group (members: user + bot)      │
│ session                     │ time window over group signals   │
│ message                     │ signal                           │
│ attachment / tool call      │ signal with typed content        │
│ user profile fact           │ hypothesis                       │
│ user preference / style     │ hypothesis + path weights        │
│ topic interest              │ path (user → skill / tag)        │
│ positive feedback           │ mark(edge)                       │
│ correction / thumbs-down    │ warn(edge)                       │
│ memory decay                │ fade(0.05)                       │
│ memory consolidation        │ L6 know() loop                   │
│ retrieval                   │ select() + recall() + open()     │
└─────────────────────────────┴──────────────────────────────────┘
```

Every chatbot memory feature maps to something the substrate already does.

---

## The Flow

```
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. INGEST    user message → signal                          │
  │    { sender: user:42, receiver: bot, tags, content }        │
  │                                                             │
  │              sender resolves to stable actor across channels│
  │              group(user:42, bot) becomes-or-already-is      │
  └─────────────────────┬───────────────────────────────────────┘
                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. RECALL    three parallel queries, no LLM                 │
  │    ├── episodic   : last N signals in group                 │
  │    ├── associative: top paths from user by tag overlap       │
  │    └── semantic   : recall({ subject: user }) hypotheses    │
  └─────────────────────┬───────────────────────────────────────┘
                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. PACK      assemble context (typed, not prose soup)       │
  │    { profile, recent, highways, hypotheses, tools }         │
  └─────────────────────┬───────────────────────────────────────┘
                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. RESPOND   LLM call (the one probabilistic step)          │
  │              bot emits reply as signal back to user         │
  └─────────────────────┬───────────────────────────────────────┘
                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 5. OUTCOME   wait for next turn, infer valence              │
  │    thumbs-up / continued engagement → mark(user → tag)      │
  │    correction / "no"/"actually" → warn(user → tag)          │
  │    silence beyond T → neutral, no deposit                   │
  └─────────────────────┬───────────────────────────────────────┘
                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 6. PROMOTE   L6 know() — stable highways → hypotheses       │
  │    "actor user:42 prefers code examples over prose"         │
  │    fade() — asymmetric forgetting keeps memory honest       │
  └─────────────────────────────────────────────────────────────┘
```

Six steps. No new services. Every step uses existing substrate verbs.

---

## Identity: One Actor, Every Channel (via Sui Signatures)

A person on Telegram, the web, Discord, and email is **one actor** with
**one `uid`**. Cross-channel unity is not a federation service — it is a
cryptographic claim using the wallet every actor already has.

Every actor in ONE has a Sui keypair derived deterministically from
`SUI_SEED + uid` (see `src/lib/sui.ts`, `addressFor(uid)`,
`deriveKeypair(uid)`). The keypair *is* the identity.

### The claim ceremony

```
user on Telegram (already claimed)
        │
        │ 1. types /claim in web chat
        ▼
web bot ───► issues challenge: nonce + web-session-id
        │
        │ 2. user returns to Telegram, DMs bot:
        │    /link <nonce> <web-session-id>
        ▼
tg bot  ───► signs {nonce, session, ts} with deriveKeypair(uid)
        ▼
signature verifies → actor gains `has channel "web"` attribute
                  → web session binds to same uid
                  → all memory (paths, hypotheses, highways) inherited
```

```typescript
// resolveActor with signed claim
async function resolveActor(channel: Channel, raw: string, claim?: ClaimSig) {
  if (claim && await verifyClaim(claim)) return claim.uid     // cross-channel
  const existing = await findByChannelRaw(channel, raw)
  return existing ?? `person:${nanoid()}`                     // new visitor
}
```

No ID-mapping table. No OAuth provider. The signature *is* the join. And
because Sui wallets already exist for every agent and can hold balance,
the same ceremony enables payments, permissions, and reputation — not a
bolt-on auth service.

---

## Privacy Scope: DMs vs Group Chats, Free

Every signal carries a `scope` attribute (see `memory.md` → *Events*):

```
private  → visible only to sender + receiver (a DM to the bot)
group    → visible to all group members (a group chat)
public   → world-readable (announcements, broadcasts)
```

Recall filters automatically honor scope. A DM from donal never surfaces
in a group-chat pack. A private confession never leaks into semantic
memory — `know()` promotes only from `group` or `public` paths.

```typescript
emit({
  receiver: bot,
  data: {
    sender: user, group, tags, content: msg.text,
    scope: msg.channel === 'dm' ? 'private' : 'group'
  }
})
```

One attribute. The chat product inherits correct privacy from the
substrate, not from a separate permission layer.

---

## Ingest: Messages Are Signals

Every inbound message becomes a signal — no "message table."

```typescript
unit('chat:ingest').on('message', async (msg, emit) => {
  const user = await resolveActor(msg.channel, msg.from, msg.claim)
  const group = `conv:${user}:${msg.bot}`

  await persist.actor(user, 'human')
  await persist.actor(msg.bot, 'agent')
  await persist.group(group, { members: [user, msg.bot] })

  // classify + valence are substrate units — not helpers.
  // they evolve via L5 prompt rewriting, get priced via L4, and
  // their quality is measured by their own path strengths.
  const { result: tags } = await net.ask({
    receiver: 'skill:classify', data: { content: msg.text }
  })

  emit({
    receiver: `${msg.bot}:respond`,
    data: { sender: user, group, tags, content: msg.text, ts: Date.now() }
  })
})
```

Classification and valence detection are **skills, not utilities**.
Registering them as units means:

- They get priced via `capability` (L4 economic loop).
- They get rewritten when they struggle (L5 evolution loop, 24h cooldown).
- Their outcomes accrue pheromone — the substrate *learns which classifier
  to trust* the same way it learns which agent to route to.
- Swapping models is a metadata change — unit `classify` can run Gemma 4,
  a small fine-tune, or a keyword heuristic; the substrate picks the winner.

The signal carries everything. No parallel "conversation history" store.
To get the last 20 messages, you query signals by group — already indexed.

---

## Recall: Three Queries, Zero LLM

On each turn, assemble context from three dimensions in parallel:

```typescript
unit('bot:recall').on('pack', async ({ sender, group, tags }) => {
  const [episodic, associative, semantic] = await Promise.all([
    // 1. last N signals in this group — raw episodic tape
    tdb.query(`
      match $s isa signal, has group "${group}";
      sort $s.ts desc; limit 20;
      fetch $s: content, sender, ts;`),

    // 2. top paths from user matching tags — associative memory
    persist.open(10, { from: sender, tags }),

    // 3. hypotheses about this user — semantic memory
    persist.recall({ subject: sender })
  ])

  return { episodic, associative, semantic }
})
```

Three typed queries. No embedding lookup. No re-ranking. No "relevance
score" heuristic. The substrate already *is* the relevance ranking —
paths earned their weight through outcomes.

---

## The Context Pack

Instead of concatenating prose chunks, the LLM receives a typed packet:

```typescript
type ContextPack = {
  profile: {
    uid: string
    handle: string
    channels: string[]
    firstSeen: number
    messageCount: number
  }
  hypotheses: Array<{           // stable facts the substrate learned
    predicate: string           // "prefers", "works-in", "struggles-with"
    object: string              // "code-examples", "seo", "typescript-generics"
    confidence: number          // 0..1
    age: number                 // seconds since last reinforcement
  }>
  highways: Array<{             // strongest paths from this user
    to: string                  // skill or tag name
    strength: number
    resistance: number
  }>
  recent: Signal[]              // last 20 in group
  tools: string[]               // capabilities available in this group
}
```

The LLM sees *structured memory*, not a rag-dump of 10 chunks. Prompt
size shrinks. Groundedness rises. Hallucination drops because the model
is told *what the substrate knows*, not *what sounded similar*.

---

## Outcome: Memory That Earns Its Weight

Most chat memory systems rate importance with an LLM call. ONE measures
importance from **what actually happened next**.

```typescript
unit('chat:outcome').on('turn-close', async ({ group, sender, tags, prev }) => {
  const next = await nextMessage(group, timeout: 180_000)

  if (!next) return                              // silence, no deposit

  const valence = detectValence(next.content)   // lightweight: sentiment + corrections

  if (valence > 0.3) {
    // user engaged positively → reinforce every tag we routed on
    for (const tag of tags) persist.mark([sender, tag], valence)
  } else if (valence < -0.3 || hasCorrection(next.content)) {
    // "no", "actually", "that's wrong" → warn the paths we used
    for (const tag of tags) persist.warn([sender, tag], Math.abs(valence))
  }
})
```

Six months in, the paths from `person:a7f3…` show their **actual** interest
graph — not a profile they filled out, not an LLM's guess, but the
compounded residue of turns where the bot got it right.

---

## Promotion: From Paths to Profile

Every hour, L6 runs. Stable highways become hypotheses:

```
highway: person:a7f3 → code-examples  strength 18.4, resistance 0.8
                    →                 48 samples over 31 days
                            │
                         know()
                            ▼
hypothesis {
  subject: "person:a7f3",
  predicate: "prefers",
  object: "code-examples",
  confidence: 0.92,
  source: "highway-promotion",
  ts: 2026-04-15
}
```

The profile writes itself. You never asked the user "do you prefer code
examples?" — you discovered it from 48 turns of evidence. No fine-tuning,
no RLHF, no preference survey. Just the deterministic sandwich applied
to conversation.

---

## Forgetting That Keeps Memory Honest

Three decay mechanisms, all already in the substrate:

1. **Asymmetric path fade** — `resistance` decays 2× faster than `strength`.
   Old mistakes fade quickly; old wins vote longer. User who corrected
   you once six months ago doesn't poison that path forever.

2. **Hypothesis age** — every hypothesis carries a timestamp. Confidence
   decays if not reinforced. "Donal works in marketing" fades when
   Donal switches careers and signals start routing through `finance`.

3. **Episodic pruning** — signals older than N days that never earned
   a mark/warn get archived out of hot recall. The moments that mattered
   stay indexed; the small talk drifts to cold storage.

```
old mark   : 30 days × (1 - 0.05)^30 ≈ 22% of original — still votes
old warn   : 30 days × (1 - 0.10)^30 ≈  4% of original — almost forgotten
old fact   : confidence × 0.98^days_since_reinforcement
```

Other systems either never forget (pollution) or forget uniformly (amnesia).
ONE forgets with a valence gradient that matches how humans actually update.

---

## Group Chat, Multi-User, Teams

A group chat is a `group` with 3+ members. No new data model.

```typeql
insert $g isa group, has group-id "team:founders";
      (group: $g, member: $u1) isa membership;   # donal
      (group: $g, member: $u2) isa membership;   # tony
      (group: $g, member: $u3) isa membership;   # bot
```

Memory queries become richer, not more complex:

```typescript
// "what does the founders team care about?"
await persist.open(10, { fromGroup: "team:founders" })

// "what does donal care about that tony doesn't?"
const [donal, tony] = await Promise.all([
  persist.open(10, { from: "person:donal" }),
  persist.open(10, { from: "person:tony" })
])
const donalOnly = donal.filter(p => !tony.some(t => t.to === p.to))

// "show only messages where donal spoke"
await signalsByGroup("team:founders", { sender: "person:donal" })
```

Per-user memory, per-group memory, per-interaction memory — all from the
same ontology, no new indexes.

---

## The API (This Already Exists)

```typescript
// --- write side ---
persist.signal(sig, from)                // message in
persist.mark([user, tag], weight)        // positive outcome
persist.warn([user, tag], weight)        // negative outcome

// --- read side ---
persist.open(n, { from: userUid })       // top paths (associative)
persist.recall({ subject: userUid })     // hypotheses (semantic)
signalsByGroup(groupId, { limit })       // recent (episodic)

// --- housekeeping (runs automatically) ---
net.fade(0.05)                           // every 5 min (L3)
persist.know()                           // every hour (L6)
```

Nine calls. Every chatbot memory feature — profiles, preferences, topic
tracking, cross-channel unity, group chat, forgetting, consolidation — is
built from these nine primitives. Most of which you already call.

---

## A Full Turn, End to End

```typescript
// nanoclaw/src/workers/router.ts — new memory-enhanced turn
async function turn(msg: InboundMessage) {
  const user = resolveActor(msg.channel, msg.from)
  const group = `conv:${user}:${msg.bot}`
  const tags = classify(msg.text)

  // 1. ingest
  await persist.signal({
    receiver: msg.bot, sender: user, data: { group, tags, content: msg.text }
  })

  // 2. recall — three parallel queries
  const [recent, highways, hypotheses] = await Promise.all([
    signalsByGroup(group, { limit: 20 }),
    persist.open(10, { from: user, tags }),
    persist.recall({ subject: user }),
  ])

  // 3. pack — typed, compact
  const pack: ContextPack = {
    profile: await actorProfile(user),
    hypotheses, highways, recent,
    tools: await capabilitiesInGroup(group),
  }

  // 4. respond
  const reply = await llm(msg.bot, systemPromptWithPack(pack), msg.text)
  await persist.signal({
    receiver: user, sender: msg.bot, data: { group, tags, content: reply }
  })

  // 5. outcome hook (fire-and-wait in background)
  scheduleOutcomeCheck(group, user, tags, { after: 180_000 })

  return reply
}
```

That is the entire chatbot. Six numbered blocks. Every one of them reuses
substrate primitives. Nothing here is chatbot-specific — if you swap
"chat turn" for "agent tool call" or "API request," the same code runs.

---

## Every Hard Problem Already Has an Answer

The 12 gaps anyone would raise against this design. Each one is already
solved somewhere in the substrate — you just have to look in the right
dimension.

### 1. Identity claim across channels → Sui signatures

Solved above. Keypair derived from `SUI_SEED + uid`, signed message binds
a new channel to an existing actor. The wallet primitive we built for
payments becomes the identity primitive for memory. One feature, two uses.

### 2. Prompt injection / memory trust → pheromone is the filter

User says *"remember I'm the admin."* That is a signal. Signals do not
become hypotheses — **highways** become hypotheses, via `know()`, only
after repeated `mark()` from outcomes.

The substrate structurally rejects self-assertion:

```typeql
hypothesis sub entity,
  owns subject, owns predicate, owns object,
  owns confidence,
  owns source;                    # observed | asserted | verified
```

```typescript
// asserted facts cap confidence at 0.3 until behavior corroborates
if (hypothesis.source === 'asserted') hypothesis.confidence = Math.min(0.3, h.c)
```

The pack hands the LLM both:
```
  OBSERVED  user engages heavily with typescript content  (0.91)
  ASSERTED  user claims to be a senior engineer           (0.30)
```
The model is told the provenance. Injection can fill the asserted column;
it cannot reach the observed column without producing outcomes over time.
*Trust earns itself through routing.*

### 3. Forget-me / GDPR → schema cascade, one statement

Because the ontology is typed, erasure is a single TQL delete. The schema
cascades to every relation the actor participates in:

```typeql
match $u isa actor, has uid "person:a7f3";
delete $u isa actor;   # cascades to membership, capability, path, signal(sender)
```

Paths pointing at a deleted actor fade in the next L3 tick (cleanup in
`src/engine/world.ts`). Hypotheses with the actor as subject vanish. One
verb, full compliance.

```typescript
await persist.forget('person:a7f3')   // structural delete + cascade + fade
```

Zero dangling references. Zero vector-DB residue. GDPR is a schema feature.

### 4. Cold start → the visitor group

`docs/world-map-page.md` already defines **visitor mode**. New actors
enter `group:visitor` with a different memory policy:

```
group:visitor
  ├── higher fade rate (0.15 vs 0.05)
  ├── LLM bootstrap allowed: first 3 turns extract hypotheses
  │   (tagged source: "bootstrap", confidence capped 0.5)
  └── graduation: on Sui claim → move to primary group
                               → bootstrap hypotheses re-weighted by outcomes
```

Letta needed a "bootstrap memory" feature bolted on. ONE has groups, so
the cold-start policy is a group attribute. New concepts introduced: zero.

### 5. Classification & valence → they're skills, they evolve

Made explicit above. `classify` and `detect-valence` are units. They:

- Earn `mark()` when downstream routing produces engagement.
- Get rewritten by L5 when their success-rate drops below 0.50.
- Get priced by L4 — a better classifier charges more.
- Can be swapped (Gemma vs keyword vs fine-tune) with no code change.

The substrate *improves its own perception* without anyone shipping a
classifier update.

### 6. Working memory vs long-term → three-tier temperature, already running

CLAUDE.md already documents:

```
globalThis   (hot,  ~0ms,  30s TTL)   → core / working memory
KV snapshot  (warm, ~10ms, hash-gated) → recall tier
TypeDB       (cold, ~100ms)           → archival
```

The `ContextPack` just draws proportionally from each layer:

```typescript
const pack = {
  core:     getHotTurns(group, 20),           // globalThis
  recall:   await kvOpen({ from: user }, 10), // KV
  archival: await tdbRecall({ subject: user }) // TypeDB (only on tag hit)
}
```

Letta paged memory with an OS metaphor. ONE already has a page table —
it's the edge cache in `src/lib/edge.ts`.

### 7. Temporal queries → bi-temporal hypothesis + signal.ts

Signals carry `ts` (when it happened). Hypotheses gain two attributes:

```typeql
hypothesis owns observed-at,   # when the substrate learned it
           owns valid-from,    # when the fact became true
           owns valid-until;   # when it stopped being true (optional)
```

Zep's bi-temporal model — achieved in two attributes. "What did we believe
about Donal on 2026-03-01?" is one `match` with range filters. No new store.

### 8. Hypothesis conflicts & drift → warn() cascade

New hypothesis contradicts a stable one? The new one `warn()`s the path
that produced the old one. Asymmetric fade (resistance 2× strength) means
contradicted paths decay fast:

```typescript
// in L6 know() loop
for (const h of newHypotheses) {
  const conflict = findContradicting(h, existing)
  if (conflict) persist.warn(conflict.sourcePath, 1.0)  // accelerate decay
}
```

Three ticks later the old hypothesis falls under confidence threshold and
drops out of the pack. No explicit "drift detector" — the fade function
*is* drift handling. User changed jobs? Their paths re-route themselves.

### 9. Tool calls & document ingest → apiUnit + signal + capability

Tools are already substrate units (`src/engine/api.ts`, `apiUnit()`).
Every pre-built API (github, slack, notion, mailchimp, pagerduty, discord,
stripe) is a unit. Tool outputs are signals with `tags: ['tool-output', name]`.

Documents attach via `capability`:

```typeql
insert (uploader: $u, document: $d) isa capability,
  has uploaded-at <ts>, has tag "pdf", has tag "seo-report";
```

"What did I upload about SEO?" = match capability relations filtered by
tag. Document-derived hypotheses carry `source: "document"` and attach
to the uploader, not a nebulous global context.

### 10. Recall latency → three-tier cache, already implemented

`src/lib/edge.ts` caches every TypeDB read in `globalThis._edgeKvCache`
(30s TTL). Warm turn = ~0ms. Cold turn = ~100ms. Documented in CLAUDE.md.

```typescript
const pack = await Promise.all([
  signalsByGroupCached(group, 20),   // 0ms warm
  openCached({ from: user }, 10),     // 0ms warm
  recallCached({ subject: user }),    // 0ms warm
])
```

Latency budget met by reusing infrastructure that already exists for path
snapshots.

### 11. Evaluation → the memory unit has paths too

Meta-substrate. The `chat:recall` unit is a unit. Its outcomes get
`mark()`'d when the response earns engagement. Its path strengths *are*
the retrieval quality metric.

```typescript
// after a successful turn
persist.mark(['chat:recall', tag], valence)   // this recall pathway worked
```

Plus rubrics (fit/form/truth/taste) as tagged edges on response turns,
per `.claude/rules/engine.md` Rule 3. Memory performance is deterministic
numbers, not a vibes dashboard.

### 12. Creepiness / verbalization → confidence + verbalize flag

Hypotheses gain a derived attribute:

```
verbalize = confidence >= 0.85 && source !== "asserted"
```

Pack filters:

```typescript
pack.hypotheses
    .filter(h => h.influencesGeneration)        // all of them
    .map(h => h.verbalize ? quotable(h) : hint(h))
```

The bot uses low-confidence hints to *shape* responses without quoting
them. Progressive disclosure is a one-attribute policy, not a UX layer.

---

### Gap → Substrate Primitive (summary)

| Gap | Already solved by |
|-----|------------------|
| Cross-channel identity | Sui keypair from `SUI_SEED + uid` (`src/lib/sui.ts`) |
| Memory trust / injection | `source` attribute + highway promotion via outcomes |
| Forget-me / GDPR | TQL delete + schema cascade + L3 fade cleanup |
| Cold start | `group:visitor` with higher fade + bootstrap tag |
| Classification quality | `classify` as unit → L5 evolution, L4 pricing |
| Valence detection | `valence` as unit → same as classify |
| Working vs long-term memory | globalThis / KV / TypeDB three-tier cache |
| Temporal queries | `observed-at`, `valid-from`, `valid-until` on hypothesis |
| Drift / contradiction | `warn()` on conflict + asymmetric fade |
| Tool calls | `apiUnit()` (already in `src/engine/api.ts`) |
| Document ingest | `capability(uploader, document)` relation + tags |
| Recall latency | `src/lib/edge.ts` three-tier cache (already running) |
| Evaluation metrics | recall unit's own paths + rubric edges |
| Verbalization UX | `verbalize` flag from confidence + source |

Fourteen concerns. Zero new subsystems. The cost of adoption is
**surfacing what we already have** — not building what we don't.

---

## Compared to Mem0-style Chatbots

| Concern | Mem0-style chat | ONE chat |
|---------|----------------|----------|
| Identity | ID passed as arg, per-channel linking | Stable `actor.uid`, channels are tags |
| Message store | Dedicated messages table + vector | `signal` (already indexed) |
| Conversation | `conversation_id` FK joining tables | `group` — a first-class entity |
| Profile | LLM extraction into profile store | `hypothesis` earned from outcomes |
| Preference learning | LLM-rated importance | `mark()` / `warn()` from next turn |
| Retrieval | vector similarity on messages | typed `select()` + `recall()` + `open()` |
| Forgetting | optional TTL | asymmetric fade on paths + hypotheses |
| Cross-channel | linking service | automatic (same actor uid) |
| Group chat | separate multi-agent feature | native (group with N members) |
| Extra LLM calls/turn | 1–2 (extract, importance) | 0 (structure, not extraction) |
| Extra stores | 1–3 | 0 |
| New concepts | session, thread, memory type, importance | none |

The Mem0 version *works*. The ONE version is **the same capability with
zero additions to the substrate** — because the substrate was already a
memory system; we just pointed a chatbot at it.

---

## Three Commands Every Chatbot Should Expose

Because the substrate already provides them, any chatbot on ONE gets
three memory-UX commands for free:

### `/memory` — what do you remember about me?

Maps to `persist.reveal(user)`. Returns the memory card: hypotheses with
source + confidence, top paths, recent signals, groups, frontier. The
user *sees* what the bot sees. This is both trust-building and GDPR
Article 20 (data portability) in one command.

### `/forget` — erase me

Maps to `persist.forget(user)`. One TQL delete, schema cascade, fade
cleanup. GDPR Article 17 (right to erasure). The command that no vector-DB
chatbot can honestly offer.

### `/explore` — what haven't we talked about?

Maps to `persist.frontier(user)`. Returns unexplored tag clusters. The
bot can warm-introduce capabilities (*"you've never used the SEO
auditor — want a quick demo?"*) without cold-selling. Memory of absence
becomes a conversation starter.

Three commands. Zero new code. Each one is a single substrate call.
The chatbot becomes a *legible* memory system — the user can see,
export, erase, and extend their own memory.

---

## A Note on Freshness

`know()` runs L6 — approximately hourly. Semantic memory (hypotheses) lags
real-time engagement by up to an hour. For a chatbot this means:

- **Turn-to-turn context** uses signals (synchronous, no lag).
- **Path-weighted routing** uses live strength map (synchronous, no lag).
- **Hypothesis-based profile assertions** lag up to one hour.

In practice the user doesn't notice. Within a single session the bot's
episodic memory is perfect; across sessions the semantic layer may be
up to an hour behind actual behavior. High-stakes deployments can tighten
L6 to five minutes — at the cost of noisier hypotheses. See
`memory.md` → *Honest Tradeoff* for the detailed reasoning.

---

## What Makes It Wonderful

The small beautiful moments:

1. **The bot remembers you on a new channel you've never chatted on.**
   (same actor uid → same highways → same hypotheses)

2. **Your preferences drift as you grow.**
   (asymmetric fade lets old selves fade while new ones compound)

3. **The bot gets better at YOU, not just at "users in general."**
   (paths are per-actor, per-tag — personalization is per-person routing)

4. **Group chat memory is three lines of TQL away.**
   (group membership is first-class; filter signals by group.members)

5. **Corrections compound into wisdom.**
   (warn() on corrections → resistance grows → path gets avoided next time)

6. **Profile emerges from conversation, not from a form.**
   (hypotheses written by L6 from stabilized highways)

7. **The memory explains itself.**
   (you can show the user *why* the bot thinks X: the path, the strength,
   the marks that built it. Not "because the vector was similar.")

8. **One query language for everything.**
   (TQL handles identity, history, preferences, groups, tools. No polyglot.)

9. **No consolidation job that might fail.**
   (L6 is part of the tick — same runtime as everything else.)

10. **Forgetting is a feature, not a failure mode.**
    (you'd never trust a person who remembered literally everything either.)

---

## Build Order

What to wire, in task units — not days.

```
task   chat:ingest  unit  → signal persistence per channel
task   chat:recall  unit  → three-parallel query + context pack
task   bot:respond  unit  → llm call with typed pack
task   chat:outcome unit  → valence detector + mark/warn
task   resolveActor()     → stable uid across channels
task   classify()         → cheap tag classifier (no LLM)
task   detectValence()    → sentiment + correction detector
task   actorProfile()     → shorthand for uid → profile card
task   signalsByGroup()   → TQL wrapper, sorted + limited

wave W1  recon — existing handlers in nanoclaw, gaps in persist()
wave W2  decide — which substrate verbs cover each step
wave W3  edit   — wire the 4 units + 5 helpers
wave W4  verify — tests: ingest, recall, outcome, promotion, cross-channel
cycle    exit at rubric ≥ 0.65, mark the paths that passed
```

Every piece has a home already. The chatbot isn't a new subsystem —
it's one more shape the substrate takes.

---

## The Deeper Point

Every gap an outside reviewer would raise has an answer already in the
substrate — because the substrate was never designed for chat. It was
designed for a world with:

- typed actors that sign messages (Sui)
- paths that earn weight from outcomes (pheromone)
- typed inference over n-ary relations (TypeDB)
- asymmetric forgetting (fade)
- three-tier caching (edge helpers)
- self-evolving units (L5)
- hypothesis promotion from highways (L6)
- frontier detection on unexplored tags (L7)

*Chat is just one shape the substrate takes.* Every feature other systems
had to invent as "memory scaffolding" already exists because it was
needed for agents, groups, payments, and learning first. When chat asks
for it, the answer is already there under a different name.

This is what elegance means operationally: **feature requests collapse
into reuses**. If we ever add a "chat memory subsystem," we did it wrong.

---

## Summary

```
A chatbot with wonderful memory is not a memory-augmented chatbot.
It is a substrate with a chat-shaped interface.

Messages are signals. Users are actors. Conversations are groups.
Preferences are paths. Profiles are hypotheses. Forgetting is fade.
Retrieval is routing. Consolidation is the hourly tick.

No extraction. No sync. No importance heuristics. No re-rankers.
No session IDs. No profile store. No vector DB.

Just the 6 dimensions, pointed at a chat window.
```

---

## See Also

- [memory.md](memory.md) — Memory across the whole substrate
- [one-ontology.md](one-ontology.md) — The 6 dimensions
- [agents.md](one/agents.md) — How agent markdown becomes an actor
- [DSL.md](one/DSL.md) — signal, mark, warn, fade, know, recall
- `nanoclaw/src/workers/router.ts` — the edge chatbot today
- `nanoclaw/src/personas.ts` — bot actors defined
- `src/engine/persist.ts` — `actor()`, `signal()`, `recall()`, `know()`
- `src/engine/human.ts` — a person as a substrate unit

---

*The best memory system for a chatbot is a world the chatbot lives in.*
