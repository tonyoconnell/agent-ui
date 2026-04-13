/**
 * Intent Cache — two-tier semantic cache for chat applications.
 *
 * The insight: buttons define your intents. Typed text maps to them.
 * "return policy" and "how do I return this" are the same question.
 * One LLM call. One cache entry. Served to everyone who asks — however they ask.
 *
 * Tier 1 (exact): SHA-256 hash → D1  (buttons always hit here)
 * Tier 2 (intent): keyword → intent name → intent hash → D1
 *
 * Three-step resolver (escalating cost):
 *   1. Keyword match    0ms   $0.000  handles ~80% of typed queries
 *   2. TypeDB registry  <5ms  $0.000  handles known patterns
 *   3. LLM normaliser   50ms  $0.0001 handles the rest
 */

export interface Intent {
  name: string // 'refund-policy'
  label: string // 'Return Policy'
  keywords: string[] // ['return', 'refund', 'money back']
  examples?: string[] // typed queries that mapped here (auto-learned)
}

export interface ResolveResult {
  intent: string
  resolver: 'exact' | 'keyword' | 'typedb' | 'llm' | 'unknown'
  confidence: number // 0.0–1.0
}

// ── Resolver ────────────────────────────────────────────────────────────────

/**
 * Resolve a typed query to a canonical intent name.
 * Returns null if genuinely unknown — caller falls through to full LLM.
 */
export const resolveIntent = async (
  input: string,
  opts: {
    db?: D1Database
    complete?: (prompt: string) => Promise<string>
    intents?: Intent[]
  } = {},
): Promise<ResolveResult | null> => {
  const lower = input.toLowerCase().trim()
  const words = lower.split(/\W+/).filter((w) => w.length > 2)

  // ── Step 1: Keyword match ─────────────────────────────────────────────────
  const intents = opts.intents ?? (await loadIntents(opts.db))

  for (const intent of intents) {
    // Label match: button text clicked (or typed) exactly
    if (lower === intent.label.toLowerCase()) {
      return { intent: intent.name, resolver: 'keyword', confidence: 0.95 }
    }

    const kws = intent.keywords.map((k) => k.toLowerCase())
    const matches = kws.filter((kw) => lower.includes(kw))

    // Two keyword hits → high confidence
    if (matches.length >= 2) {
      return { intent: intent.name, resolver: 'keyword', confidence: 0.85 }
    }
    // Single keyword hit — any intent size
    if (matches.length === 1) {
      return { intent: intent.name, resolver: 'keyword', confidence: 0.7 }
    }
  }

  // ── Step 2: TypeDB keyword registry ──────────────────────────────────────
  // Broader word-level match against TypeDB intent graph
  for (const word of words) {
    try {
      // Dynamic import so this file compiles fine without typedb in scope
      const { readParsed } = await import('@/lib/typedb')
      const rows = await readParsed(`
        match $i isa intent, has keyword "${word}", has name $n, has confidence $c;
        select $n, $c; sort $c desc; limit 1;
      `)
      if (rows.length > 0) {
        return {
          intent: rows[0].n as string,
          resolver: 'typedb',
          confidence: rows[0].c as number,
        }
      }
    } catch {
      /* TypeDB unavailable — continue to step 3 */
    }
  }

  // ── Step 3: LLM normaliser ────────────────────────────────────────────────
  // Tiny prompt: pick the closest intent name, or "unknown"
  if (!opts.complete || intents.length === 0) return null

  const intentList = intents.map((i) => `${i.name}: ${i.label}`).join('\n')
  try {
    const raw = await opts.complete(
      `Map this user message to the closest intent name. Reply with ONLY the intent name, nothing else. If none match well, reply "unknown".

Known intents:
${intentList}

User message: "${input}"`,
    )
    const resolved = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
    if (resolved === 'unknown' || !intents.find((i) => i.name === resolved)) return null
    return { intent: resolved, resolver: 'llm', confidence: 0.75 }
  } catch {
    return null
  }
}

// ── Intent management ────────────────────────────────────────────────────────

export const loadIntents = async (db?: D1Database): Promise<Intent[]> => {
  if (!db) return []
  const rows = await db
    .prepare('SELECT name, label, keywords, examples FROM intents ORDER BY hit_count DESC')
    .all<{ name: string; label: string; keywords: string; examples: string | null }>()
  return (rows.results ?? []).map((r) => ({
    name: r.name,
    label: r.label,
    keywords: JSON.parse(r.keywords) as string[],
    examples: r.examples ? (JSON.parse(r.examples) as string[]) : undefined,
  }))
}

/**
 * Seed intents from your button config.
 * Preserves existing hit_count — safe to call on every startup.
 *
 * @example
 * await seedIntents(env.DB, [
 *   { name: 'refund-policy', label: 'Return Policy',
 *     keywords: ['return', 'refund', 'money back', 'exchange'] },
 * ])
 */
export const seedIntents = async (db: D1Database, intents: Intent[]) => {
  const now = Date.now()
  for (const i of intents) {
    await db
      .prepare(`
      INSERT OR REPLACE INTO intents (name, label, keywords, examples, hit_count, created_at, updated_at)
      VALUES (?, ?, ?, ?,
        COALESCE((SELECT hit_count FROM intents WHERE name = ?), 0),
        COALESCE((SELECT created_at FROM intents WHERE name = ?), ?),
        ?)
    `)
      .bind(
        i.name,
        i.label,
        JSON.stringify(i.keywords),
        i.examples ? JSON.stringify(i.examples) : null,
        i.name,
        i.name,
        now,
        now,
      )
      .run()
  }
}

export const recordQuery = async (db: D1Database, raw: string, result: ResolveResult | null, cached: boolean) => {
  await db
    .prepare('INSERT INTO intent_queries (raw, intent, resolver, cached, ts) VALUES (?, ?, ?, ?, ?)')
    .bind(raw, result?.intent ?? null, result?.resolver ?? 'unknown', cached ? 1 : 0, Date.now())
    .run()
}

export const bumpHitCount = async (db: D1Database, intentName: string) => {
  await db
    .prepare('UPDATE intents SET hit_count = hit_count + 1, updated_at = ? WHERE name = ?')
    .bind(Date.now(), intentName)
    .run()
}

/**
 * Return the most common unrecognised queries from the past week.
 * Review these to discover new intents (add keywords → immediate cache benefit).
 */
export const unknownQueries = async (
  db: D1Database,
  opts: { limit?: number; minFrequency?: number; since?: number } = {},
): Promise<Array<{ raw: string; frequency: number }>> => {
  const { limit = 50, minFrequency = 3, since = Date.now() - 7 * 86_400_000 } = opts
  const rows = await db
    .prepare(`
    SELECT raw, COUNT(*) as frequency
    FROM intent_queries
    WHERE intent IS NULL AND cached = 0 AND ts > ?
    GROUP BY raw
    HAVING frequency >= ?
    ORDER BY frequency DESC
    LIMIT ?
  `)
    .bind(since, minFrequency, limit)
    .all<{ raw: string; frequency: number }>()
  return rows.results ?? []
}
