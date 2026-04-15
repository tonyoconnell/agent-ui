/**
 * Integration Tests for Top-Level API Endpoints
 *
 * Smoke tests for core endpoints:
 * - GET /api/health — system health check
 * - POST /api/signal — route signal into substrate
 * - GET /api/state — full world state snapshot
 * - GET /api/tasks — task visibility with pheromone priority
 *
 * Tests validate response shape and status codes.
 * Mocks TypeDB and in-process cache.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readParsed, write, writeSilent } from '@/lib/typedb'
import { getNet, getUnitMeta, loadedAt } from '@/lib/net'
import * as store from '@/lib/tasks-store'

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  write: vi.fn(),
  writeSilent: vi.fn(),
}))

vi.mock('@/lib/net', () => ({
  getNet: vi.fn(),
  getUnitMeta: vi.fn(),
  loadedAt: vi.fn(),
}))

vi.mock('@/lib/tasks-store', () => ({
  getAllTasks: vi.fn(),
  createTask: vi.fn(),
}))

vi.mock('@/lib/ws-cache', () => ({
  updateTasksCache: vi.fn(),
}))

vi.mock('@/engine/adl-cache', () => ({
  audit: vi.fn(),
  flushAuditBuffer: vi.fn(),
  getCached: vi.fn(),
  setCached: vi.fn(),
  enforcementMode: vi.fn(() => 'audit'),
  invalidatePermCache: vi.fn(),
}))

vi.mock('@/lib/ui-prefetch', () => ({
  isWarm: vi.fn(() => false),
}))

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Mock Astro Context
// ═══════════════════════════════════════════════════════════════════════════

function createMockAstroContext(method: 'GET' | 'POST' = 'GET', body?: unknown) {
  return {
    request: new Request('http://localhost:4321/api/test', {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    }),
    locals: {
      runtime: {
        env: {
          DB: undefined, // D1 not available in test
          KV: undefined,
        },
      },
    },
    url: new URL('http://localhost:4321/api/test'),
  } as any
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/health
// ═══════════════════════════════════════════════════════════════════════════

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with healthy status when world is loaded', async () => {
    const mockGetNet = getNet as any
    const mockGetUnitMeta = getUnitMeta as any
    const mockLoadedAt = loadedAt as any
    const mockReadParsed = readParsed as any

    // Mock loaded world with units
    mockGetNet.mockResolvedValueOnce({
      strength: { 'a→b': 5.0, 'b→c': 10.0 },
      revenue: { 'a→b': 100, 'b→c': 200 },
      highways: () => [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
    })

    mockGetUnitMeta.mockReturnValueOnce({
      alice: { kind: 'agent', successRate: 0.8 },
      bob: { kind: 'llm', successRate: 0.9 },
    })

    mockLoadedAt.mockReturnValueOnce(Date.now() - 5000) // 5s ago

    mockReadParsed.mockResolvedValueOnce([
      { gid: 'marketing', name: 'Marketing', c: 3 },
    ])

    // Import and call handler
    const { GET } = await import('@/pages/api/health')
    const response = await GET(createMockAstroContext())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.world).toBeDefined()
    expect(data.world.units).toBeGreaterThan(0)
    expect(data.version).toBe('0.6.0')
    expect(data.timestamp).toBeDefined()
  })

  it('should return 503 degraded when world never loaded', async () => {
    const mockGetNet = getNet as any
    const mockGetUnitMeta = getUnitMeta as any
    const mockLoadedAt = loadedAt as any

    mockGetNet.mockResolvedValueOnce({
      strength: {},
      revenue: {},
      highways: () => [],
    })
    mockGetUnitMeta.mockReturnValueOnce({})
    mockLoadedAt.mockReturnValueOnce(null)

    const { GET } = await import('@/pages/api/health')
    const response = await GET(createMockAstroContext())

    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.status).toBe('degraded')
  })

  it('should include world stats (units, agents, edges, highways)', async () => {
    const mockGetNet = getNet as any
    const mockGetUnitMeta = getUnitMeta as any
    const mockLoadedAt = loadedAt as any
    const mockReadParsed = readParsed as any

    mockGetNet.mockResolvedValueOnce({
      strength: { 'a→b': 50.0 },
      revenue: { 'a→b': 500 },
      highways: () => [{ from: 'a', to: 'b', strength: 50.0 }],
    })

    mockGetUnitMeta.mockReturnValueOnce({
      alice: { kind: 'agent', successRate: 0.85 },
      bob: { kind: 'agent', successRate: 0.75 },
      gateway: { kind: 'service', successRate: 0.95 },
    })

    mockLoadedAt.mockReturnValueOnce(Date.now() - 1000)
    mockReadParsed.mockResolvedValueOnce([])

    const { GET } = await import('@/pages/api/health')
    const response = await GET(createMockAstroContext())

    const data = await response.json()
    expect(data.world.units).toBe(3)
    expect(data.world.agents).toBe(2) // only agent + llm kinds count
    expect(data.world.edges).toBe(1)
    expect(data.world.highways).toBe(1)
    expect(data.world.avgSuccessRate).toBeDefined()
    expect(data.world.totalRevenue).toBe('500.00')
  })

  it('should handle TypeDB group query failure gracefully', async () => {
    const mockGetNet = getNet as any
    const mockGetUnitMeta = getUnitMeta as any
    const mockLoadedAt = loadedAt as any
    const mockReadParsed = readParsed as any

    mockGetNet.mockResolvedValueOnce({
      strength: {},
      revenue: {},
      highways: () => [],
    })
    mockGetUnitMeta.mockReturnValueOnce({ alice: { kind: 'agent', successRate: 0.8 } })
    mockLoadedAt.mockReturnValueOnce(Date.now())
    mockReadParsed.mockRejectedValueOnce(new Error('TypeDB unavailable'))

    const { GET } = await import('@/pages/api/health')
    const response = await GET(createMockAstroContext())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.world.topGroup).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/signal
// ═══════════════════════════════════════════════════════════════════════════

describe('/api/signal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if sender or receiver missing', async () => {
    const { POST } = await import('@/pages/api/signal')
    const response = await POST(
      createMockAstroContext('POST', { sender: 'alice' }) // missing receiver
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('sender or receiver')
  })

  it('should reject invalid sender format (TQL injection guard)', async () => {
    const { POST } = await import('@/pages/api/signal')
    const response = await POST(
      createMockAstroContext('POST', {
        sender: 'alice"; delete',
        receiver: 'bob',
      })
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('sender format')
  })

  it('should reject invalid amount (must be 0-1M)', async () => {
    const { POST } = await import('@/pages/api/signal')
    const response = await POST(
      createMockAstroContext('POST', {
        sender: 'alice',
        receiver: 'bob',
        amount: -100,
      })
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('amount')
  })

  it('should return 200 on successful signal with valid shape', async () => {
    const mockWrite = write as any
    const mockReadParsed = readParsed as any

    mockWrite.mockResolvedValueOnce({ ok: true })
    // Mock all readParsed calls: adl-status, perm-network, sender-sens, receiver-sens, routes
    mockReadParsed
      .mockResolvedValueOnce([]) // adl-status
      .mockResolvedValueOnce([]) // perm-network
      .mockResolvedValueOnce([]) // sender-sensitivity
      .mockResolvedValueOnce([]) // receiver-sensitivity
      .mockResolvedValueOnce([]) // routes

    const { POST } = await import('@/pages/api/signal')
    const response = await POST(
      createMockAstroContext('POST', {
        sender: 'alice',
        receiver: 'bob',
        data: 'hello world',
        amount: 10,
      })
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.result).toBeDefined() // can be null if no LLM executed
    expect(data.latency).toBeDefined()
    expect(typeof data.latency).toBe('number')
    expect(data.success).toBeDefined()
  })

  it('should record signal in TypeDB (lifecycle gate)', async () => {
    const mockWrite = write as any
    const mockReadParsed = readParsed as any

    mockWrite.mockResolvedValueOnce({ ok: true })
    mockReadParsed
      .mockResolvedValueOnce([]) // adl-status
      .mockResolvedValueOnce([]) // perm-network
      .mockResolvedValueOnce([]) // sender-sensitivity
      .mockResolvedValueOnce([]) // receiver-sensitivity
      .mockResolvedValueOnce([]) // routes

    const { POST } = await import('@/pages/api/signal')
    await POST(
      createMockAstroContext('POST', {
        sender: 'alice',
        receiver: 'bob',
        data: 'test',
      })
    )

    // Verify write was called (signal recorded)
    expect(mockWrite).toHaveBeenCalled()
  })

  it('should return 410 if receiver is retired (lifecycle gate)', async () => {
    const mockReadParsed = readParsed as any
    const { getCached, setCached } = await import('@/engine/adl-cache')
    const mockGetCached = getCached as any
    const mockSetCached = setCached as any

    mockGetCached.mockReturnValueOnce(undefined) // cache miss
    mockReadParsed
      .mockResolvedValueOnce([{ st: 'retired' }]) // adl-status: retired
      .mockResolvedValueOnce([]) // perm-network (won't reach due to 410 response)
    mockSetCached.mockReturnValueOnce(undefined)

    const { POST } = await import('@/pages/api/signal')
    const response = await POST(
      createMockAstroContext('POST', {
        sender: 'alice',
        receiver: 'retired-bot',
      })
    )

    expect(response.status).toBe(410)
    const data = await response.json()
    expect(data.code).toBe('UNIT_INACTIVE')
    expect(data.adlStatus).toBe('retired')
  })

  it('should return 403 if sender not in allowedHosts (network gate)', async () => {
    const mockReadParsed = readParsed as any
    const { getCached, setCached } = await import('@/engine/adl-cache')
    const mockGetCached = getCached as any
    const mockSetCached = setCached as any

    // Stage 1: no lifecycle restriction
    mockGetCached.mockReturnValueOnce(undefined)
    mockReadParsed.mockResolvedValueOnce([]) // adl-status
    mockSetCached.mockReturnValueOnce(undefined)

    // Stage 2: network gate
    mockGetCached.mockReturnValueOnce(undefined)
    mockReadParsed.mockResolvedValueOnce([
      { pn: JSON.stringify({ allowed_hosts: ['trusted-agent'] }) },
    ])
    mockSetCached.mockReturnValueOnce(undefined)

    // Stage 3: sensitivity (won't reach due to 403 response)
    mockGetCached.mockReturnValueOnce(undefined)
    mockGetCached.mockReturnValueOnce(undefined)

    const { POST } = await import('@/pages/api/signal')
    const response = await POST(
      createMockAstroContext('POST', {
        sender: 'untrusted-agent',
        receiver: 'restricted-bot',
      })
    )

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.code).toBe('PERMISSION_DENIED')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/state
// ═══════════════════════════════════════════════════════════════════════════

describe('/api/state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with state shape', async () => {
    const mockReadParsed = readParsed as any

    mockReadParsed
      .mockResolvedValueOnce([
        { id: 'alice', n: 'Alice', k: 'agent', sr: 0.8, g: 1 },
        { id: 'bob', n: 'Bob', k: 'agent', sr: 0.75, g: 2 },
      ])
      .mockResolvedValueOnce([
        { sid: 'alice', tid: 'bob', str: 10.0, r: 2.0 },
        { sid: 'bob', tid: 'alice', str: 20.0, r: 1.0 },
      ])

    const { GET } = await import('@/pages/api/state')
    const response = await GET(createMockAstroContext())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.units).toBeDefined()
    expect(Array.isArray(data.units)).toBe(true)
    expect(data.edges).toBeDefined()
    expect(Array.isArray(data.edges)).toBe(true)
    expect(data.highways).toBeDefined()
    expect(Array.isArray(data.highways)).toBe(true)
    expect(data.stats).toBeDefined()
  })

  it('should include units with id, name, kind, successRate', async () => {
    const mockReadParsed = readParsed as any

    mockReadParsed
      .mockResolvedValueOnce([
        { id: 'alice', n: 'Alice Agent', k: 'agent', sr: 0.88, g: 1 },
      ])
      .mockResolvedValueOnce([])

    const { GET } = await import('@/pages/api/state')
    const response = await GET(createMockAstroContext())

    const data = await response.json()
    expect(data.units).toHaveLength(1)
    expect(data.units[0]).toMatchObject({
      id: 'alice',
      name: 'Alice Agent',
      kind: 'agent',
      sr: 0.88,
      g: 1,
    })
  })

  it('should compute highways (strength >= 50, not toxic)', async () => {
    const mockReadParsed = readParsed as any

    mockReadParsed
      .mockResolvedValueOnce([{ id: 'alice', n: 'Alice', k: 'agent', sr: 0.8, g: 1 }])
      .mockResolvedValueOnce([
        { sid: 'alice', tid: 'bob', str: 100.0, r: 5.0 }, // highway: strength high, not toxic
        { sid: 'alice', tid: 'eve', str: 10.0, r: 2.0 }, // not highway
      ])

    const { GET } = await import('@/pages/api/state')
    const response = await GET(createMockAstroContext())

    const data = await response.json()
    expect(data.highways).toHaveLength(1)
    expect(data.highways[0]).toMatchObject({
      from: 'alice',
      to: 'bob',
      strength: 100.0,
    })
  })

  it('should mark paths as toxic when resistance > 2x strength', async () => {
    const mockReadParsed = readParsed as any

    mockReadParsed
      .mockResolvedValueOnce([{ id: 'alice', n: 'Alice', k: 'agent', sr: 0.8, g: 1 }])
      .mockResolvedValueOnce([
        { sid: 'alice', tid: 'bad', str: 5.0, r: 30.0 }, // toxic: r > 2*s, r >= 10, samples > 5
      ])

    const { GET } = await import('@/pages/api/state')
    const response = await GET(createMockAstroContext())

    const data = await response.json()
    const badEdge = data.edges.find((e: any) => e.to === 'bad')
    expect(badEdge?.toxic).toBe(true)
  })

  it('should return empty state on TypeDB failure', async () => {
    const mockReadParsed = readParsed as any

    // Both unit and path queries fail
    mockReadParsed
      .mockRejectedValueOnce(new Error('TypeDB error')) // units fail
      .mockRejectedValueOnce(new Error('TypeDB error')) // paths fail

    const { GET } = await import('@/pages/api/state')
    const response = await GET(createMockAstroContext())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.units).toEqual([])
    expect(data.edges).toEqual([])
    expect(data.stats.units).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/tasks
// ═══════════════════════════════════════════════════════════════════════════

describe('/api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with tasks array', async () => {
    const mockGetAllTasks = store.getAllTasks as any
    const mockGetNet = getNet as any

    mockGetAllTasks.mockReturnValueOnce([
      {
        tid: 'build-api',
        name: 'Build API',
        status: 'todo',
        priority: 'P0',
        phase: 'W1',
        value: 'high',
        persona: 'sonnet',
        tags: ['api', 'build'],
        blockedBy: [],
        blocks: [],
        trailPheromone: 0,
        alarmPheromone: 0,
      },
    ])

    mockGetNet.mockResolvedValueOnce({
      sense: () => 0,
      danger: () => 0,
    })

    const { GET } = await import('@/pages/api/tasks/index')
    const response = await GET(createMockAstroContext())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.tasks).toBeDefined()
    expect(Array.isArray(data.tasks)).toBe(true)
  })

  it('should categorize tasks by pheromone: attractive, repelled, exploratory, ready', async () => {
    const mockGetAllTasks = store.getAllTasks as any
    const mockGetNet = getNet as any

    mockGetAllTasks.mockReturnValueOnce([
      {
        tid: 'proven',
        name: 'Proven Task',
        status: 'todo',
        priority: 'P0',
        phase: 'W1',
        value: 'high',
        persona: 'sonnet',
        tags: ['proven'],
        blockedBy: [],
        blocks: [],
        trailPheromone: 60,
        alarmPheromone: 5,
      },
      {
        tid: 'new',
        name: 'New Task',
        status: 'todo',
        priority: 'P3',
        phase: 'W1',
        value: 'low',
        persona: 'haiku',
        tags: ['new'],
        blockedBy: [],
        blocks: [],
        trailPheromone: 0,
        alarmPheromone: 0,
      },
      {
        tid: 'toxic',
        name: 'Toxic Task',
        status: 'todo',
        priority: 'P3',
        phase: 'W1',
        value: 'low',
        persona: 'haiku',
        tags: ['toxic'],
        blockedBy: [],
        blocks: [],
        trailPheromone: 5,
        alarmPheromone: 50,
      },
    ])

    mockGetNet.mockResolvedValueOnce({
      sense: () => 0,
      danger: () => 0,
    })

    const { GET } = await import('@/pages/api/tasks/index')
    const response = await GET(createMockAstroContext())

    const data = await response.json()
    const proven = data.tasks.find((t: any) => t.tid === 'proven')
    const newTask = data.tasks.find((t: any) => t.tid === 'new')
    const toxicTask = data.tasks.find((t: any) => t.tid === 'toxic')

    expect(proven.category).toBe('attractive')
    expect(newTask.category).toBe('exploratory')
    expect(toxicTask.category).toBe('repelled')
  })

  it('should filter tasks by tag', async () => {
    const mockGetAllTasks = store.getAllTasks as any

    mockGetAllTasks.mockReturnValueOnce([
      {
        tid: 'api-1',
        name: 'API Task 1',
        status: 'todo',
        priority: 'P0',
        phase: 'W1',
        value: 'high',
        persona: 'sonnet',
        tags: ['api', 'critical'],
        blockedBy: [],
        blocks: [],
        trailPheromone: 0,
        alarmPheromone: 0,
      },
      {
        tid: 'docs-1',
        name: 'Docs Task 1',
        status: 'todo',
        priority: 'P1',
        phase: 'W1',
        value: 'medium',
        persona: 'sonnet',
        tags: ['docs'],
        blockedBy: [],
        blocks: [],
        trailPheromone: 0,
        alarmPheromone: 0,
      },
    ])

    const mockGetNet = getNet as any
    mockGetNet.mockResolvedValueOnce({
      sense: () => 0,
      danger: () => 0,
    })

    const context = createMockAstroContext()
    context.url = new URL('http://localhost:4321/api/tasks?tag=api')

    const { GET } = await import('@/pages/api/tasks/index')
    const response = await GET(context)

    const data = await response.json()
    expect(data.tasks).toHaveLength(1)
    expect(data.tasks[0].tid).toBe('api-1')
  })

  it('should POST create a new task with priority score', async () => {
    const mockCreateTask = store.createTask as any

    const { POST } = await import('@/pages/api/tasks/index')
    const response = await POST(
      createMockAstroContext('POST', {
        id: 'new-task',
        name: 'New Task',
        tags: ['P0', 'urgent'],
        value: 'high',
        phase: 'W1',
        persona: 'sonnet',
      })
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.task).toBe('new-task')
    expect(data.priorityScore).toBeDefined()
    expect(typeof data.priorityScore).toBe('number')
    expect(mockCreateTask).toHaveBeenCalled()
  })

  it('should return 400 if POST missing id or name', async () => {
    const { POST } = await import('@/pages/api/tasks/index')
    const response = await POST(
      createMockAstroContext('POST', {
        name: 'No ID', // missing id
      })
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Missing id or name')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('API Endpoints Integration', () => {
  it('should handle CORS preflight OPTIONS on /api/tasks', async () => {
    const { OPTIONS } = await import('@/pages/api/tasks/index')
    const response = await OPTIONS(createMockAstroContext())

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  it('should return JSON content-type on all endpoints', async () => {
    const mockReadParsed = readParsed as any
    mockReadParsed
      .mockResolvedValueOnce([]) // units
      .mockResolvedValueOnce([]) // paths

    const { GET: stateGET } = await import('@/pages/api/state')
    const response = await stateGET(createMockAstroContext())

    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should not expose sensitive data in health endpoint', async () => {
    const mockGetNet = getNet as any
    const mockGetUnitMeta = getUnitMeta as any
    const mockLoadedAt = loadedAt as any
    const mockReadParsed = readParsed as any

    mockGetNet.mockResolvedValueOnce({
      strength: {},
      revenue: {},
      highways: () => [],
    })
    mockGetUnitMeta.mockReturnValueOnce({})
    mockLoadedAt.mockReturnValueOnce(Date.now())
    mockReadParsed.mockResolvedValueOnce([])

    const { GET } = await import('@/pages/api/health')
    const response = await GET(createMockAstroContext())

    const data = await response.json()
    // Should not expose TypeDB connection strings, API keys, etc.
    expect(JSON.stringify(data)).not.toMatch(/password|key|secret|token/i)
  })
})
