import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BrandHighway {
  brand: string
  strength: number
  target: { thingId?: string; groupId?: string }
}

interface BrandHighwaysResponse {
  highways: BrandHighway[]
  threshold: number
}

interface Props {
  limit?: number
  onApply?: (brand: string, target: { thingId?: string; groupId?: string }) => void
}

export function BrandHighways({ limit = 5, onApply }: Props) {
  const [data, setData] = useState<BrandHighwaysResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/brand/highways?limit=${limit}`)
      .then((r) => r.json())
      .then((json: BrandHighwaysResponse) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular brands</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading suggestions…</p>
        </CardContent>
      </Card>
    )
  }

  const highways = data?.highways ?? []
  const threshold = data?.threshold ?? 20

  if (highways.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular brands</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No brand highways yet — keep rendering.</p>
        </CardContent>
      </Card>
    )
  }

  function targetLabel(target: BrandHighway['target']): string {
    if (target.thingId) return `→ thing:${target.thingId}`
    if (target.groupId) return `→ group:${target.groupId}`
    return '→ global'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular brands</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <ul className="space-y-1">
          {highways.map((hw) => (
            <li
              key={`${hw.brand}:${hw.target.thingId ?? hw.target.groupId ?? 'global'}`}
              onClick={() => onApply?.(hw.brand, hw.target)}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                'border border-transparent hover:border-border hover:bg-muted',
                onApply && 'cursor-pointer',
              )}
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{hw.brand}</span>
                <span className="text-xs text-muted-foreground">{targetLabel(hw.target)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Badge variant="secondary">{hw.strength}</Badge>
                {hw.strength >= threshold && (
                  <Badge variant="outline" className="text-xs">
                    proven
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
