import type { APIRoute } from 'astro'
import { read } from '@/lib/typedb'

const CLAIM_TTL_MS = 30 * 60 * 1000

export const GET: APIRoute = async () => {
  const q = `match $t isa task, has task-status "active", has owner $o, has claimed-at $c; select $t, $o, $c;`
  const rows = (await read(q)) as Array<{ t: string; o: string; c: string }>
  const expired = []
  const now = new Date()

  for (const row of rows) {
    const claimedAt = new Date(row.c)
    const age = now.getTime() - claimedAt.getTime()
    if (age > CLAIM_TTL_MS) {
      const idResult = (await read(`match $t isa task, has task-id $id; ${row.t}; select $id;`)) as Array<{
        id: string
      }>
      const release = `match $t = ${row.t}; delete task-status of $t; delete owner of $t; delete claimed-at of $t; insert $t has task-status "open";`
      await read(release)
      expired.push({ id: idResult[0]?.id || '', owner: row.o, releasedAt: now.toISOString() })
    }
  }

  return new Response(JSON.stringify({ expired, count: expired.length }), { status: 200 })
}
