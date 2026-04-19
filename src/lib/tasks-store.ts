/**
 * Tasks Store — In-memory for dev, D1 for production
 *
 * Local dev uses JSON file persistence.
 * Production uses D1 with TypeDB sync.
 */

import type { Task, TaskStatus } from '@/types/task'
import { normalizeStatus, priorityFromLabel } from '@/types/task'

// Detect the Cloudflare Workers runtime. Astro's cloudflare adapter
// polyfills `process.cwd`, so that check is unreliable — but the runtime's
// `navigator.userAgent` is always exactly 'Cloudflare-Workers'.
const IS_EDGE =
  typeof navigator !== 'undefined' && (navigator as { userAgent?: string }).userAgent === 'Cloudflare-Workers'
const IS_NODE = !IS_EDGE && typeof process !== 'undefined' && typeof process.cwd === 'function'

type FsMod = {
  existsSync: (p: string) => boolean
  readFileSync: (p: string, enc: 'utf-8') => string
  writeFileSync: (p: string, data: string) => void
}
let _fs: FsMod | null = null
let _path: { join: (...parts: string[]) => string } | null = null

if (IS_NODE) {
  // Top-level await: evaluated only when this module is loaded under Node.
  _fs = (await import('node:fs')) as unknown as FsMod
  _path = (await import('node:path')) as unknown as { join: (...parts: string[]) => string }
}

/**
 * Store-local Task extends canonical with timestamps.
 * Canonical fields: see `src/types/task.ts`.
 */
export type ProjectTask = Task & {
  createdAt: number
  updatedAt: number
}

// In-memory store
let tasks: Map<string, ProjectTask> = new Map()
let loaded = false

const STORE_PATH = IS_NODE && _path ? _path.join(process.cwd(), '.tasks.json') : ''

function loadFromDisk() {
  if (loaded) return
  loaded = true
  if (!IS_NODE || !_fs) return

  if (_fs.existsSync(STORE_PATH)) {
    try {
      const data = JSON.parse(_fs.readFileSync(STORE_PATH, 'utf-8'))
      tasks = new Map(Object.entries(data))
    } catch {
      tasks = new Map()
    }
  }
}

function saveToDisk() {
  if (!IS_NODE || !_fs) return
  try {
    const data = Object.fromEntries(tasks)
    _fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2))
  } catch {
    // Ignore write errors
  }
}

export function getAllTasks(): ProjectTask[] {
  loadFromDisk()
  return Array.from(tasks.values())
}

export function getTask(tid: string): ProjectTask | undefined {
  loadFromDisk()
  return tasks.get(tid)
}

export function createTask(input: Partial<ProjectTask> & { tid: string; name?: string }): ProjectTask {
  loadFromDisk()
  const now = Date.now()
  const tid = input.tid
  const task: ProjectTask = {
    tid,
    thing_type: 'task',
    name: input.name ?? tid,
    task_status: 'open',
    task_wave: input.task_wave ?? null,
    task_priority:
      typeof input.task_priority === 'number'
        ? input.task_priority
        : priorityFromLabel(((input as Record<string, unknown>).priority as 'P0' | 'P1' | 'P2' | 'P3') ?? 'P2'),
    task_effort: input.task_effort ?? 0.5,
    task_value: input.task_value ?? 0.5,
    task_variant: input.task_variant ?? null,
    tags: input.tags ?? [],
    blocks: input.blocks ?? [],
    blocked_by: input.blocked_by ?? ((input as Record<string, unknown>).blockedBy as string[]) ?? [],
    strength: 0,
    resistance: 0,
    createdAt: now,
    updatedAt: now,
    ...(input.exit_condition ? { exit_condition: input.exit_condition } : {}),
  }
  tasks.set(tid, task)

  // Update blocked_by on tasks this blocks
  for (const blockedTid of task.blocks) {
    const blocked = tasks.get(blockedTid)
    if (blocked && !blocked.blocked_by.includes(tid)) {
      blocked.blocked_by.push(tid)
      blocked.updatedAt = now
      // If it has incomplete blockers, mark as blocked
      if (blocked.task_status === 'open') {
        blocked.task_status = 'blocked'
      }
    }
  }

  saveToDisk()
  return task
}

export function updateTask(tid: string, updates: Partial<Task>): ProjectTask | null {
  loadFromDisk()
  const existing = tasks.get(tid)
  if (!existing) return null

  // Normalize any incoming status field
  const normalizedUpdates: Partial<Task> = { ...updates }
  if ('task_status' in normalizedUpdates && normalizedUpdates.task_status) {
    normalizedUpdates.task_status = normalizeStatus(normalizedUpdates.task_status)
  }

  const updated: ProjectTask = {
    ...existing,
    ...normalizedUpdates,
    tid, // Can't change tid
    updatedAt: Date.now(),
  }
  tasks.set(tid, updated)
  saveToDisk()
  return updated
}

/**
 * Seed the in-memory store from API/TypeDB data.
 * Called when GET /api/tasks fetches from TypeDB so that
 * subsequent PATCH/complete calls can find and broadcast tasks.
 */
export function seedFromApi(apiTasks: Array<Record<string, unknown>>): void {
  loadFromDisk()
  if (tasks.size > 0) return // already populated, don't overwrite
  const now = Date.now()
  for (const t of apiTasks) {
    const tid = (t.tid || t.id) as string
    if (!tid) continue
    const rawStatus = (t.task_status as string) ?? (t.status as string) ?? 'open'
    const task_status: TaskStatus = normalizeStatus(rawStatus)
    const tags = (t.tags as string[]) || []
    const priorityTag = tags.find((tag) => /^P[0-3]$/.test(tag)) as 'P0' | 'P1' | 'P2' | 'P3' | undefined
    tasks.set(tid, {
      tid,
      thing_type: 'task',
      name: (t.name as string) || tid,
      task_status,
      task_wave: (t.task_wave as ProjectTask['task_wave']) ?? null,
      task_priority:
        typeof t.task_priority === 'number' ? (t.task_priority as number) : priorityFromLabel(priorityTag ?? 'P1'),
      task_effort: (t.task_effort as number) ?? 0.5,
      task_value: (t.task_value as number) ?? 0.5,
      task_variant: (t.task_variant as ProjectTask['task_variant']) ?? null,
      tags,
      blocked_by: (t.blocked_by as string[]) || (t.blockedBy as string[]) || [],
      blocks: (t.blocks as string[]) || [],
      strength: (t.strength as number) || 0,
      resistance: (t.resistance as number) || 0,
      createdAt: now,
      updatedAt: now,
    })
  }
  saveToDisk()
}

export function deleteTask(tid: string): boolean {
  loadFromDisk()
  const existed = tasks.delete(tid)
  if (existed) saveToDisk()
  return existed
}

export function markPheromone(tid: string, type: 'trail' | 'alarm', delta: number): void {
  loadFromDisk()
  const task = tasks.get(tid)
  if (!task) return

  if (type === 'trail') {
    task.strength = Math.max(0, Math.min(100, task.strength + delta))
  } else {
    task.resistance = Math.max(0, Math.min(100, task.resistance + delta))
  }
  task.updatedAt = Date.now()
  saveToDisk()
}

// Cascade: when a task completes, unblock dependents
export function cascadeUnblock(completedTid: string): string[] {
  loadFromDisk()
  const unblocked: string[] = []

  for (const task of tasks.values()) {
    if (task.task_status !== 'blocked') continue
    if (!task.blocked_by.includes(completedTid)) continue

    // Check if all blockers are now verified
    const allBlockersVerified = task.blocked_by.every((bid) => {
      const blocker = tasks.get(bid)
      return blocker?.task_status === 'verified'
    })

    if (allBlockersVerified) {
      task.task_status = 'open'
      task.updatedAt = Date.now()
      unblocked.push(task.tid)
    }
  }

  if (unblocked.length > 0) saveToDisk()
  return unblocked
}
