/**
 * GET /api/stream — Server-Sent Events for realtime substrate state
 *
 * Streams: highways, stats, tick results
 * Interval: 2 seconds
 *
 * Usage: const es = new EventSource('/api/stream')
 *        es.addEventListener('state', e => JSON.parse(e.data))
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let interval: ReturnType<typeof setInterval> | null = null
      let timeout: ReturnType<typeof setTimeout> | null = null

      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
          cleanup()
        }
      }

      const cleanup = () => {
        closed = true
        if (interval) clearInterval(interval)
        if (timeout) clearTimeout(timeout)
      }

      // Fetch and stream state
      const tick = async () => {
        if (closed) return
        try {
          const [edges, units, skills] = await Promise.all([
            readParsed(`
              match $e (source: $from, target: $to) isa path,
                has strength $s, has resistance $r, has traversals $t, has revenue $rev;
              $from has uid $fid; $to has uid $tid;
              sort $s desc; limit 50;
              select $fid, $tid, $s, $r, $t, $rev;
            `).catch(() => []),
            readParsed(`
              match $u isa unit, has uid $id, has name $name, has status $st, has success-rate $sr;
              select $id, $name, $st, $sr;
            `).catch(() => []),
            readParsed(`
              match $s isa skill, has gid $gid, has name $name, has price $p, has tag $tag;
              select $gid, $name, $p, $tag;
            `).catch(() => []),
          ])

          type R = Record<string, unknown>

          const highways = (edges as R[])
            .filter((e) => (e.s as number) >= 30)
            .map((e) => ({
              from: e.fid as string,
              to: e.tid as string,
              strength: e.s as number,
              resistance: e.r as number,
              traversals: e.t as number,
              revenue: e.rev as number,
            }))

          const stats = {
            units: (units as R[]).length,
            highways: highways.length,
            edges: (edges as R[]).length,
            skills: (skills as R[]).length,
            revenue: (edges as R[]).reduce((sum, e) => sum + ((e.rev as number) || 0), 0),
            proven: (units as R[]).filter((u) => u.st === 'proven').length,
          }

          send('state', { highways, stats, units, ts: Date.now() })
        } catch {
          send('error', { message: 'TypeDB query failed', ts: Date.now() })
        }
      }

      // Initial heartbeat
      send('connected', { ts: Date.now() })

      // Run tick immediately then every 2 seconds
      tick()
      interval = setInterval(tick, 2000)

      // Clean up after 5 minutes
      timeout = setTimeout(
        () => {
          send('close', { reason: 'timeout', ts: Date.now() })
          cleanup()
          try {
            controller.close()
          } catch {
            /* already closed */
          }
        },
        5 * 60 * 1000,
      )
    },
    cancel() {
      // Browser closed connection
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
