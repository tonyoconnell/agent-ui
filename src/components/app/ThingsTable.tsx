import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type SkillRow = { skillId: string; name?: string; price?: number; tags?: string[] }

interface Props {
  groupId: string
  onSelect: (uid: string) => void
}

function parseSkillRows(raw: unknown): SkillRow[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const obj = item as Record<string, unknown>
    if (typeof obj.skillId !== 'string') return []
    const row: SkillRow = { skillId: obj.skillId }
    if (typeof obj.name === 'string') row.name = obj.name
    if (typeof obj.price === 'number') row.price = obj.price
    if (Array.isArray(obj.tags)) {
      row.tags = obj.tags.filter((t): t is string => typeof t === 'string')
    }
    return [row]
  })
}

export function ThingsTable({ groupId: _groupId, onSelect }: Props) {
  const [rows, setRows] = useState<SkillRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/export/skills')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<unknown>
      })
      .then((data) => {
        if (!cancelled) {
          setRows(parseSkillRows(data))
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load skills')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading skills...</div>
  }

  if (error) {
    return <div className="p-4 text-sm text-destructive">Error: {error}</div>
  }

  if (rows.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No skills found.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.skillId}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelect(row.skillId)}
          >
            <TableCell className="font-mono text-xs">{row.skillId}</TableCell>
            <TableCell>{row.name ?? '—'}</TableCell>
            <TableCell>{row.price !== undefined ? `$${row.price}` : 'free'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(row.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
