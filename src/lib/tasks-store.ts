/**
 * Tasks Store — In-memory for dev, D1 for production
 *
 * Local dev uses JSON file persistence.
 * Production uses D1 with TypeDB sync.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export interface ProjectTask {
  tid: string
  name: string
  status: 'todo' | 'in_progress' | 'complete' | 'blocked' | 'failed'
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

const STORE_PATH = join(process.cwd(), '.tasks.json')

function loadFromDisk() {
  if (loaded) return
  loaded = true

  if (existsSync(STORE_PATH)) {
    try {
      const data = JSON.parse(readFileSync(STORE_PATH, 'utf-8'))
      tasks = new Map(Object.entries(data))
    } catch {
      tasks = new Map()
    }
  }
}

function saveToDisk() {
  try {
    const data = Object.fromEntries(tasks)
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2))
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
    const allBlockersComplete = task.blockedBy.every(bid => {
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
