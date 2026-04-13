/**
 * GET /api/channels — Channel throughput stats
 *
 * Returns: Array<{ name, perDay, lastSignalAt }>
 * Caching: 5s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type ChannelStat = {
  name: string
  perDay: number
  lastSignalAt: string | null
}

export const GET: APIRoute = async () => {
  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Count signals in last 24 hours, grouped by sender/receiver pair
    // This approximates "channels" as primary communication paths
    const signalRows = await readParsed(`
      match
        $s (sender: $from, receiver: $to) isa signal, has ts $ts, has success $ok;
        $from has uid $fid, has name $fn;
        $to has uid $tid, has name $tn;
      select $fid, $fn, $tid, $tn, $ts, $ok;
    `).catch(() => [])

    const channels: Record<string, { count: number; lastAt: string }> = {}

    for (const r of signalRows) {
      const ts = new Date(r.ts as string)
      const _channelName = `${r.fn as string} → ${r.tn as string}`
      const channelKey = `${r.fid}-${r.tid}`

      if (!channels[channelKey]) {
        channels[channelKey] = { count: 0, lastAt: r.ts as string }
      }

      // Only count signals from last 24 hours
      if (ts >= oneDayAgo) {
        channels[channelKey].count++
      }

      // Update lastAt if this signal is more recent
      if ((r.ts as string) > channels[channelKey].lastAt) {
        channels[channelKey].lastAt = r.ts as string
      }
    }

    // Convert to response format
    const stats: ChannelStat[] = Object.entries(channels)
      .map(([key, data]) => {
        // Reconstruct channel name from signals
        const sig = signalRows.find((r) => `${r.fid}-${r.tid}` === key)
        return {
          name: sig ? `${sig.fn as string} → ${sig.tn as string}` : key,
          perDay: data.count,
          lastSignalAt: data.lastAt,
        }
      })
      .sort((a, b) => b.perDay - a.perDay)
      .slice(0, 50) // Top 50 channels

    return Response.json(stats, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
