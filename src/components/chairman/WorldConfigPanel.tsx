/**
 * WorldConfigPanel — chairman/ceo tunes sensitivity, fade-rate, toxicity-threshold.
 *
 * Reads GET /api/world-config on mount. POSTs on slider release (commit).
 * Uses cookie-based session auth — no Bearer token required from the client.
 */
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { emitClick } from '@/lib/ui-signal'

interface Config {
  gid: string
  sensitivity: number
  fadeRate: number
  toxicityThreshold: number
}

const DEFAULT_GID = 'one'

export function WorldConfigPanel({ gid = DEFAULT_GID }: { gid?: string }) {
  const [cfg, setCfg] = useState<Config | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/world-config?gid=${encodeURIComponent(gid)}`, { credentials: 'same-origin' })
      .then((r) => r.json() as Promise<Config>)
      .then((data) => {
        if (!cancelled) setCfg(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'load failed')
      })
    return () => {
      cancelled = true
    }
  }, [gid])

  const save = useCallback(
    async (patch: Partial<Pick<Config, 'sensitivity' | 'fadeRate' | 'toxicityThreshold'>>) => {
      setPending(true)
      setError(null)
      try {
        const res = await fetch('/api/world-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ gid, ...patch }),
        })
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(j.error ?? `HTTP ${res.status}`)
        }
        setCfg((prev) => (prev ? { ...prev, ...patch } : prev))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'save failed')
      } finally {
        setPending(false)
      }
    },
    [gid],
  )

  if (!cfg) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-font">World Config</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Loading…</CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-font">
          <span>World Config</span>
          {pending ? (
            <Badge variant="secondary" className="bg-muted text-font">
              saving…
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <div className="text-destructive text-sm">{error}</div> : null}

        <Knob
          label="Sensitivity"
          hint="explore ↔ exploit (0 random, 1 greedy)"
          min={0}
          max={1}
          step={0.05}
          value={cfg.sensitivity}
          precision={2}
          onCommit={(v) => {
            emitClick('ui:chairman:tune-sensitivity', { value: v })
            save({ sensitivity: v })
          }}
        />

        <Knob
          label="Fade rate"
          hint="L3 decay per tick (0 never fades, 1 fades fast)"
          min={0}
          max={1}
          step={0.01}
          value={cfg.fadeRate}
          precision={2}
          onCommit={(v) => {
            emitClick('ui:chairman:tune-fade-rate', { value: v })
            save({ fadeRate: v })
          }}
        />

        <Knob
          label="Toxicity threshold"
          hint="resistance count at which a path becomes toxic"
          min={0}
          max={50}
          step={1}
          value={cfg.toxicityThreshold}
          precision={0}
          onCommit={(v) => {
            emitClick('ui:chairman:tune-toxicity-threshold', { value: v })
            save({ toxicityThreshold: v })
          }}
        />
      </CardContent>
    </Card>
  )
}

interface KnobProps {
  label: string
  hint: string
  min: number
  max: number
  step: number
  value: number
  precision: number
  onCommit: (v: number) => void
}

function Knob({ label, hint, min, max, step, value, precision, onCommit }: KnobProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-foreground">{label}</label>
        <span className="text-sm text-muted-foreground font-mono">{local.toFixed(precision)}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[local]}
        onValueChange={(vs) => setLocal(vs[0] ?? local)}
        onValueCommit={(vs) => onCommit(vs[0] ?? local)}
      />
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  )
}
