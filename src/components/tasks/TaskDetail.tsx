/**
 * TaskDetail — right-slide detail pane for task inspection.
 * Pattern adapted from src/components/in/EntityDetail.tsx.
 *
 * Structure: sticky HEADER (48px) / scrollable BODY / sticky FOOTER (56px).
 * Every interactive element emits ui:tasks:<action> before the local handler.
 * See .claude/rules/ui.md.
 */

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'
import { inferWave, priorityLabel, rubricAvg } from '@/types/task'
import { PheromoneBar } from './PheromoneBar'
import { RubricRadar } from './RubricRadar'
import type { Task } from './types'
import { WAVES } from './types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  task: Task | null
  onClose: () => void
  onAction?: (action: 'claim' | 'complete' | 'fail' | 'block') => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  open: 'bg-primary-bright/15 text-primary-bright ring-primary-bright/25',
  blocked: 'bg-destructive/15 text-destructive ring-destructive/25',
  picked: 'bg-gold/15 text-gold ring-gold/25',
  done: 'bg-tertiary-bright/15 text-tertiary-bright ring-tertiary-bright/25',
  verified: 'bg-secondary-bright/15 text-secondary-bright ring-secondary-bright/25',
  failed: 'bg-destructive/15 text-destructive ring-destructive/25',
  dissolved: 'bg-muted-foreground/15 text-muted-foreground ring-muted-foreground/25',
}

const PRIORITY_PILL: Record<'P0' | 'P1' | 'P2' | 'P3', string> = {
  P0: 'bg-destructive/15 text-destructive ring-destructive/25',
  P1: 'bg-gold/15 text-gold ring-gold/25',
  P2: 'bg-primary-bright/15 text-primary-bright ring-primary-bright/25',
  P3: 'bg-muted-foreground/15 text-muted-foreground ring-muted-foreground/25',
}

function waveColor(wave: string): string {
  return WAVES.find((w) => w.key === wave)?.color ?? '#64748b'
}

/** Render a 5-dot scale (filled vs hollow). */
function DotScale({ value, max = 5 }: { value: number; max?: number }) {
  // value is 0..1, map to 0..max dots
  const filled = Math.round(value * max)
  return (
    <span className="flex items-center gap-0.5" title={`${filled} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={
            i < filled
              ? 'inline-block w-2 h-2 rounded-full bg-white/70'
              : 'inline-block w-2 h-2 rounded-full bg-white/15'
          }
        />
      ))}
    </span>
  )
}

/** Format an ISO timestamp as relative (<24h) or short date. */
function fmtDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const diffMs = Date.now() - d.getTime()
  const diffH = diffMs / 3_600_000
  if (diffH < 24) {
    const mins = Math.floor(diffMs / 60_000)
    if (mins < 2) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(diffH)}h ago`
  }
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDetail({ task, onClose, onAction }: Props) {
  if (!task) return null

  const wave = task.task_wave ?? inferWave(task.tid)
  const pLabel = priorityLabel(task.task_priority)
  const avg = rubricAvg(task.rubric)

  return (
    <aside
      className="fixed right-0 top-0 h-full z-40 flex flex-col bg-muted border-l border-border text-font
                 w-full sm:w-[400px] transform transition-transform duration-200"
      aria-label="Task detail"
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="h-12 flex-none flex items-center gap-2 px-3 border-b border-border bg-muted sticky top-0 z-10">
        <button
          type="button"
          aria-label="Close detail"
          onClick={() => {
            emitClick('ui:tasks:detail-close', { tid: task.tid })
            onClose()
          }}
          className="flex-none p-1.5 rounded-md text-muted-foreground hover:text-font hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="font-mono text-[11px] text-muted-foreground truncate flex-1">{task.tid}</span>

        {/* Status pill */}
        <button
          type="button"
          onClick={() => emitClick('ui:tasks:status-click', { tid: task.tid, status: task.task_status })}
          className={`flex-none inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 cursor-pointer ${STATUS_PILL[task.task_status] ?? STATUS_PILL.open}`}
        >
          {task.task_status}
        </button>

        {/* Wave badge */}
        {wave && (
          <span
            className="flex-none inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ backgroundColor: `${waveColor(wave)}22`, color: waveColor(wave) }}
          >
            {wave}
          </span>
        )}
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* 1. Title + priority */}
        <section>
          <div className="flex items-start gap-2">
            <h2 className="flex-1 text-base font-semibold text-font leading-snug">{task.name}</h2>
            <span
              className={`flex-none inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${PRIORITY_PILL[pLabel]}`}
            >
              {pLabel}
            </span>
          </div>
        </section>

        {/* 2. Metadata grid */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Metadata</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-muted-foreground mb-0.5">Wave</dt>
              <dd className="text-foreground font-mono">{wave ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Priority</dt>
              <dd className="text-foreground">
                {pLabel} <span className="text-muted-foreground font-mono">({task.task_priority.toFixed(2)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Effort</dt>
              <dd>
                <DotScale value={task.task_effort} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Value</dt>
              <dd>
                <DotScale value={task.task_value} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Variant</dt>
              <dd className="text-foreground font-mono">{task.task_variant ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Owner</dt>
              <dd className="text-foreground truncate">{task.owner ?? 'unassigned'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Started</dt>
              <dd className="text-foreground">{fmtDate(task.started_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-0.5">Verified</dt>
              <dd className="text-foreground">{fmtDate(task.verified_at)}</dd>
            </div>
          </dl>
        </section>

        {/* 3. Rubric */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rubric</h3>
          {task.rubric ? (
            <div className="relative">
              <RubricRadar rubric={task.rubric} />
              <span className="absolute top-0 right-0 text[10px] font-mono text-muted-foreground">avg {avg.toFixed(2)}</span>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground italic">
              Rubric set at W4 verify
            </div>
          )}
        </section>

        {/* 4. Pheromone */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pheromone</h3>
          <PheromoneBar strength={task.strength} resistance={task.resistance} />
        </section>

        {/* 5. Tags */}
        {task.tags.length > 0 && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => emitClick('ui:tasks:tag-click', { tid: task.tid, tag })}
                  className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 6. Exit condition */}
        {task.exit_condition && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exit condition</h3>
            <pre className="rounded-lg bg-background border border-border px-3 py-2 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
              {task.exit_condition}
            </pre>
          </section>
        )}

        {/* 7a. Blocks */}
        {task.blocks.length > 0 && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Blocks ({task.blocks.length})
            </h3>
            <ul className="space-y-1">
              {task.blocks.map((tid) => (
                <li key={tid}>
                  <button
                    type="button"
                    onClick={() => emitClick('ui:tasks:navigate', { tid })}
                    className="font-mono text-[11px] text-primary-bright/80 hover:text-primary-bright transition-colors"
                  >
                    {tid}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7b. Blocked by */}
        {task.blocked_by.length > 0 && (
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Blocked by ({task.blocked_by.length})
            </h3>
            <ul className="space-y-1">
              {task.blocked_by.map((tid) => (
                <li key={tid}>
                  <button
                    type="button"
                    onClick={() => emitClick('ui:tasks:navigate', { tid })}
                    className="font-mono text-[11px] text-destructive/80 hover:text-destructive transition-colors"
                  >
                    {tid}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="h-14 flex-none flex items-center gap-2 px-3 border-t border-border bg-muted sticky bottom-0">
        {task.task_status === 'open' && (
          <Button
            size="sm"
            className="bg-primary-bright hover:bg-primary-bright/90 text-primary-bright-foreground"
            onClick={() => {
              emitClick('ui:tasks:claim', { tid: task.tid })
              onAction?.('claim')
            }}
          >
            Claim
          </Button>
        )}

        {task.task_status === 'picked' && (
          <>
            <Button
              size="sm"
              className="bg-tertiary-bright hover:bg-tertiary-bright/90 text-foreground"
              onClick={() => {
                emitClick('ui:tasks:complete', { tid: task.tid })
                onAction?.('complete')
              }}
            >
              Mark Done
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => {
                emitClick('ui:tasks:fail', { tid: task.tid })
                onAction?.('fail')
              }}
            >
              Fail
            </Button>
          </>
        )}

        {task.task_status === 'done' && (
          <>
            <Button
              size="sm"
              className="bg-secondary-bright/20 hover:bg-secondary-bright/30 text-secondary-bright"
              onClick={() => {
                emitClick('ui:tasks:verify', { tid: task.tid })
                onAction?.('complete')
              }}
            >
              Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-muted-foreground/40 text-muted-foreground hover:bg-white/5"
              onClick={() => {
                emitClick('ui:tasks:request-changes', { tid: task.tid })
                onAction?.('fail')
              }}
            >
              Request changes
            </Button>
          </>
        )}

        {task.task_status === 'verified' && (
          <span className="text-xs text-muted-foreground italic">
            Verified {task.verified_at ? fmtDate(task.verified_at) : ''}
          </span>
        )}

        {task.task_status === 'blocked' && (
          <Button
            size="sm"
            disabled={task.blocked_by.length > 0}
            className="bg-gold/20 hover:bg-gold/30 text-gold disabled:opacity-40"
            onClick={() => {
              emitClick('ui:tasks:unblock', { tid: task.tid })
              onAction?.('block')
            }}
          >
            Unblock
            {task.blocked_by.length > 0 && (
              <span className="ml-1 text-[10px] opacity-60">({task.blocked_by.length} remaining)</span>
            )}
          </Button>
        )}

        {task.task_status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            className="border-gold/40 text-gold hover:bg-gold/10"
            onClick={() => {
              emitClick('ui:tasks:retry', { tid: task.tid })
              onAction?.('claim')
            }}
          >
            Retry
          </Button>
        )}

        {task.task_status === 'dissolved' && (
          <Button
            size="sm"
            variant="outline"
            className="border-muted-foreground/40 text-muted-foreground hover:bg-white/5"
            onClick={() => {
              emitClick('ui:tasks:retry-once', { tid: task.tid })
              onAction?.('claim')
            }}
          >
            Retry once
          </Button>
        )}
      </footer>
    </aside>
  )
}
