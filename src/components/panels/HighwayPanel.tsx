import type { Edge } from '@/engine'

interface HighwayPanelProps {
  highways: Edge[] // Array of { path: string, strength: number }
}

export function HighwayPanel({ highways }: HighwayPanelProps) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="text-sm text-muted-foreground uppercase mb-3">Highways</h3>
      <div className="space-y-2">
        {highways.map(({ path, strength }) => (
          <div key={path} className="flex items-center gap-3">
            <div className="flex-1">
              <code className="text-xs text-muted-foreground">{path}</code>
            </div>
            <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--color-primary-bright))] rounded-full"
                style={{ width: `${Math.min(strength, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-12 text-right">{strength.toFixed(0)}</span>
          </div>
        ))}
        {highways.length === 0 && <div className="text-xs text-muted-foreground">No highways yet</div>}
      </div>
    </div>
  )
}
