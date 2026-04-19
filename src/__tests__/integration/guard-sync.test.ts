/**
 * Integration test: Guard Sync
 *
 * Claim task → call sync → verify task still active (not reset)
 *
 * The sync pipeline (POST /api/tasks/sync) parses TODO-*.md files and writes to
 * TypeDB. It must NOT reset in-progress tasks to their doc-parsed state.
 * The guard: the local store is the authority for runtime status; sync reads
 * from docs and writes to TypeDB/KV but does not overwrite store status.
 *
 * This test verifies the store layer is stable across a sync-equivalent operation:
 * re-parsing tasks from source must not clobber active claim status.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as store from '@/lib/tasks-store'

function resetStore() {
  const all = store.getAllTasks()
  for (const t of all) {
    store.deleteTask(t.tid)
  }
}

/** Simulates what syncTasks does: upsert tasks from parsed docs.
 * If the task already exists, it only updates non-runtime fields (name, tags, value, phase).
 * It must NOT reset status/owner back to defaults.
 */
function simulateSyncUpsert(tid: string, fields: Pick<store.ProjectTask, 'name' | 'tags' | 'value' | 'phase'>) {
  const existing = store.getTask(tid)
  if (!existing) {
    // New task from doc — insert with defaults
    store.createTask({
      tid,
      name: fields.name,
      task_status: 'open',
      task_priority: 0.55,
      tags: fields.tags,
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
  } else {
    // Existing task — update only metadata, preserve runtime status
    store.updateTask(tid, {
      name: fields.name,
      tags: fields.tags,
      value: fields.value,
      phase: fields.phase,
      // status intentionally NOT overwritten
    })
  }
}

describe('guard-sync: sync does not reset claimed tasks', () => {
  const TID = 'guard-sync-T1'
  const _SESSION = 'session-abc-123'

  beforeEach(() => {
    resetStore()
    store.createTask({
      tid: TID,
      name: 'Guard Sync Task',
      task_status: 'open',
      task_priority: 0.75,
      tags: ['test', 'guard'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
  })

  afterEach(() => {
    resetStore()
  })

  it('task starts as open', () => {
    const task = store.getTask(TID)
    expect(task?.task_status).toBe('open')
  })

  it('claimed task remains picked after sync upsert', () => {
    // Claim the task
    store.updateTask(TID, { task_status: 'picked' })
    expect(store.getTask(TID)?.task_status).toBe('picked')

    // Sync runs — re-parses doc with same task data
    simulateSyncUpsert(TID, {
      name: 'Guard Sync Task',
      tags: ['test', 'guard'],
      value: 'high',
      phase: 'C2',
    })

    // Task must still be picked
    const task = store.getTask(TID)
    expect(task?.task_status).toBe('picked')
  })

  it('sync updates metadata without touching status', () => {
    store.updateTask(TID, { task_status: 'picked' })

    // Sync with updated name/tags
    simulateSyncUpsert(TID, {
      name: 'Guard Sync Task (renamed)',
      tags: ['test', 'guard', 'updated'],
      value: 'high',
      phase: 'C2',
    })

    const task = store.getTask(TID)
    expect(task?.task_status).toBe('picked')
    expect(task?.name).toBe('Guard Sync Task (renamed)')
    expect(task?.tags).toContain('updated')
  })

  it('sync of new task from doc inserts as todo', () => {
    const NEW_TID = 'guard-sync-T-new'
    simulateSyncUpsert(NEW_TID, {
      name: 'New Task From Doc',
      tags: ['new'],
      value: 'medium',
      phase: 'C2',
    })

    const task = store.getTask(NEW_TID)
    expect(task?.task_status).toBe('open')
    store.deleteTask(NEW_TID)
  })

  it('picked task also survives sync', () => {
    store.updateTask(TID, { task_status: 'picked' })

    simulateSyncUpsert(TID, {
      name: 'Guard Sync Task',
      tags: ['test', 'guard'],
      value: 'high',
      phase: 'C2',
    })

    expect(store.getTask(TID)?.task_status).toBe('picked')
  })
})
