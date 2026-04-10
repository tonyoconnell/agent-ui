/**
 * GET /api/entity/:id — Single unit or group profile
 *
 * Returns: { kind, spec, stats, wallet, recentSignals[] }
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type EntityResponse = {
  kind: 'unit' | 'group' | 'not-found'
  id: string
  spec?: {
    name: string
    kind?: string
    type?: string
    model?: string
    systemPrompt?: string
    generation?: number
    tags?: string[]
  }
  stats?: {
    successRate?: number
    balance?: number
    reputation?: number
    sampleCount?: number
    lastSignalAt?: string
    wallet?: string
    members?: number
  }
  recentSignals?: Array<{
    id: string
    from: string
    to: string
    skill?: string
    outcome: string
    revenue: number
    ts: string
  }>
}

export const GET: APIRoute = async ({ params }): Promise<Response> => {
  const id = params.id as string

  if (!id) {
    return Response.json({ kind: 'not-found', id: '' } as EntityResponse, { status: 404 })
  }

  try {
    // Try to find as unit
    const unitRows = await readParsed(`
      match
        $u isa unit, has uid "${id}", has name $name, has unit-kind $k,
          has model $m, has system-prompt $sp, has generation $g,
          has success-rate $sr, has balance $bal, has reputation $rep,
          has sample-count $sc, has wallet $w;
        ?$u has last-used $lu;
      select $name, $k, $m, $sp, $g, $sr, $bal, $rep, $sc, $w, $lu;
    `).catch(() => [])

    if (unitRows.length > 0) {
      const r = unitRows[0]
      const tagRows = await readParsed(`
        match $u isa unit, has uid "${id}", has tag $tag;
        select $tag;
      `).catch(() => [])

      const tags = tagRows.map(tr => tr.tag as string)

      // Recent signals
      const signalRows = await readParsed(`
        match
          $s (sender: $from, receiver: $to) isa signal;
          ($from has uid "${id}") or ($to has uid "${id}");
          $s has ts $ts, has data $data, has amount $amt, has success $ok;
          $from has uid $fid, has name $fn;
          $to has uid $tid, has name $tn;
        sort $ts desc; limit 5;
        select $fid, $fn, $tid, $tn, $data, $amt, $ok, $ts;
      `).catch(() => [])

      const recentSignals = signalRows.map(sr => ({
        id: `${sr.fid}-${sr.tid}-${sr.ts}`,
        from: sr.fn as string,
        to: sr.tn as string,
        skill: (sr.data as string) || '',
        outcome: (sr.ok as boolean) ? 'success' : 'failure',
        revenue: sr.amt as number,
        ts: sr.ts as string,
      }))

      const response: EntityResponse = {
        kind: 'unit',
        id,
        spec: {
          name: r.name as string,
          kind: r.k as string,
          model: r.m as string,
          systemPrompt: r.sp as string,
          generation: r.g as number,
          tags,
        },
        stats: {
          successRate: r.sr as number,
          balance: r.bal as number,
          reputation: r.rep as number,
          sampleCount: r.sc as number,
          lastSignalAt: r.lu as string,
          wallet: r.w as string,
        },
        recentSignals,
      }

      return Response.json(response, {
        headers: { 'Cache-Control': 'public, max-age=1' },
      })
    }

    // Try to find as group
    const groupRows = await readParsed(`
      match
        $g isa group, has gid "${id}", has name $name, has group-type $type;
      select $name, $type;
    `).catch(() => [])

    if (groupRows.length > 0) {
      const r = groupRows[0]

      // Member count
      const memberRows = await readParsed(`
        match (group: $g, member: $m) isa membership;
        $g has gid "${id}";
        select $m;
      `).catch(() => [])

      const response: EntityResponse = {
        kind: 'group',
        id,
        spec: {
          name: r.name as string,
          type: r.type as string,
        },
        stats: {
          members: memberRows.length,
        },
      }

      return Response.json(response, {
        headers: { 'Cache-Control': 'public, max-age=1' },
      })
    }

    // Not found
    return Response.json({ kind: 'not-found', id } as EntityResponse, { status: 404 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { kind: 'not-found', id, error: message } as EntityResponse,
      { status: 404 }
    )
  }
}
