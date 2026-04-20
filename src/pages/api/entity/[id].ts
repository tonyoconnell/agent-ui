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
  const id = decodeURIComponent(params.id as string).replace(/["\\]/g, '')

  if (!id) {
    return Response.json({ kind: 'not-found', id: '' } as EntityResponse, { status: 404 })
  }

  try {
    // Stage 1a — core required attrs only (name + uid)
    const unitRows = await readParsed(`
      match
        $u isa unit, has uid "${id}", has name $name;
      select $name;
    `).catch(() => [])

    if (unitRows.length > 0) {
      // Stage 1b — optional attrs, each in its own query to survive missing data
      const [kindRows, modelRows, spRows, genRows, srRows, balRows, repRows, scRows, walletRows, luRows] =
        await Promise.all([
          readParsed(`match $u isa unit, has uid "${id}", has unit-kind $k; select $k;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has model $m; select $m;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has system-prompt $sp; select $sp;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has generation $g; select $g;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has success-rate $sr; select $sr;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has balance $bal; select $bal;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has reputation $rep; select $rep;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has sample-count $sc; select $sc;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has wallet $w; select $w;`).catch(() => []),
          readParsed(`match $u isa unit, has uid "${id}", has last-used $lu; select $lu;`).catch(() => []),
        ])

      const r = {
        name: unitRows[0].name,
        k: kindRows[0]?.k,
        m: modelRows[0]?.m,
        sp: spRows[0]?.sp,
        g: genRows[0]?.g,
        sr: srRows[0]?.sr,
        bal: balRows[0]?.bal,
        rep: repRows[0]?.rep,
        sc: scRows[0]?.sc,
        w: walletRows[0]?.w,
        lu: luRows[0]?.lu,
      }

      const tagRows = await readParsed(`
        match $u isa unit, has uid "${id}", has tag $tag;
        select $tag;
      `).catch(() => [])

      const tags = tagRows.map((tr) => tr.tag as string)

      // Recent signals — split sender/receiver queries (TypeDB 3.x OR syntax unreliable)
      const [senderRows, receiverRows] = await Promise.all([
        readParsed(`
          match
            $s (sender: $from, receiver: $to) isa signal;
            $from has uid "${id}";
            $s has ts $ts, has data $data, has amount $amt, has success $ok;
            $from has uid $fid, has name $fn;
            $to has uid $tid, has name $tn;
          sort $ts desc; limit 5;
          select $fid, $fn, $tid, $tn, $data, $amt, $ok, $ts;
        `).catch(() => []),
        readParsed(`
          match
            $s (sender: $from, receiver: $to) isa signal;
            $to has uid "${id}";
            $s has ts $ts, has data $data, has amount $amt, has success $ok;
            $from has uid $fid, has name $fn;
            $to has uid $tid, has name $tn;
          sort $ts desc; limit 5;
          select $fid, $fn, $tid, $tn, $data, $amt, $ok, $ts;
        `).catch(() => []),
      ])

      const seen = new Set<string>()
      const signalRows = [...senderRows, ...receiverRows]
        .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
        .filter((row) => {
          const key = `${row.fid}-${row.tid}-${row.ts}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 5)

      const recentSignals = signalRows.map((row) => ({
        id: `${row.fid}-${row.tid}-${row.ts}`,
        from: row.fn as string,
        to: row.tn as string,
        skill: (row.data as string) || '',
        outcome: (row.ok as boolean) ? 'success' : 'failure',
        revenue: row.amt as number,
        ts: row.ts as string,
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
    return Response.json({ kind: 'not-found', id, error: message } as EntityResponse, { status: 404 })
  }
}
