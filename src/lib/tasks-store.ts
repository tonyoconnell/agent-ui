/**
 * Tasks Store — In-memory for dev, D1 for production
 *
 * Local dev uses JSON file persistence.
 * Production uses D1 with TypeDB sync.
 */

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

export interface ProjectTask {
  tid: string
  name: string
  status: 'todo' | 'in_progress' | 'active' | 'complete' | 'blocked' | 'failed'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  phase: string
  value: string
  persona: string
  tags: string[]
  blockedBy: string[]
  blocks: string[]
  trailPheromone: number
  alarmPheromone: number
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

export function createTask(task: Omit<ProjectTask, 'createdAt' | 'updatedAt'>): ProjectTask {
  loadFromDisk()
  const now = Date.now()
  const full: ProjectTask = {
    ...task,
    createdAt: now,
    updatedAt: now,
  }
  tasks.set(task.tid, full)

  // Update blockedBy on tasks this blocks
  for (const blockedTid of task.blocks) {
    const blocked = tasks.get(blockedTid)
    if (blocked && !blocked.blockedBy.includes(task.tid)) {
      blocked.blockedBy.push(task.tid)
      blocked.updatedAt = now
      // If it has incomplete blockers, mark as blocked
      if (blocked.status === 'todo') {
        blocked.status = 'blocked'
      }
    }
  }

  saveToDisk()
  return full
}

export function updateTask(tid: string, updates: Partial<ProjectTask>): ProjectTask | null {
  loadFromDisk()
  const existing = tasks.get(tid)
  if (!existing) return null

  const updated: ProjectTask = {
    ...existing,
    ...updates,
    tid, // Can't change tid
    updatedAt: Date.now(),
  }
  tasks.set(tid, updated)
  saveToDisk()
  return updated
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
    task.trailPheromone = Math.max(0, Math.min(100, task.trailPheromone + delta))
  } else {
    task.alarmPheromone = Math.max(0, Math.min(100, task.alarmPheromone + delta))
  }
  task.updatedAt = Date.now()
  saveToDisk()
}

// Cascade: when a task completes, unblock dependents
export function cascadeUnblock(completedTid: string): string[] {
  loadFromDisk()
  const unblocked: string[] = []

  for (const task of tasks.values()) {
    if (task.status !== 'blocked') continue
    if (!task.blockedBy.includes(completedTid)) continue

    // Check if all blockers are now complete
    const allBlockersComplete = task.blockedBy.every((bid) => {
      const blocker = tasks.get(bid)
      return blocker?.status === 'complete'
    })

    if (allBlockersComplete) {
      task.status = 'todo'
      task.updatedAt = Date.now()
      unblocked.push(task.tid)
    }
  }

  if (unblocked.length > 0) saveToDisk()
  return unblocked
}
