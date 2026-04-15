import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type UnitRow = {
  uid: string
  name: string
  kind?: string
  status?: string
  successRate?: number
}

interface Props {
  groupId: string
  onSelect: (uid: string) => void
}

function parseRows(raw: unknown): UnitRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const r = item as Record<string, unknown>
    const rate = Number(r.successRate)
    return {
      uid: String(r.uid ?? ''),
      name: String(r.name ?? ''),
      kind: r.kind != null ? String(r.kind) : undefined,
      status: r.status != null ? String(r.status) : undefined,
      successRate: Number.isFinite(rate) ? rate : undefined,
    }
  })
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          {[0, 1, 2, 3, 4].map((j) => (
            <TableCell key={j}>
              <div className="h-4 rounded bg-muted animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function ActorsTable({ groupId: _groupId, onSelect }: Props) {
  const [rows, setRows] = useState<UnitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/export/units')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = (await res.json()) as unknown
        if (!cancelled) {
          setRows(parseRows(raw))
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load actors')
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>UID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Success Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-destructive py-6">
                {error}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                No actors found
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.uid} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(row.uid)}>
                <TableCell className="font-mono text-xs text-muted-foreground">{row.uid}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.kind ?? '—'}</TableCell>
                <TableCell>
                  {row.status != null ? (
                    <span
                      className={
                        row.status === 'active'
                          ? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-500'
                          : 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground'
                      }
                    >
                      {row.status}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.successRate != null ? `${(row.successRate * 100).toFixed(0)}%` : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
