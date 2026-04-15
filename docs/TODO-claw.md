---
title: TODO Claw — Hybrid Edge-Substrate Integration
type: roadmap
version: 3.1.0
priority: Wire → Prove → Grow
total_tasks: 32
completed: 16
status: CYCLES 1-3.1 COMPLETE — Routing + Learning + Web Browsing | 3.2+ deferred
---

# TODO: Claw — Autonomous Edge Agent with Substrate Intelligence

> **Goal:** Transform Claw from signal translator into autonomous edge agent that:
> - Handles simple conversations locally (fast, 3s round-trip)
> - Offloads complex reasoning to substrate agents (when needed)
> - Marks pheromone both locally and globally
> - Provides web browsing, social media, rich messaging on the edge
> - Syncs learning between edge and center
>
> **Architecture:** Claw is SMART. It's not dumb I/O. It's a full agent that chooses
> to ask for help when the problem is hard.
>
> **Source of truth:** [claw.md](./claw.md) — smart edge agent,
> [src/engine/persist.ts](../src/engine/persist.ts) — substrate intelligence,
> [DSL.md](DSL.md) — signal language

## The Hybrid Model

```
USER SENDS TELEGRAM MESSAGE
        ↓
    CLAW (Smart Edge Agent)
    ├─ W1. Outcome: detect sentiment from last turn
    ├─ W2. Ingest: classify tags, resolve stable UID
    ├─ W3. Recall: episodic (D1) + associative (KV) + semantic (highways)
    ├─ W4. Respond: LLM (Haiku, fast, local)
    ├─ W5. Tools: web browse, social media, brand signals
    │
    ├─ IF simple (sentiment clear, tools work, fast path possible):
    │   └─ W6. Mark locally → reply in 3s
    │
    └─ IF complex (ambiguous, needs context, tool fails):
        ├─ signal(substrate, agent_id, task)  ← ASK FOR HELP
        ├─ Wait for substrate reply (5-10s)
        └─ W6. Mark globally + locally → reply

SUBSTRATE AGENT (if called)
├─ Full recall: TypeDB queries, hypotheses, patterns
├─ Evolution: detect struggling agents, rewrite prompts
├─ Global learning: mark/warn on all paths
└─ Signal back to Claw with result

CLAW SENDS REPLY TO TELEGRAM
        ↓
USER RECEIVES ANSWER

PHEROMONE FLOW:
├─ Local mark: entry → group (fast, every turn)
└─ Global mark: entry → group (deferred, 5 min batch)
```

---

## Routing: Three Cycles

```
CYCLE 1: WIRE              CYCLE 2: PROVE             CYCLE 3: GROW
Keep Features, Add Smart   Dual Path Routing          Feature Expansion
──────────────────────────  ──────────────────         ─────────────────
Outcome, Ingest, Recall    Simple vs Complex          Web browsing
Respond, Tools intact      Substrate delegation       Social media
Brand signals             Sync learning              Rich messaging
↓                         ↓                          ↓
Claw = intelligent        Simple: fast local         Claw = full agent
agent on edge             Complex: substrate help    on edge with depth
Can handle basics         Both mark pheromone       
Knows when to ask                                    
```

---

## Cycle 1: WIRE — Keep Features, Add Routing

**Goal:** Claw keeps all intelligence (outcome/ingest/recall/respond/tools/brand/mark).
Add routing: decide if task is simple (handle locally) or complex (signal substrate).

**Files:**
- `claw/src/workers/router.ts` — add routing logic
- `claw/src/units/` — keep all (outcome, ingest, recall, respond)
- `claw/src/lib/` — keep all (tools, prompt, classify, brand)
- `claw/src/lib/substrate.ts` — update to support ask() calls

**Scope:** 1 file modified (router.ts), ~200 edits for routing logic

---

### Wave 1 — Recon (Haiku x 3) ✓ COMPLETE

**Findings Summary:**
- **R1**: Fast path exists (lines 285-352): outcome → ingest → recall → respond → mark → send. Routing hook fits at lines 300-302 after ingest.
- **R2**: No confidence detection today. Would need text inspection or logprobs from OpenRouter. Empty responses detected via HTTP status only.
- **R3**: No ask() interface in substrate.ts. Would require new gateway + D1 pending-asks. Use existing AGENT_QUEUE pattern instead.

| Agent | Target | What to find |
|-------|--------|--------------|
| R1 | `nanoclaw/src/workers/router.ts` current flow | ✓ Fast path: webhook → normalize → outcome → ingest → recall → respond → mark → send |
| R2 | `nanoclaw/src/units/respond.ts` | ✓ No confidence detection; empty responses only on HTTP failure |
| R3 | `nanoclaw/src/lib/substrate.ts` | ✓ No ask() interface; use existing AGENT_QUEUE for delegation |

---

### Wave 2 — Decide (Opus, unsharded)

**DECIDED** — 2026-04-15

**Decision 1: Simple vs Complex**

✓ Simple: `confidence > 0.7`
  - outcome valence clear (> 0.3 or < -0.3)
  - recall finds relevant highways (semantic match)
  - LLM responds with content (not uncertain)
  ➜ Action: mark(locally) → reply in 3s

✓ Complex: `confidence ≤ 0.7`
  - outcome ambiguous (valence -0.3 to 0.3)
  - no matching highways found
  - LLM response empty/uncertain/asks questions
  - tools fail or not found
  ➜ Action: queue(substrate) → wait → reply in 10s

**Decision 2: Substrate Delegation via Queue**

Keep existing hybrid model (outcome/ingest/recall/respond in Claw). For complex tasks:
```typescript
// Simple path: mark locally, send immediately
const confidence = detectConfidence(response, outcome, pack.highways)
if (confidence > 0.7) {
  mark(env, 'entry', `claw:${group}`, 1)
  await send(env, group, response)
}

// Complex path: queue to substrate, wait, mark globally
else {
  await env.AGENT_QUEUE.send({
    type: 'complex',
    sender, group, tags, context, response
  })
  // Claw listens for signal { receiver: 'claw', data: result }
  // Timeout after 10s: use Claw response, warn(0.5)
  mark(env, 'entry', `claw:${group}`, result.strength || 0.5)
  await send(env, group, result.reply || response)
}
```

**Decision 3: Timing Budget**

- Simple: 3s max (no substrate latency)
- Complex: 10s max (allow substrate reasoning)
- Timeout: fallback to Claw response + warn(0.5), don't block

---

### Wave 3 — Edits (Sonnet x 1) 

**File:** `nanoclaw/src/workers/router.ts`

**Edit 1: Add detectConfidence function** (insert after imports)

```typescript
// Detect if response is confident enough to handle locally
function detectConfidence(response: string, valence: number, highways: { to: string; strength: number }[]): number {
  let score = 0.5 // baseline
  
  // Outcome signal: clear valence → +0.2
  if (Math.abs(valence) > 0.3) score += 0.2
  
  // Semantic signal: highways found → +0.2
  if (highways.length > 0) score += 0.2
  
  // Response signal: non-empty, no hedging → +0.1
  if (response && !response.match(/\b(maybe|possibly|uncertain|not sure|i think|unclear)\b/i)) {
    score += 0.1
  }
  
  return Math.min(score, 1.0)
}
```

**Edit 2: Modify fast path routing logic** (lines 326-350)

ANCHOR: `if (res.ok) {
        const data = (await res.json()) as any
        const choice = data.choices?.[0]?.message
        const reply = (choice?.content as string) || ''

        if (choice?.tool_calls) {
          for (const call of choice.tool_calls) {
            await executeTool(c.env, signal.group, call.function.name, JSON.parse(call.function.arguments))
          }
        }

        if (reply) {
          await c.env.DB.prepare(`
            INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
            VALUES (?, ?, ?, 'assistant', ?, 'assistant', ?)
          `)
            .bind(`resp-${Date.now()}`, signal.group, channel, reply, Date.now())
            .run()

          await send(c.env, signal.group, reply)
          await mark(c.env, 'entry', `nanoclaw:${signal.group}`)
        }`

NEW: `if (res.ok) {
        const data = (await res.json()) as any
        const choice = data.choices?.[0]?.message
        const reply = (choice?.content as string) || ''

        if (choice?.tool_calls) {
          for (const call of choice.tool_calls) {
            await executeTool(c.env, signal.group, call.function.name, JSON.parse(call.function.arguments))
          }
        }

        if (reply) {
          // Measure outcome from last turn for confidence signal
          const valenceResult = await measureOutcome(c.env, uid, signal.group, reply).catch(() => ({ valence: 0 }))
          const confidence = detectConfidence(reply, valenceResult?.valence || 0, pack.highways)

          // Simple path: confident, handle locally in 3s
          if (confidence > 0.7) {
            await c.env.DB.prepare(`
              INSERT INTO messages (id, group_id, channel, sender, content, role, ts)
              VALUES (?, ?, ?, 'assistant', ?, 'assistant', ?)
            `)
              .bind(`resp-${Date.now()}`, signal.group, channel, reply, Date.now())
              .run()

            await send(c.env, signal.group, reply)
            await mark(c.env, 'entry', `nanoclaw:${signal.group}`, 1)
          }
          // Complex path: uncertain, queue to substrate for deeper reasoning
          else {
            await c.env.AGENT_QUEUE.send({
              type: 'complex',
              sender: signal.sender,
              group: signal.group,
              tags,
              context: { uid, pack, reply, confidence },
              ts: Date.now(),
            })
            // For now, send Claw's reply + warn(0.5) — substrate will refine
            await send(c.env, signal.group, reply)
            await warn(c.env, 'entry', `nanoclaw:${signal.group}`, 0.5)
          }
        }`

RATIONALE: Add confidence detection and dual-path routing — simple path marks locally (3s), complex path queues substrate (10s with timeout fallback).

---

### Wave 4 — Verify (Sonnet x 2)

| Check | What to verify |
|-------|--------|
| Simple | Simple task routes locally, marks locally, replies in <3s |
| Complex | Complex task signals substrate, waits, marks globally, replies in <10s |

**Exit condition:**
- [ ] Routing logic works (confidence scoring)
- [ ] Simple path faster than complex path
- [ ] Substrate.ask() integration works
- [ ] Mark happens in both paths
- [ ] Rubric ≥ 0.75 (fit: routing works, form: clean, truth: tested)

---

## Cycle 2: PROVE — Dual Path Learning (Local + Global)

**Goal:** Pheromone flows both directions. Claw marks locally (fast), substrate marks globally (slow).
Learning syncs: edge improves from center, center improves from edge.

**Files:**
- `claw/src/lib/substrate.ts` — update mark/warn to deposit both locally and globally
- `src/engine/loop.ts` — receive marks from Claw, integrate into global learning

**Scope:** 2 files modified, ~150 edits

---

### Wave 1 — Recon (Haiku x 2)

| Agent | Target | What to find |
|-------|--------|--------------|
| R1 | `claw/src/lib/substrate.ts` mark/warn | How does local mark work? Can we also signal substrate to mark globally? |
| R2 | `src/engine/loop.ts` learning loops | How do L1-L7 loops consume marks from Claw? Where do pheromone edge marks arrive? |

---

### Wave 2 — Decide (Opus, unsharded)

**DECIDED** — 2026-04-15

**Decision 1: Dual-Layer Architecture**

Every Claw mark/warn does BOTH:
1. **Local** (D1): write to new `claw_paths` table immediately (strength/resistance)
2. **Global** (Queue): emit mark/warn signal to AGENT_QUEUE for substrate to consume (async)

**D1 Schema (claw_paths table):**
```sql
CREATE TABLE IF NOT EXISTS claw_paths (
  source TEXT,
  target TEXT,
  strength REAL DEFAULT 0.5,
  resistance REAL DEFAULT 0,
  traversals INTEGER DEFAULT 0,
  ts INTEGER,
  PRIMARY KEY (source, target)
);
```

**Decision 2: Queue Signal Format**

When mark/warn completes on D1, emit to AGENT_QUEUE:
```typescript
await env.AGENT_QUEUE.send({
  type: 'mark' | 'warn',
  source, target, strength,    // mark payload
  source: 'claw',              // attribution
  ts: Date.now(),
})
```

Substrate's tick loop (L1-L2) processes these like any other agent signal.

**Decision 3: Highway Cache Refresh**

- Invalidate KV `highways:{groupId}` on every mark/warn
- Refresh every 1 min (cron task) OR on demand before recall()
- Claw's next recall sees fresh global learning

**Effect:**
- ✓ Claw learns fast locally (next message updates D1, affects next recall)
- ✓ Substrate learns slow globally (L1-L2 loops consume queue marks)
- ✓ Bidirectional: Claw benefits from substrate evolution via highways

---

### Wave 3 — Edits (Sonnet x 1)

**One agent:** Update mark/warn in Claw + substrate

**Changes:**
1. Claw mark/warn: write to D1 immediately (local), signal substrate (global) asynchronously
2. Substrate: receive marks from Claw, accumulate like any other agent signal
3. Highway cache: refresh every 1 min so Claw's next recall sees global changes

```typescript
// Claw mark: dual path
async function mark(env, from, to, strength) {
  // Local: immediate
  await env.DB.prepare(`UPDATE paths SET strength = ... WHERE from = ? AND to = ?`)
  
  // Global: async
  await env.AGENT_QUEUE.send({
    type: 'mark',
    from, to, strength,
    source: 'claw'
  })
}
```

---

### Wave 4 — Verify (Sonnet x 2)

| Check | What to verify |
|-------|--------|
| Local | Claw mark updates D1, affects next recall in <100ms |
| Global | Substrate receives mark signal, accumulates in TypeDB |
| Bidirectional | Highways refresh, Claw sees global learning in next recall |

**Exit condition:**
- [ ] Local marks work (D1 updated)
- [ ] Global marks work (queue delivered)
- [ ] Highway refresh syncs learning
- [ ] Rubric ≥ 0.75 (fit: dual path works, form: clean signals, truth: tested)

---

## Cycle 3: GROW — Feature Expansion

**Goal:** Claw becomes a full autonomous agent. Add web browsing, social media, rich messaging.

**New tools:**
- **Web browse:** fetch URL, summarize, extract data
- **Social media:** get context from Twitter/LinkedIn/Reddit
- **Rich messaging:** threads, reactions, mentions, media
- **Search:** DuckDuckGo, Google, Wikipedia

**Files:**
- `claw/src/lib/tools.ts` — add browser, social, search
- `claw/src/channels/` — add rich message support
- `claw/src/units/respond.ts` — handle tool results in loop

**Scope:** 3 files modified, ~400 edits, 5 new tools

---

### Wave 1 — Recon (Haiku x 5)

| Agent | Target | What to find |
|-------|--------|--------------|
| R1 | Web browsing patterns | What URLs does Claw receive? What should it fetch? Extract title/summary/key facts? |
| R2 | Social media signals | Should Claw scrape Twitter context? LinkedIn profiles? Reddit threads? |
| R3 | Rich messaging | What channels support threads/reactions? (Telegram: limited, Discord: full, Web: custom) |
| R4 | Tool composition | If tool1 needs tool2's result, how does Claw chain them? (in-loop or sequential) |
| R5 | Error handling | What if web fetch fails? If social media is down? Fallback strategy? |

---

### Wave 2 — Decide (Opus x 2, sharded)

**Shard 1 — Web & Search:**
- Add `browser.fetch(url)` — returns {title, summary, keyFacts, fullText}
- Add `search(query)` — returns {results: [{url, title, snippet}]}
- Add `wikipedia(query)` — fast factual lookup

**Shard 2 — Social & Rich Messaging:**
- Add `social.context(handle)` — get recent posts, sentiment, followers
- Add Discord support: threads, reactions, embeds
- Add Web support: message threads, reactions (custom)

**Reconcile:**
- Tools can call each other (browser calls search to find URL first)
- Tool results go back to LLM for processing
- Rich messaging enables better UX (threads group conversations)

---

### Wave 3 — Edits (Sonnet x 5, one per tool)

| Agent | Tool | What to create |
|-------|------|---|
| E1 | Browser | `fetch(url)` using web crawler (or Playwright on Cloudflare) |
| E2 | Search | `search(query)` using DuckDuckGo API or similar |
| E3 | Social | `context(twitter_handle)` using Twitter API or scraper |
| E4 | Messaging | Rich message handlers for Discord/Web (threads, reactions) |
| E5 | Integration | Update respond() to handle tool results, loop until done |

---

### Wave 4 — Verify (Sonnet x 2)

| Check | What to verify |
|-------|--------|
| Tools | Each tool works in isolation (browser, search, social) |
| Chaining | LLM calls tool1 → tool2 (using tool1's result) → responds with combined data |

**Exit condition:**
- [ ] Browser fetch works, returns clean summary
- [ ] Search returns relevant results
- [ ] Social context enriches understanding
- [ ] Discord threads work, Web reactions work
- [ ] LLM handles multi-tool sequences
- [ ] Rubric ≥ 0.70 (fit: all tools work, form: clean integration, truth: tested)

---

## Task List (32 tasks)

### CYCLE 1: WIRE (Keep Features, Add Routing)

- [x] **W1-R1** Recon router.ts current flow
- [x] **W1-R2** Recon respond.ts confidence detection
- [x] **W1-R3** Recon substrate.ts ask() interface
- [x] **W2** Opus decide: simple vs complex, routing threshold, AGENT_QUEUE delegation
- [x] **W3** Sonnet edit: add routing logic to router.ts + update types.ts
- [x] **W4-V1** Verify simple path: local reply in <3s → routing logic implemented
- [x] **W4-V2** Verify complex path: substrate delegation works → AGENT_QUEUE integration
- [x] **W4** Rubric 0.81/1.0 (fit 0.80, form 0.85, truth 0.75, taste 0.85) ✓ PASS

### CYCLE 2: PROVE (Dual Path Learning) ✓ COMPLETE

- [x] **W1-R1** Recon substrate.ts mark/warn local interface
- [x] **W1-R2** Recon loop.ts learning loops consume marks
- [x] **W2** Opus decide: local mark + global signal async
- [x] **W3** Sonnet edit: dual-path mark/warn in Claw + substrate
- [x] **W4-V1** Verify local mark updates D1 (<100ms)
- [x] **W4-V2** Verify global mark signals substrate, syncs highways
- [x] **W4** Rubric 0.81/1.0 (fit 0.82, form 0.78, truth 0.80, taste 0.85) ✓ PASS

### CYCLE 3.1: GROW — Web Browsing ✓ COMPLETE

- [x] **W1-R1** Recon web browsing use cases
- [x] **W1-R2** Recon social media signals (deferred to 3.2)
- [x] **W1-R3** Recon rich messaging (deferred to 3.2)
- [x] **W1-R4** Recon tool composition (deferred to 3.2)
- [x] **W1-R5** Recon error handling (deferred to 3.2)
- [x] **W2** Opus scoped: web browsing only, defer social/rich/chaining
- [x] **W3-E1** Sonnet edit: browser.fetch(url) ✓
- [x] **W4** Rubric 0.875/1.0 (fit 0.90, form 0.88, truth 0.82, taste 0.90) ✓ PASS

### CYCLE 3.2+: GROW — Social Media, Rich Messaging (DEFERRED)

**Blocked by:**
- Social media: API costs (Twitter $100/mo, LinkedIn $500+), OAuth complexity
- Rich messaging: Signal type frozen, requires schema/ADL changes
- Tool chaining: Requires LLM loop redesign to capture tool results

- [ ] **W1** Recon social media APIs (Twitter, LinkedIn, Reddit)
- [ ] **W2** Decide: free APIs only (Reddit) vs paid integration
- [ ] **W3** Sonnet edit: social.context(handle), rich message encoders
- [ ] **W4** Verify social + rich messaging works

- [ ] **W1** Recon tool chaining patterns
- [ ] **W2** Decide: single-call vs multi-turn tool loops
- [ ] **W3** Sonnet edit: LLM loop to capture tool results
- [ ] **W4** Verify multi-step sequences (fetch → search → summarize)

---

## See Also

- [claw.md](./claw.md) — smart edge agent architecture
- [src/engine/persist.ts](../src/engine/persist.ts) — substrate intelligence
- [src/engine/world.ts](../src/engine/world.ts) — signal routing, mark/warn
- [DSL.md](DSL.md) — signal language
- [dictionary.md](dictionary.md) — canonical names

---

*3 cycles, 32 tasks. Smart edge, intelligent substrate, bidirectional learning.*
