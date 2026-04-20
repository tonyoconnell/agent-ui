/**
 * Tasks API Tests
 *
 * Tests for:
 * - GET /api/tasks — list tasks with pheromone categories
 * - POST /api/tasks — create task
 * - POST /api/tasks/:id/complete — four outcomes
 * - POST /api/tasks/:id/claim — claim task
 * - POST /api/tasks/:id/release — release task
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn().mockResolvedValue([]),
  read: vi.fn().mockResolvedValue([]),
  write: vi.fn().mockResolvedValue(undefined),
  writeSilent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/net', () => ({
  getNet: vi.fn().mockResolvedValue({
    sense: vi.fn().mockReturnValue(0),
    danger: vi.fn().mockReturnValue(0),
    mark: vi.fn(),
    warn: vi.fn(),
  }),
}))

vi.mock('@/lib/ws-cache', () => ({
  updateTasksCache: vi.fn(),
}))

vi.mock('@/lib/ws-server', () => ({
  wsManager: { broadcast: vi.fn() },
  relayToGateway: vi.fn(),
}))

vi.mock('@/lib/tasks-store', () => {
  const store = new Map<string, any>()
  return {
    getAllTasks: vi.fn(() => Array.from(store.values())),
    getTask: vi.fn((tid: string) => store.get(tid)),
    createTask: vi.fn((task: any) => {
      const full = { ...task, createdAt: Date.now(), updatedAt: Date.now() }
      store.set(task.tid, full)
      return full
    }),
    updateTask: vi.fn((tid: string, updates: any) => {
      const existing = store.get(tid)
      if (!existing) return null
      const updated = { ...existing, ...updates, tid, updatedAt: Date.now() }
      store.set(tid, updated)
      return updated
    }),
    markPheromone: vi.fn((tid: string, type: string, delta: number) => {
      const task = store.get(tid)
      if (!task) return
      if (type === 'trail') task.strength = Math.min(100, (task.strength || 0) + delta)
      else task.resistance = Math.min(100, (task.resistance || 0) + delta)
    }),
    cascadeUnblock: vi.fn().mockReturnValue([]),
    seedFromApi: vi.fn(),
    deleteTask: vi.fn(),
    _store: store,
  }
})

// Stub execSync used by complete.ts for W4 verify
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/tasks
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/tasks', () => {
  let GET: any

  beforeEach(async () => {
    vi.resetModules()
    // Clear the mock store
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>
    store.clear()
    const mod = await import('./index')
    GET = mod.GET
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(params: Record<string, string | string[]> = {}) {
    const url = new URL('http://localhost:4321/api/tasks')
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, item)
      } else {
        url.searchParams.set(k, v)
      }
    }
    return { url }
  }

  it('returns empty tasks array when store is empty (falls through to TypeDB)', async () => {
    const res = await GET(makeCtx())
    const body = await res.json()
    expect(body.tasks).toBeDefined()
    expect(Array.isArray(body.tasks)).toBe(true)
    expect(body.tasks.length).toBe(0)
  })

  it('returns tasks from local store with pheromone categories', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-1', {
      tid: 'T-1',
      name: 'Build API',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: ['build', 'api'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })

    const res = await GET(makeCtx())
    const body = await res.json()
    expect(body.source).toBe('local')
    expect(body.tasks.length).toBe(1)
    expect(body.tasks[0].tid).toBe('T-1')
    expect(body.tasks[0].category).toBe('exploratory')
  })

  it('categorizes attractive tasks (trailPheromone >= 50)', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-2', {
      tid: 'T-2',
      name: 'Proven Path',
      task_status: 'open',
      task_priority: 0.9,
      task_wave: 'W1',
      task_value: 0.75,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 60,
      resistance: 10,
    })

    const res = await GET(makeCtx())
    const body = await res.json()
    expect(body.tasks[0].category).toBe('attractive')
    expect(body.tasks[0].attractive).toBe(true)
  })

  it('categorizes repelled tasks (alarmPheromone >= 30 and > trailPheromone)', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-3', {
      tid: 'T-3',
      name: 'Toxic Path',
      task_status: 'open',
      task_priority: 0.5,
      task_wave: 'W1',
      task_value: 0.25,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 5,
      resistance: 40,
    })

    const res = await GET(makeCtx())
    const body = await res.json()
    expect(body.tasks[0].category).toBe('repelled')
    expect(body.tasks[0].repelled).toBe(true)
  })

  it('categorizes ready tasks (has some pheromone but not attractive/repelled)', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-4', {
      tid: 'T-4',
      name: 'Normal Task',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W2',
      task_value: 0.55,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 20,
      resistance: 5,
    })

    const res = await GET(makeCtx())
    const body = await res.json()
    expect(body.tasks[0].category).toBe('ready')
  })

  it('filters tasks by tag', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-5', {
      tid: 'T-5',
      name: 'Tagged',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: ['build', 'api'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
    store.set('T-6', {
      tid: 'T-6',
      name: 'Untagged',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: ['docs'],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })

    const res = await GET(makeCtx({ tag: 'build' }))
    const body = await res.json()
    expect(body.tasks.length).toBe(1)
    expect(body.tasks[0].tid).toBe('T-5')
  })

  it('filters tasks by phase', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-7', {
      tid: 'T-7',
      name: 'Phase W1',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
    store.set('T-8', {
      tid: 'T-8',
      name: 'Phase W2',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W2',
      task_value: 0.55,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })

    const res = await GET(makeCtx({ phase: 'W1' }))
    const body = await res.json()
    expect(body.tasks.length).toBe(1)
    expect(body.tasks[0].tid).toBe('T-7')
  })

  it('excludes picked tasks', async () => {
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>

    store.set('T-9', {
      tid: 'T-9',
      name: 'Picked',
      task_status: 'picked',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
    store.set('T-10', {
      tid: 'T-10',
      name: 'Also Picked',
      task_status: 'picked',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })
    store.set('T-11', {
      tid: 'T-11',
      name: 'Open',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
    })

    const res = await GET(makeCtx())
    const body = await res.json()
    expect(body.tasks.length).toBe(1)
    expect(body.tasks[0].tid).toBe('T-11')
  })

  it('returns CORS headers', async () => {
    const res = await GET(makeCtx())
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/tasks
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/tasks', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>
    store.clear()
    const mod = await import('./index')
    POST = mod.POST
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(body: Record<string, unknown>) {
    return {
      request: new Request('http://localhost:4321/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    }
  }

  it('creates a task with required fields', async () => {
    const res = await POST(makeCtx({ id: 'T-100', name: 'New Task' }))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.task).toBe('T-100')
    expect(body.priorityScore).toBeGreaterThan(0)
    expect(body.formula).toBeDefined()
  })

  it('returns 400 when id is missing', async () => {
    const res = await POST(makeCtx({ name: 'No ID' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Missing')
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeCtx({ id: 'T-101' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Missing')
  })

  it('applies default value, phase, persona when not provided', async () => {
    const res = await POST(makeCtx({ id: 'T-102', name: 'Defaults Test' }))
    const body = await res.json()
    expect(body.ok).toBe(true)

    const { createTask } = await import('@/lib/tasks-store')
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tid: 'T-102',
        task_wave: 'C4',
        task_value: 0.55, // 'medium' maps to 0.55
      }),
    )
  })

  it('passes tags through to TypeDB and local store', async () => {
    const res = await POST(makeCtx({ id: 'T-103', name: 'Tagged', tags: ['build', 'P0'] }))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.tags).toEqual(['build', 'P0'])
  })

  it('writes task to TypeDB', async () => {
    await POST(makeCtx({ id: 'T-104', name: 'TypeDB Write' }))
    const { write } = await import('@/lib/typedb')
    expect(write).toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/tasks/:id/complete — Four Outcomes
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/tasks/:id/complete', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const storeModule = await import('@/lib/tasks-store')
    const store = (storeModule as any)._store as Map<string, any>
    store.clear()
    // Seed a task so complete can find it
    store.set('T-200', {
      tid: 'T-200',
      name: 'Completable',
      task_status: 'open',
      task_priority: 0.7,
      task_wave: 'W1',
      task_value: 0.75,
      tags: [],
      blocked_by: [],
      blocks: [],
      strength: 0,
      resistance: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    const mod = await import('./[id]/complete')
    POST = mod.POST
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(id: string, body: Record<string, unknown> = {}) {
    return {
      params: { id },
      request: new Request('http://localhost:4321/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipVerify: true, ...body }),
      }),
    }
  }

  it('returns 400 when task id is missing', async () => {
    const res = await POST({
      params: {},
      request: new Request('http://localhost:4321/api/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({ skipVerify: true }),
      }),
    })
    expect(res.status).toBe(400)
  })

  it('marks success — trail pheromone +5, status verified', async () => {
    const res = await POST(makeCtx('T-200'))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.outcome).toBe('success')

    const { markPheromone, updateTask } = await import('@/lib/tasks-store')
    expect(markPheromone).toHaveBeenCalledWith('T-200', 'trail', 5.0)
    expect(updateTask).toHaveBeenCalledWith('T-200', { task_status: 'verified' })
  })

  it('marks failure — alarm pheromone +8, status failed', async () => {
    const res = await POST(makeCtx('T-200', { failed: true }))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.outcome).toBe('failed')

    const { markPheromone, updateTask } = await import('@/lib/tasks-store')
    expect(markPheromone).toHaveBeenCalledWith('T-200', 'alarm', 8.0)
    expect(updateTask).toHaveBeenCalledWith('T-200', { task_status: 'failed' })
  })

  it('cascades unblock on success', async () => {
    const res = await POST(makeCtx('T-200'))
    const body = await res.json()
    expect(body.ok).toBe(true)

    const { cascadeUnblock } = await import('@/lib/tasks-store')
    expect(cascadeUnblock).toHaveBeenCalledWith('T-200')
  })

  it('does not cascade unblock on failure', async () => {
    await POST(makeCtx('T-200', { failed: true }))
    const { cascadeUnblock } = await import('@/lib/tasks-store')
    expect(cascadeUnblock).not.toHaveBeenCalled()
  })

  it('broadcasts mark message on success via WebSocket', async () => {
    await POST(makeCtx('T-200'))
    const { wsManager } = await import('@/lib/ws-server')
    expect(wsManager.broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'mark', tid: 'T-200' }))
  })

  it('broadcasts warn message on failure via WebSocket', async () => {
    await POST(makeCtx('T-200', { failed: true }))
    const { wsManager } = await import('@/lib/ws-server')
    expect(wsManager.broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'warn', tid: 'T-200' }))
  })

  it('broadcasts complete event on success', async () => {
    await POST(makeCtx('T-200'))
    const { wsManager } = await import('@/lib/ws-server')
    expect(wsManager.broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'complete', tid: 'T-200' }))
  })

  it('writes status update to TypeDB', async () => {
    await POST(makeCtx('T-200'))
    const { writeSilent } = await import('@/lib/typedb')
    expect(writeSilent).toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/tasks/:id/claim
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/tasks/:id/claim', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('./[id]/claim')
    POST = mod.POST
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(id: string, body: Record<string, unknown> = {}) {
    return {
      params: { id },
      request: new Request('http://localhost:4321/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    }
  }

  it('claims an open task successfully', async () => {
    const { write } = await import('@/lib/typedb')
    ;(write as any).mockResolvedValueOnce([{ ok: true }])

    const res = await POST(makeCtx('T-300', { sessionId: 'session-1' }))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.owner).toBe('session-1')
    expect(body.claimedAt).toBeDefined()
  })

  it('returns 409 when task is already claimed', async () => {
    const { write } = await import('@/lib/typedb')
    ;(write as any).mockResolvedValueOnce([])

    const res = await POST(makeCtx('T-300', { sessionId: 'session-2' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain('Already claimed')
  })

  it('returns 500 on TypeDB error', async () => {
    const { write } = await import('@/lib/typedb')
    ;(write as any).mockRejectedValueOnce(new Error('TypeDB connection failed'))

    const res = await POST(makeCtx('T-300', { sessionId: 'session-3' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('TypeDB connection failed')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/tasks/:id/release
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/tasks/:id/release', () => {
  let POST: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('./[id]/release')
    POST = mod.POST
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeCtx(id: string, body: Record<string, unknown> = {}) {
    return {
      params: { id },
      request: new Request('http://localhost:4321/api/tasks/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    }
  }

  it('releases a claimed task by the owner', async () => {
    const { write } = await import('@/lib/typedb')
    ;(write as any).mockResolvedValueOnce([{ ok: true }])

    const res = await POST(makeCtx('T-400', { sessionId: 'session-1' }))
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 403 when session is not the owner', async () => {
    const { write } = await import('@/lib/typedb')
    ;(write as any).mockResolvedValueOnce([])

    const res = await POST(makeCtx('T-400', { sessionId: 'wrong-session' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain('Not owner')
  })

  it('returns 500 on TypeDB error', async () => {
    const { write } = await import('@/lib/typedb')
    ;(write as any).mockRejectedValueOnce(new Error('Connection lost'))

    const res = await POST(makeCtx('T-400', { sessionId: 'session-1' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Connection lost')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// OPTIONS /api/tasks (CORS)
// ═══════════════════════════════════════════════════════════════════════════

describe('OPTIONS /api/tasks', () => {
  it('returns 204 with CORS headers', async () => {
    const mod = await import('./index')
    const res = await mod.OPTIONS({} as any)
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})
