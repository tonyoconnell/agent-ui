import { Handle, type NodeProps, Position } from '@xyflow/react'
import type { Role } from '@/lib/org-roster'

/**
 * RoleNode — a single role card for the OrgChartView.
 *
 * Accent → HSL token mapping uses the dev.one.ie palette
 * (see src/styles/global.css). Chairman is gold (secondary-bright),
 * CEO is blue (primary-bright), domain accents are layered with
 * tertiary-bright + warning tones via inline HSL.
 */

const ACCENT_HSL: Record<NonNullable<Role['accent']>, string> = {
  gold: '45 90% 60%',
  blue: '216 60% 68%',
  rose: '340 75% 65%',
  amber: '35 90% 60%',
  teal: '170 60% 50%',
  violet: '270 60% 70%',
  slate: '219 18% 65%',
}

const TIER_RING: Record<Role['tier'], number> = {
  chairman: 32,
  ceo: 24,
  director: 18,
  specialist: 12,
}

const TIER_LABEL: Record<Role['tier'], string> = {
  chairman: 'Chairman',
  ceo: 'CEO',
  director: 'Director',
  specialist: 'Specialist',
}

interface RoleNodeData extends Role {
  isRoot?: boolean
  isLeaf?: boolean
  [key: string]: unknown
}

export function RoleNode({ data }: NodeProps) {
  const d = data as RoleNodeData
  const hsl = ACCENT_HSL[d.accent ?? 'slate']
  const ring = TIER_RING[d.tier]
  const isChairman = d.tier === 'chairman'
  const isCeo = d.tier === 'ceo'
  const isDirector = d.tier === 'director'

  const width = isChairman ? 220 : isCeo ? 210 : isDirector ? 200 : 190

  return (
    <div
      className="select-none rounded-2xl border backdrop-blur-sm transition-all duration-300"
      style={{
        width,
        background: `linear-gradient(180deg, hsl(var(--color-card)) 0%, hsl(${hsl} / 0.05) 100%)`,
        borderColor: `hsl(${hsl} / 0.55)`,
        boxShadow: `
          0 0 0 1px hsl(${hsl} / 0.15),
          0 0 ${ring}px hsl(${hsl} / 0.32),
          0 6px 24px hsl(0 0% 0% / 0.25)
        `,
      }}
    >
      {!d.isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: 9,
            height: 9,
            background: `hsl(${hsl})`,
            border: '2px solid hsl(var(--color-background))',
            top: -5,
          }}
        />
      )}
      {!d.isLeaf && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: 9,
            height: 9,
            background: `hsl(${hsl})`,
            border: '2px solid hsl(var(--color-background))',
            bottom: -5,
          }}
        />
      )}

      {/* Header band */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2 border-b"
        style={{ borderColor: `hsl(${hsl} / 0.18)` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-lg leading-none"
            style={{
              color: `hsl(${hsl})`,
              textShadow: `0 0 12px hsl(${hsl} / 0.6)`,
            }}
          >
            {d.icon ?? '◆'}
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">{d.title}</span>
        </div>
        <span
          className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-full"
          style={{
            color: `hsl(${hsl})`,
            background: `hsl(${hsl} / 0.12)`,
            border: `1px solid hsl(${hsl} / 0.22)`,
          }}
        >
          {TIER_LABEL[d.tier]}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {d.tagline && (
          <p
            className="text-[11px] leading-snug text-muted-foreground mb-2"
            style={{ color: 'hsl(var(--color-muted-foreground))' }}
          >
            {d.tagline}
          </p>
        )}

        <div className="text-[9px] font-mono tracking-tight mb-2 truncate" style={{ color: `hsl(${hsl})` }}>
          {d.uid}
        </div>

        {d.skills && d.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.skills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: `hsl(${hsl})`,
                  background: `hsl(${hsl} / 0.08)`,
                  border: `1px solid hsl(${hsl} / 0.18)`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
