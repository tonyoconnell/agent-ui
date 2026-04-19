# Plan: Intent Cache

**The problem:** "return policy" and "what is your return policy" are the same question.
The exact cache treats them as different. Calls the LLM twice. Wastes money.

**The insight:** buttons define the intents. Typed text maps to them.

Every button you show a user is an explicit intent declaration. When someone types
instead of clicking, the intent resolver maps their words to the same bucket.
One answer. Cached once. Served to everyone who asks — however they ask it.

---

## How It Works

```
USER SENDS MESSAGE
        │
        ├─── clicked a button ────────────────────────────────────────────────┐
        │    "Return Policy"                                                   │
        │    exact text, always identical                                      │
        │    hash → D1 → hit → instant                                        │
        │                                                                      │
        └─── typed something ─────────────────────────────────────────────────┤
             "how do I return this"                                            │
             "refund?"                                                         │
             "I want my money back"                                            │
             "return policy"                                                   │
                    │                                                          │
                    ▼                                                          │
             TIER 1: exact hash → D1                                          │
                    │ (catches repeat typers, same words)                     │
                    │ miss ↓                                                   │
             TIER 2: intent resolver                                           │
                    │                                                          │
                    ├── step 1: keyword match (0ms, $0)                       │
                    │   "return" → refund-policy intent? → hit                │
                    │                                                          │
                    ├── step 2: TypeDB intent registry (<5ms, $0)             │
                    │   known keyword patterns → intent name                  │
                    │                                                          │
                    └── step 3: tiny LLM normaliser (50ms, $0.0001)          │
                        only if steps 1+2 fail                                │
                        "map this to the closest intent"                      │
                        → "refund-policy"                                     │
                               │                                              │
                               ▼                                              │
                    intent hash → D1 ─────────────────────────────────────── ┘
                               │
                        hit → return cached answer (0ms, $0)
                        miss → LLM call → cache under intent hash
                               │
                               └── auto-learn: did we just discover a new
                                   intent? save it so next time is faster
```

---

## The Beautiful Part: Buttons ARE the Seed Set

When you build a chat interface with buttons, you're already defining your intents.
You just don't know it yet.

```typescript
// Your buttons
const buttons = [
  { label: 'Return Policy',    intent: 'refund-policy' },
  { label: 'Shipping Info',    intent: 'shipping-info' },
  { label: 'Track My Order',   intent: 'order-tracking' },
  { label: 'Cancel Order',     intent: 'cancellation' },
  { label: 'Contact Support',  intent: 'human-handoff' },
]

// These buttons seed the intent registry automatically on startup.
// Every button click: exact cache hit (tier 1).
// Every typed variation: maps to the same intent (tier 2).
// Same answer. Same cache entry. One source of truth.
```

You maintain buttons in one place. The intent cache builds itself from them.
Add a button → intent automatically available for typed queries too.

---

## Data Model

### D1 Migration — `migrations/0005_intents.sql`

```sql
-- Intent registry: canonical names + keyword triggers
CREATE TABLE IF NOT EXISTS intents (
  name        TEXT PRIMARY KEY,    -- 'refund-policy'
  label       TEXT NOT NULL,       -- 'Return Policy' (button label)
  keywords    TEXT NOT NULL,       -- JSON: ["return","refund","money back","exchange"]
  examples    TEXT,                -- JSON: typed queries that mapped here (learning)
  hit_count   INTEGER DEFAULT 0,   -- how many times this intent was matched
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intents_hits ON intents(hit_count DESC);

-- Typed query log: what did people actually type? (for improving intents)
CREATE TABLE IF NOT EXISTS intent_queries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  raw         TEXT NOT NULL,       -- "how do I return this"
  intent      TEXT,                -- 'refund-policy' (null if unknown)
  resolver    TEXT,                -- 'keyword' | 'typedb' | 'llm' | 'unknown'
  cached      INTEGER DEFAULT 0,   -- did this hit the cache after resolution?
  ts          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_queries_intent ON intent_queries(intent, ts);
CREATE INDEX IF NOT EXISTS idx_queries_unknown ON intent_queries(intent, ts)
  WHERE intent IS NULL;            -- fast lookup of unknowns for review
```

---

## Implementation

### `src/engine/intent.ts` (new file, ~120 lines)

```typescript
import { readParsed, writeSilent } from '@/lib/typedb'

export interface Intent {
  name: string        // 'refund-policy'
  label: string       // 'Return Policy'
  keywords: string[]  // ['return', 'refund', 'money back']
  examples?: string[] // typed queries that mapped here
}

export interface ResolveResult {
  intent: string
  resolver: 'exact' | 'keyword' | 'typedb' | 'llm' | 'unknown'
  confidence: number  // 0.0–1.0
}

/**
 * Resolve a typed query to a canonical intent name.
 *
 * Three escalating steps:
 *   1. Keyword match    — 0ms,  $0.000,  handles most cases
 *   2. TypeDB registry  — <5ms, $0.000,  handles known patterns
 *   3. LLM normaliser   — 50ms, $0.0001, handles everything else
 *
 * Returns null if genuinely unknown — caller falls through to full LLM.
 */
export const resolveIntent = async (
  input: string,
  opts: {
    db?: D1Database
    complete?: (prompt: string) => Promise<string>
    intents?: Intent[]   // pass directly to avoid DB lookup
  } = {}
): Promise<ResolveResult | null> => {
  const lower = input.toLowerCase().trim()
  const words = lower.split(/\W+/).filter(w => w.length > 2)

  // ── Step 1: Keyword match ────────────────────────────────────────────────
  // Load intents (from opts or D1)
  const intents = opts.intents ?? await loadIntents(opts.db)

  for (const intent of intents) {
    const matches = intent.keywords.filter(kw =>
      lower.includes(kw.toLowerCase())
    )
    if (matches.length >= Math.min(2, intent.keywords.length)) {
      return { intent: intent.name, resolver: 'keyword', confidence: 0.85 }
    }
    // Single strong keyword match
    if (matches.length === 1 && intent.keywords.length <= 3) {
      return { intent: intent.name, resolver: 'keyword', confidence: 0.70 }
    }
  }

  // ── Step 2: TypeDB intent registry ──────────────────────────────────────
  // Broader match: any word in input matches any keyword in TypeDB intent
  for (const word of words) {
    try {
      const rows = await readParsed(`
        match $i isa intent, has keyword "${word}", has name $n, has confidence $c;
        select $n, $c; sort $c desc; limit 1;
      `)
      if (rows.length > 0) {
        return { intent: rows[0].n as string, resolver: 'typedb', confidence: rows[0].c as number }
      }
    } catch { /* TypeDB unavailable — continue */ }
  }

  // ── Step 3: LLM normaliser ───────────────────────────────────────────────
  // Only if we have a complete function and known intents to choose from
  if (!opts.complete || intents.length === 0) return null

  const intentList = intents.map(i => `${i.name}: ${i.label}`).join('\n')
  try {
    const response = await opts.complete(
      `Map this user message to the closest intent name. Reply with ONLY the intent name, nothing else. If none match, reply "unknown".

Known intents:
${intentList}

User message: "${input}"`
    )
    const resolved = response.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (resolved === 'unknown' || !intents.find(i => i.name === resolved)) return null
    return { intent: resolved, resolver: 'llm', confidence: 0.75 }
  } catch { return null }
}

// ── Intent management ────────────────────────────────────────────────────

export const loadIntents = async (db?: D1Database): Promise<Intent[]> => {
  if (!db) return []
  const rows = await db.prepare('SELECT name, label, keywords FROM intents ORDER BY hit_count DESC')
    .all<{ name: string; label: string; keywords: string }>()
  return (rows.results ?? []).map(r => ({
    name: r.name,
    label: r.label,
    keywords: JSON.parse(r.keywords) as string[]
  }))
}

export const seedIntents = async (db: D1Database, intents: Intent[]) => {
  const now = Date.now()
  for (const i of intents) {
    await db.prepare(`
      INSERT OR REPLACE INTO intents (name, label, keywords, hit_count, created_at, updated_at)
      VALUES (?, ?, ?, COALESCE((SELECT hit_count FROM intents WHERE name = ?), 0), ?, ?)
    `).bind(i.name, i.label, JSON.stringify(i.keywords), i.name, now, now).run()
  }
}

export const recordQuery = async (
  db: D1Database,
  raw: string,
  result: ResolveResult | null,
  cached: boolean
) => {
  await db.prepare(
    'INSERT INTO intent_queries (raw, intent, resolver, cached, ts) VALUES (?, ?, ?, ?, ?)'
  ).bind(raw, result?.intent ?? null, result?.resolver ?? 'unknown', cached ? 1 : 0, Date.now()).run()
}

export const bumpHitCount = async (db: D1Database, intentName: string) => {
  await db.prepare('UPDATE intents SET hit_count = hit_count + 1, updated_at = ? WHERE name = ?')
    .bind(Date.now(), intentName).run()
}
```

---

### Wiring into `llm-router.ts`

Add intent resolution between tier 1 (exact) and LLM call:

```typescript
// After tier 1 exact cache check, before LLM call:

// ── TIER 2: Intent cache ───────────────────────────────────────────────────
if (!exactHit && opts.cache?.db) {
  const resolved = await resolveIntent(userPrompt, {
    db: opts.cache.db,
    complete: opts.intentNormaliser,   // optional tiny LLM for step 3
    intents: await loadIntents(opts.cache.db)
  })

  if (resolved && resolved.confidence >= 0.7) {
    const intentHash = await promptHash('intent', systemPrompt, resolved.intent)
    const intentHit = await opts.cache.db.prepare(
      'SELECT response FROM llm_cache WHERE hash = ? AND ttl > ?'
    ).bind(intentHash, Date.now()).first<{ response: string }>()

    if (intentHit) {
      await recordQuery(opts.cache.db, userPrompt, resolved, true)
      await bumpHitCount(opts.cache.db, resolved.intent)
      return { response: intentHit.response, cached: true, intent: resolved.intent, cost: 0 }
    }

    // Miss — will call LLM, but cache result under intent hash too
    postCallIntentHash = intentHash
    await recordQuery(opts.cache.db, userPrompt, resolved, false)
  }
}

// ── LLM call ──────────────────────────────────────────────────────────────
const response = await complete(prompt, { system: enrichedSystem })

// Cache under BOTH exact hash AND intent hash
if (response && quality > 0.7) {
  await cacheStore(db, exactHash, response, ...)
  if (postCallIntentHash) {
    await cacheStore(db, postCallIntentHash, response, ...)
  }
}
```

---

### Auto-Learning New Intents

The unknown intent log is gold. Every query that falls through to the LLM and gets
a good response is a candidate for a new intent entry.

```typescript
// src/pages/api/intents/learn.ts
// POST /api/intents/learn — run weekly or on demand

export const POST: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env as { DB: D1Database }

  // Find typed queries that: hit LLM, got good quality, no intent match
  const unknowns = await env.DB.prepare(`
    SELECT raw, COUNT(*) as frequency
    FROM intent_queries
    WHERE intent IS NULL
      AND cached = 0
      AND ts > ?
    GROUP BY raw
    HAVING frequency >= 3
    ORDER BY frequency DESC
    LIMIT 50
  `).bind(Date.now() - 7 * 86_400_000).all<{ raw: string; frequency: number }>()

  // These are your most common unrecognised queries
  // Return them for human review OR auto-cluster with LLM
  return Response.json({ unknowns: unknowns.results })
}
```

Every week, review the unknown queries. The top ones become new intent entries.
You add keywords. They immediately start hitting the cache. The system gets smarter.

---

### Seeding from Buttons

```typescript
// At app startup / when chat UI loads
import { seedIntents } from '@/engine/intent'

await seedIntents(env.DB, [
  {
    name: 'refund-policy',
    label: 'Return Policy',
    keywords: ['return', 'refund', 'money back', 'exchange', 'send back']
  },
  {
    name: 'shipping-info',
    label: 'Shipping Info',
    keywords: ['ship', 'deliver', 'arrival', 'dispatch', 'when will', 'tracking']
  },
  {
    name: 'order-tracking',
    label: 'Track My Order',
    keywords: ['track', 'where is', 'order status', 'order number']
  },
  {
    name: 'cancellation',
    label: 'Cancel Order',
    keywords: ['cancel', 'stop', 'end subscription', 'dont want']
  },
  {
    name: 'human-handoff',
    label: 'Talk to Someone',
    keywords: ['human', 'person', 'agent', 'speak to', 'talk to', 'real person']
  },
])
// Done. Every button and every typed variation now routes to the same cache entry.
```

---

## The Flow in Production

```
Day 1: Buttons seeded. 5 intents in D1.

User clicks "Return Policy"
  → exact cache miss (first time)
  → LLM called: "Our return policy is 30 days..."
  → cached under: exact hash + intent hash "refund-policy"
  → 1 LLM call, $0.002

User clicks "Return Policy" again
  → exact hash hit → instant → $0

User types "how do I return this"
  → exact hash miss
  → keyword match: "return" → "refund-policy" intent
  → intent hash hit → instant → $0

User types "I want a refund"
  → exact hash miss
  → keyword match: "refund" → "refund-policy" intent
  → intent hash hit → instant → $0

User types "can I send this back"
  → exact hash miss
  → keyword match: "send back" → "refund-policy" intent
  → intent hash hit → instant → $0

Day 7: 200 users asked about returns. 199 cache hits. 1 LLM call.
```

---

## What This Adds to the Cost Curve

From `plan-llm-routing.md` Act 5 (200 signals, 20 unique prompts cycling):

```
Without intent cache:  80% cache hit rate  (only catches exact repeats)
With intent cache:     95%+ cache hit rate  (catches variations too)
```

The delta is all the typed variations that would have been cache misses.
For a real support bot where users type freely, this is the difference between
"caching helps sometimes" and "caching eliminates 95% of LLM calls".

---

## Build Checklist

```
[ ] migrations/0005_intents.sql          — intents + intent_queries tables
[ ] src/engine/intent.ts                 — resolveIntent, seedIntents, loadIntents (~120 lines)
[ ] src/engine/llm-router.ts             — add tier 2 intent resolution (~30 lines)
[ ] src/pages/api/intents/seed.ts        — POST to seed from button config
[ ] src/pages/api/intents/learn.ts       — GET unknown queries for review
[ ] src/pages/api/intents/stats.ts       — GET hit rates per intent
```

**Total: ~200 lines. One migration. No architecture changes.**

Depends on: [plan-llm-routing.md](plan-llm-routing.md) (tier 1 exact cache)
Extends: [plan-receivers.md](plan-receivers.md) Plan A (api wrappers needed for chat UI buttons)

---

## The Elegant Thing

You already know your intents. They're your buttons.
Every button is an intent. Every intent is a cache bucket.
Every typed message maps to a bucket — or discovers a new one.

The system doesn't need to understand language. It needs to recognise patterns.
The patterns come from your users. The cache grows from real traffic.
After one week, the most common questions cost $0 and answer in 0ms.

---

*See also: [plan-llm-routing.md](plan-llm-routing.md) — tier 1 exact cache*
*[receivers.md](receivers.md) — where chat fits in the routing graph*
*[speed.md](speed.md) — measured latency at each layer*
