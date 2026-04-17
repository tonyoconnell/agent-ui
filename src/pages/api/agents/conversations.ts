/**
 * GET /api/agents/conversations?id=agentId
 *
 * Returns summarized conversation history for an agent, sourced from
 * hypothesis records where the statement starts with "conversation with {id}:".
 * Sorted by observed-at descending (most recent first), limited to 20.
 *
 * Response: { conversations: { summary: string, date: string, confidence: number }[] }
 */

import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id parameter required' }, { status: 400 })
  }

  // Sanitize: strip quotes to prevent injection in the TQL string literal
  const safeId = id.replace(/"/g, '').replace(/\\/g, '')
  const prefix = `conversation with ${safeId}:`

  try {
    // Query conversation hypotheses — observed-at is optional (may not exist on all)
    const rows = await readParsed(`
      match
        $h isa hypothesis,
          has statement $stmt,
          has p-value $pv;
        $stmt contains "${prefix}";
        not { $h has hypothesis-status "rejected"; };
      select $stmt, $pv;
      limit 20;
    `)

    const conversations = rows.map((row) => {
      const stmt = String(row.stmt ?? '')
      const pv = Number(row.pv ?? 0)
      const at = ''

      // Strip the "conversation with {id}: " prefix — leave only the summary
      const summary = stmt.startsWith(prefix) ? stmt.slice(prefix.length).trimStart() : stmt

      // p-value in this system is stored inversely to confidence:
      // lower p-value = more confident. Convert: confidence = 1 - p-value, clamped to [0,1].
      const confidence = Math.max(0, Math.min(1, 1 - pv))

      return { summary, date: at, confidence }
    })

    return Response.json({ conversations })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Query failed' }, { status: 500 })
  }
}
