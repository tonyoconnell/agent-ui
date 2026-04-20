import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const rows = await readParsed(`
    match $s isa signal, has receiver $r, has created-at $t;
    $r like "security:gate:%";
    $t > ${since};
    select $r, $t;
  `).catch(() => [] as any[])

  const byGate: Record<string, { total: number; last24h: number }> = {}
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  for (const row of rows as Array<Record<string, string>>) {
    const gate = (row.r as string).replace('security:gate:', '')
    if (!byGate[gate]) byGate[gate] = { total: 0, last24h: 0 }
    byGate[gate].total++
    if (new Date(row.t as string).getTime() > now - day) byGate[gate].last24h++
  }

  return Response.json({ ok: true, byGate, since, generatedAt: new Date().toISOString() })
}
