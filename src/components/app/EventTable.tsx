import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { sdk } from '@/lib/sdk'
import { cn } from '@/lib/utils'

interface Props {
  groupId: string
}

type SignalRow = {
  sender: string
  receiver: string
  data: string
  success: boolean
  ts: number
}

function formatTime(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function parseRow(item: Record<string, unknown>): SignalRow {
  return {
    sender: String(item.sender ?? '—'),
    receiver: String(item.receiver ?? '—'),
    data: JSON.stringify(item.data ?? '').slice(0, 60),
    success: Boolean(item.success),
    ts: Number(item.ts ?? 0),
  }
}

export function EventTable({ groupId: _groupId }: Props) {
  const [events, setEvents] = useState<SignalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchEvents() {
      try {
        const raw = await sdk.signals({ limit: 50 })
        const rows = (raw as unknown as Record<string, unknown>[])
          .map(parseRow)
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 50)
        if (active) {
          setEvents(rows)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'fetch failed')
          setLoading(false)
        }
      }
    }

    fetchEvents()
    const id = setInterval(fetchEvents, 3000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Signal Events</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {loading && events.length === 0 && <p className="text-slate-500 text-sm px-1">Loading signals...</p>}
      {error && <p className="text-red-400 text-sm px-1">{error}</p>}

      <div className="overflow-auto rounded-md border border-border flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Time</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-16 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No events yet
                </TableCell>
              </TableRow>
            ) : (
              events.map((row, i) => (
                <TableRow key={`${row.ts}-${i}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatTime(row.ts)}</TableCell>
                  <TableCell className="font-mono text-xs">{row.sender}</TableCell>
                  <TableCell className="font-mono text-xs">{row.receiver}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-xs truncate">
                    {row.data}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn('inline-block size-2 rounded-full', row.success ? 'bg-emerald-400' : 'bg-red-400')}
                      title={row.success ? 'success' : 'failed'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
