/**
 * Canonical Task type for the ONE substrate.
 *
 * Single source of truth — all 5 previously-drifted Task interfaces
 * (TaskBoard, tasks-store ProjectTask, world.ts Task, components/tasks/types,
 * engine/task-parse) collapse here.
 *
 * Maps directly to TypeDB `thing` with thing-type="task".
 * See `one/task.md` § 1 for the ID shape and § 3 for the state machine.
 */

// ============================================================================
// Core enums
// ============================================================================

/**
 * The 7-state task status machine from `one/task.md` § 3.
 * Every transition is a signal; every close deposits pheromone.
 */
export type TaskStatus =
  | 'open' // available, unblocked, awaiting pick
  | 'blocked' // has unverified blockers
  | 'picked' // agent claimed, LLM executing
  | 'done' // returned {result}, awaiting W4 verify
  | 'verified' // W4 rubric ≥ 0.65; skill produced if applicable
  | 'failed' // no result after retry
  | 'dissolved' // missing unit or capability

/**
 * Legacy status values from the drift era. Mapped by `normalizeStatus()`.
 * Kept only for reading old rows during Cycle 2 migration.
 */
export type LegacyStatus = 'todo' | 'in_progress' | 'active' | 'complete'

/** Wave in the W1-W4 sandwich. Role letter in task-id maps to wave. */
export type TaskWave = 'W1' | 'W2' | 'W3' | 'W4'

/** Split-test variant letter. `null` = single-track task. */
export type TaskVariant = 'a' | 'b' | 'c' | null

/** Role letters in the task-id breadcrumb. */
export type TaskRole = 'r' | 'd' | 'e' | 'v'

/** Map role letter → wave. Used when task_wave isn't explicitly set. */
export const ROLE_TO_WAVE: Record<TaskRole, TaskWave> = {
  r: 'W1',
  d: 'W2',
  e: 'W3',
  v: 'W4',
}

// ============================================================================
// Rubric
// ============================================================================

/** Rubric scores in [0..1]. Set post-verify by W4. */
export interface TaskRubric {
  fit: number
  form: number
  truth: number
  taste: number
}

// ============================================================================
// Task (canonical)
// ============================================================================

/**
 * Canonical Task — the single source of truth.
 * ID shape: `{plan-slug}:{cycle}:{role}{index}[.{variant}]`
 *   e.g. "loop-close:1:r1", "task-system:2:e5.b"
 */
export interface Task {
  /** Primary key. Maps to `thing.tid` in TypeDB. */
  tid: string

  /** Discriminant for the unified `thing` entity. Always 'task' here. */
  thing_type: 'task'

  /** Display name. */
  name: string

  /** Current status per state machine. */
  task_status: TaskStatus

  /** Wave in the W1-W4 sandwich. Null for non-wave tasks. */
  task_wave: TaskWave | null

  /** Priority in [0..1]. Display mapping via `priorityLabel()`. */
  task_priority: number

  /** Effort estimate in [0..1]. */
  task_effort: number

  /** Value estimate in [0..1]. */
  task_value: number

  /** Split-test variant letter. Null for single-track. */
  task_variant: TaskVariant

  /** Machine-observable acceptance condition. */
  exit_condition?: string

  /** Rubric scores, set at W4 verify. */
  rubric?: TaskRubric

  /** Flat labels for pheromone routing. */
  tags: string[]

  /** Task IDs this task blocks. */
  blocks: string[]

  /** Task IDs blocking this task. */
  blocked_by: string[]

  /** Pheromone strength on inbound paths. Canonical DB name. */
  strength: number

  /** Pheromone resistance on inbound paths. Canonical DB name. */
  resistance: number

  /** ISO-8601 timestamp — when task transitioned to 'picked'. */
  started_at?: string

  /** ISO-8601 timestamp — when task transitioned to 'done'. */
  closed_at?: string

  /** ISO-8601 timestamp — when task transitioned to 'verified'. */
  verified_at?: string

  /** Owner unit id (agent that picked the task). */
  owner?: string
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Normalize any legacy or current status string to canonical TaskStatus.
 * Used by API read handlers + WebSocket handlers during Cycle 2 migration.
 */
export function normalizeStatus(raw: string | null | undefined): TaskStatus {
  switch (raw) {
    case 'todo':
      return 'open'
    case 'in_progress':
    case 'active':
      return 'picked'
    case 'complete':
      return 'verified'
    case 'open':
    case 'blocked':
    case 'picked':
    case 'done':
    case 'verified':
    case 'failed':
    case 'dissolved':
      return raw
    default:
      return 'open'
  }
}

/** Map task_priority number to Px label for display. */
export function priorityLabel(p: number): 'P0' | 'P1' | 'P2' | 'P3' {
  if (p >= 0.9) return 'P0'
  if (p >= 0.7) return 'P1'
  if (p >= 0.5) return 'P2'
  return 'P3'
}

/** Inverse — map Px label to a representative number. */
export function priorityFromLabel(label: 'P0' | 'P1' | 'P2' | 'P3'): number {
  switch (label) {
    case 'P0':
      return 0.95
    case 'P1':
      return 0.75
    case 'P2':
      return 0.55
    case 'P3':
      return 0.25
  }
}

/** Parse a task-id breadcrumb into its components. */
export function parseTaskId(tid: string): {
  plan: string
  cycle: number | null
  role: TaskRole | null
  index: number | null
  variant: TaskVariant
} {
  const parts = tid.split(':')
  const plan = parts[0] ?? tid
  const cycleStr = parts[1]
  const rolePart = parts[2]

  if (cycleStr === undefined) return { plan, cycle: null, role: null, index: null, variant: null }

  const cycle = Number(cycleStr)
  const cycleOrNull = Number.isNaN(cycle) ? null : cycle

  if (rolePart === undefined) return { plan, cycle: cycleOrNull, role: null, index: null, variant: null }

  const match = rolePart.match(/^([rdev])(\d+)(?:\.([abc]))?$/)
  if (!match) return { plan, cycle: cycleOrNull, role: null, index: null, variant: null }

  return {
    plan,
    cycle: cycleOrNull,
    role: match[1] as TaskRole,
    index: Number(match[2]),
    variant: (match[3] as TaskVariant) ?? null,
  }
}

/** Infer wave from task-id when task_wave isn't set explicitly. */
export function inferWave(tid: string): TaskWave | null {
  const parsed = parseTaskId(tid)
  return parsed.role ? ROLE_TO_WAVE[parsed.role] : null
}

/** Average of a rubric's 4 dims. 0 if undefined. */
export function rubricAvg(r: TaskRubric | undefined): number {
  if (!r) return 0
  return (r.fit + r.form + r.truth + r.taste) / 4
}

/** Cycle gate check — passes if every rubric dim ≥ 0.65. */
export function rubricPasses(r: TaskRubric | undefined, threshold = 0.65): boolean {
  if (!r) return false
  return r.fit >= threshold && r.form >= threshold && r.truth >= threshold && r.taste >= threshold
}

// ============================================================================
// WebSocket message contract
// ============================================================================

/** Mark — pheromone strengthens. Fires on successful wave/task close. */
export interface WsMark {
  type: 'mark'
  tid: string
  strength: number
}

/** Warn — pheromone resistance rises. Fires on failure/dissolved/weak-rubric. */
export interface WsWarn {
  type: 'warn'
  tid: string
  resistance: number
}

/** Pick — agent claimed an open task. Transitions to 'picked'. */
export interface WsPick {
  type: 'pick'
  tid: string
  owner: string
  started_at: string
}

/** Verify — W4 passed with full rubric. Transitions to 'verified'. */
export interface WsVerify {
  type: 'verify'
  tid: string
  rubric: TaskRubric
  verified_at: string
}

/** Rubric update — incremental score during W4 (streaming). */
export interface WsRubricUpdate {
  type: 'rubric-update'
  tid: string
  rubric: Partial<TaskRubric>
}

/** Sync — batch pheromone update across many tasks. */
export interface WsSync {
  type: 'sync'
  tasks: Array<{ tid: string; strength: number; resistance: number }>
}

/** Task update — passthrough for any partial field update. */
export interface WsTaskUpdate {
  type: 'task-update'
  task: Partial<Task> & { tid: string }
}

/** Unblock — dependent's last blocker verified; transition to 'open'. */
export interface WsUnblock {
  type: 'unblock'
  tid: string
}

/** @deprecated Use 'verify' instead. Handler aliases to WsVerify. */
export interface WsComplete {
  type: 'complete'
  tid: string
}

/** Unit hired — a new unit joined the org (chairman C1). */
export interface WsUnitHired {
  type: 'unit-hired'
  uid: string
  role: string
  wallet: string | null
  skills: string[]
  from: string
}

/** Ping / pong — keepalive. */
export interface WsPing {
  type: 'ping'
}

export interface WsPong {
  type: 'pong'
}

export type WsMessage =
  | WsMark
  | WsWarn
  | WsPick
  | WsVerify
  | WsRubricUpdate
  | WsSync
  | WsTaskUpdate
  | WsUnblock
  | WsComplete
  | WsUnitHired
  | WsPing
  | WsPong
