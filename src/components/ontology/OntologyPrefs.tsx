import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import type { TqlAction } from './TqlPreview'

// ─── Label types + helpers ────────────────────────────────────────────────────

export interface LabelAliases {
  groups: string
  people: string
  things: string
  paths: string
  events: string
  insight: string
}

export const DEFAULT_LABELS: LabelAliases = {
  groups: 'groups',
  people: 'people',
  things: 'things',
  paths: 'paths',
  events: 'events',
  insight: 'insight',
}

export function loadLabels(gid: string): LabelAliases {
  if (typeof localStorage === 'undefined') return DEFAULT_LABELS
  const raw = localStorage.getItem(`ontology:labels:${gid}`)
  if (!raw) return DEFAULT_LABELS
  try {
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_LABELS, ...parsed }
  } catch {
    return DEFAULT_LABELS
  }
}

export function saveLabels(gid: string, labels: LabelAliases) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(`ontology:labels:${gid}`, JSON.stringify(labels))
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  gid: string
  isChairman: boolean
  groupName?: string
  sensitivity?: number
  fadeRate?: number
  toxicityThreshold?: number
  onLabelsChange: (labels: LabelAliases) => void
  onTqlAction: (action: TqlAction) => void
  onClose: () => void
}

const DIMENSION_KEYS: (keyof LabelAliases)[] = ['groups', 'people', 'things', 'paths', 'events', 'insight']

const DIMENSION_DISPLAY: Record<keyof LabelAliases, string> = {
  groups: 'Groups',
  people: 'People',
  things: 'Things',
  paths: 'Paths',
  events: 'Events',
  insight: 'Insight',
}

export function OntologyPrefs({
  open,
  gid,
  isChairman,
  groupName,
  sensitivity = 0.5,
  fadeRate = 0.05,
  toxicityThreshold = 10,
  onLabelsChange,
  onTqlAction,
  onClose,
}: Props) {
  // ── Vocabulary state ────────────────────────────────────────────────────────
  const [labels, setLabels] = useState<LabelAliases>(() => loadLabels(gid))

  // ── Group param state ───────────────────────────────────────────────────────
  const [localName, setLocalName] = useState(groupName ?? gid)
  const [localSensitivity, setLocalSensitivity] = useState(sensitivity)
  const [localFadeRate, setLocalFadeRate] = useState(fadeRate)
  const [localToxicity, setLocalToxicity] = useState(toxicityThreshold)

  // Re-seed when props change (e.g. gid switch or server data arrives)
  useEffect(() => {
    setLabels(loadLabels(gid))
  }, [gid])

  useEffect(() => {
    setLocalName(groupName ?? gid)
  }, [groupName, gid])

  useEffect(() => {
    setLocalSensitivity(sensitivity)
  }, [sensitivity])

  useEffect(() => {
    setLocalFadeRate(fadeRate)
  }, [fadeRate])

  useEffect(() => {
    setLocalToxicity(toxicityThreshold)
  }, [toxicityThreshold])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLabelBlur = (key: keyof LabelAliases, value: string) => {
    const trimmed = value.trim() || DEFAULT_LABELS[key]
    const next = { ...labels, [key]: trimmed }
    setLabels(next)
    saveLabels(gid, next)
    onLabelsChange(next)
    emitClick('ui:ontology:label-change', { layer: key, value: trimmed })
  }

  const handleReset = () => {
    emitClick('ui:ontology:label-reset', { gid })
    setLabels(DEFAULT_LABELS)
    saveLabels(gid, DEFAULT_LABELS)
    onLabelsChange(DEFAULT_LABELS)
  }

  const handleRename = () => {
    emitClick('ui:ontology:rename-group', { gid, newName: localName })
    onTqlAction({
      kind: 'rename-group',
      gid,
      oldName: groupName ?? gid,
      newName: localName,
    })
  }

  const handleApplySensitivity = () => {
    emitClick('ui:ontology:set-sensitivity', { gid, sensitivity: localSensitivity })
    onTqlAction({ kind: 'set-sensitivity', gid, sensitivity: localSensitivity })
  }

  const handleApplyFadeRate = () => {
    emitClick('ui:ontology:set-fade-rate', { gid, fadeRate: localFadeRate })
    onTqlAction({ kind: 'set-fade-rate', gid, fadeRate: localFadeRate })
  }

  const handleApplyToxicity = () => {
    emitClick('ui:ontology:set-toxicity-threshold', { gid, threshold: localToxicity })
    onTqlAction({ kind: 'set-toxicity-threshold', gid, threshold: localToxicity })
  }

  // ── Shared element classes ───────────────────────────────────────────────────

  const inputCls = cn(
    'w-full rounded bg-card border border-border px-2 py-1 text-xs text-font',
    'focus:outline-none focus:border-primary-bright transition',
  )

  const actionBtnCls = cn(
    'rounded-md border border-border bg-card px-2 py-1 text-xs text-font',
    'hover:border-primary-bright transition',
  )

  const disabledInputCls = cn(inputCls, 'cursor-not-allowed opacity-50')
  const disabledBtnCls = cn(
    'rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-muted-foreground/60',
    'cursor-not-allowed',
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 h-full w-80 bg-card border-l border-border',
        'z-50 flex flex-col transition-transform duration-200 text-font',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
      aria-hidden={!open}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Customize</span>
        <button
          type="button"
          onClick={() => {
            emitClick('ui:ontology:prefs-close', { gid })
            onClose()
          }}
          className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-font transition"
          aria-label="Close preferences"
        >
          ✕
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto space-y-6 px-3 py-4">
        {/* ── Section 1: Vocabulary ──────────────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <div className="text-xs font-medium text-font">Vocabulary</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">What this group calls each dimension</div>
          </div>

          <div className="space-y-2">
            {DIMENSION_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <label
                  htmlFor={`label-${key}`}
                  className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {DIMENSION_DISPLAY[key]}
                </label>
                <input
                  id={`label-${key}`}
                  type="text"
                  defaultValue={labels[key]}
                  key={`${gid}-${key}-${labels[key]}`}
                  className={inputCls}
                  onBlur={(e) => handleLabelBlur(key, e.currentTarget.value)}
                  aria-label={`Label for ${DIMENSION_DISPLAY[key]} dimension`}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] text-muted-foreground hover:text-primary-bright transition underline underline-offset-2"
          >
            Reset to defaults
          </button>
        </section>

        {/* ── Section 2: Group parameters ───────────────────────────────── */}
        <section className="space-y-3 border-t border-border pt-4">
          <div>
            <div className="text-xs font-medium text-font">Group parameters</div>
            {!isChairman && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Chairman role required to edit. Reading is fine.
              </div>
            )}
          </div>

          {/* Group name */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Group name</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.currentTarget.value)}
                disabled={!isChairman}
                title={!isChairman ? 'Chairman role required' : undefined}
                className={cn('flex-1', isChairman ? inputCls : disabledInputCls)}
                aria-label="Group name"
              />
              <button
                type="button"
                disabled={!isChairman}
                onClick={() => isChairman && handleRename()}
                title={!isChairman ? 'Chairman role required' : 'Rename group'}
                className={isChairman ? actionBtnCls : disabledBtnCls}
                aria-disabled={!isChairman}
              >
                Rename
              </button>
            </div>
          </div>

          {/* Sensitivity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sensitivity</div>
              <span className="text-[10px] text-muted-foreground font-mono">{localSensitivity.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={localSensitivity}
                onChange={(e) => setLocalSensitivity(Number(e.currentTarget.value))}
                disabled={!isChairman}
                title={!isChairman ? 'Chairman role required' : undefined}
                className={cn('flex-1 accent-primary-bright', !isChairman && 'cursor-not-allowed opacity-50')}
                aria-label="Sensitivity"
              />
              <button
                type="button"
                disabled={!isChairman}
                onClick={() => isChairman && handleApplySensitivity()}
                title={!isChairman ? 'Chairman role required' : 'Apply sensitivity'}
                className={isChairman ? actionBtnCls : disabledBtnCls}
                aria-disabled={!isChairman}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Fade rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fade rate</div>
              <span className="text-[10px] text-muted-foreground font-mono">{localFadeRate.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={localFadeRate}
                onChange={(e) => setLocalFadeRate(Number(e.currentTarget.value))}
                disabled={!isChairman}
                title={!isChairman ? 'Chairman role required' : undefined}
                className={cn('flex-1 accent-primary-bright', !isChairman && 'cursor-not-allowed opacity-50')}
                aria-label="Fade rate"
              />
              <button
                type="button"
                disabled={!isChairman}
                onClick={() => isChairman && handleApplyFadeRate()}
                title={!isChairman ? 'Chairman role required' : 'Apply fade rate'}
                className={isChairman ? actionBtnCls : disabledBtnCls}
                aria-disabled={!isChairman}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Toxicity threshold */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Toxicity threshold</div>
              <span className="text-[10px] text-muted-foreground font-mono">{localToxicity}</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={localToxicity}
                onChange={(e) => setLocalToxicity(Number(e.currentTarget.value))}
                disabled={!isChairman}
                title={!isChairman ? 'Chairman role required' : undefined}
                className={cn('flex-1 accent-primary-bright', !isChairman && 'cursor-not-allowed opacity-50')}
                aria-label="Toxicity threshold"
              />
              <button
                type="button"
                disabled={!isChairman}
                onClick={() => isChairman && handleApplyToxicity()}
                title={!isChairman ? 'Chairman role required' : 'Apply toxicity threshold'}
                className={isChairman ? actionBtnCls : disabledBtnCls}
                aria-disabled={!isChairman}
              >
                Apply
              </button>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
