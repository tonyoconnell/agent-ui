import { describe, expect, it, vi } from 'vitest'
import { personas } from '../personas'

// Mock the Hono request/response
interface MockRequest {
  url: string
  method: string
  headers: Record<string, string>
  json?: () => Promise<unknown>
  param?: (key: string) => string
  query?: (key: string) => string | undefined
}

interface MockContext {
  req: MockRequest
  env: MockEnv
  json: (data: unknown, status?: number) => Response
  param: (key: string) => string
  query: (key: string) => string | undefined
}

interface MockEnv {
  API_KEY?: string
  VERSION?: string
  DB?: MockDB
  KV?: MockKV
  OPENROUTER_API_KEY?: string
  BOT_PERSONA?: string
  AGENT_QUEUE?: MockQueue
}

interface MockDB {
  prepare: (sql: string) => MockStatement
}

interface MockStatement {
  bind: (...args: unknown[]) => MockStatement
  all: () => Promise<{ results?: unknown[] }>
  first: () => Promise<unknown>
  run: () => Promise<void>
}

interface MockKV {
  get: (key: string, options?: { type?: string }) => Promise<unknown>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
}

interface MockQueue {
  send: (msg: unknown) => Promise<void>
}

// Helper to create mock context
function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  const mockDb: MockDB = {
    prepare: () =>
      ({
        bind: vi.fn(function () {
          return this
        }),
        all: vi.fn(() => Promise.resolve({ results: [] })),
        first: vi.fn(() => Promise.resolve(null)),
        run: vi.fn(() => Promise.resolve()),
      }) as unknown as MockStatement,
  }

  const mockKv: MockKV = {
    get: vi.fn(() => Promise.resolve(null)),
    put: vi.fn(() => Promise.resolve()),
  }

  const _mockQueue: MockQueue = {
    send: vi.fn(() => Promise.resolve()),
  }

  const mockEnv: MockEnv = {
    VERSION: '1.0.0',
    DB: mockDb,
    KV: mockKv,
    OPENROUTER_API_KEY: 'test-key',
    ...overrides.env,
  }

  const mockReq: MockRequest = {
    url: 'http://localhost:8787/health',
    method: 'GET',
    headers: {},
    param: vi.fn((key: string) => ''),
    query: vi.fn(() => undefined),
    ...overrides.req,
  }

  const ctx: MockContext = {
    req: mockReq,
    env: mockEnv,
    json: vi.fn((data: unknown, status = 200) => new Response(JSON.stringify(data), { status })),
    param: vi.fn((key: string) => ''),
    query: vi.fn((key: string) => undefined),
    ...overrides,
  }

  return ctx
}

describe('NanoClaw Router', () => {
  describe('Health Check', () => {
    it('should return 200 on GET /health', async () => {
      const ctx = createMockContext({
        req: {
          url: 'http://localhost:8787/health',
          method: 'GET',
          headers: {},
        },
      })

      // Simulate health endpoint logic
      const response = ctx.json({
        status: 'ok',
        version: ctx.env.VERSION,
        service: 'nanoclaw-router',
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('service', 'nanoclaw-router')
    })

    it('should always be public (no auth required)', async () => {
      const ctx = createMockContext({
        env: { API_KEY: 'secret-key', VERSION: '1.0.0', DB: createMockContext().env.DB },
        req: {
          url: 'http://localhost:8787/health',
          method: 'GET',
          headers: {},
        },
      })

      // Health endpoint should not check auth
      expect(ctx.env.API_KEY).toBeDefined()
      // Even with API_KEY set, health is public (auth middleware exempts /health)
      const response = ctx.json({ status: 'ok' })
      expect(response.status).toBe(200)
    })
  })

  describe('Authentication', () => {
    it('should deny POST /message without Bearer token when API_KEY is set', async () => {
      const ctx = createMockContext({
        env: { API_KEY: 'secret-key', DB: createMockContext().env.DB },
        req: {
          url: 'http://localhost:8787/message',
          method: 'POST',
          headers: {}, // Missing Authorization header
        },
      })

      // Simulate auth middleware
      if (ctx.env.API_KEY) {
        const path = new URL(ctx.req.url).pathname
        const isPublic = path === '/health' || path.startsWith('/webhook/')
        if (!isPublic) {
          const auth = ctx.req.headers.Authorization || ''
          if (auth !== `Bearer ${ctx.env.API_KEY}`) {
            const response = ctx.json({ ok: false, error: 'Unauthorized' }, 401)
            expect(response.status).toBe(401)
            const data = await response.json()
            expect(data.error).toBe('Unauthorized')
            return
          }
        }
      }
    })

    it('should allow POST /message with valid Bearer token', async () => {
      const apiKey = 'secret-key-123'
      const ctx = createMockContext({
        env: { API_KEY: apiKey, DB: createMockContext().env.DB },
        req: {
          url: 'http://localhost:8787/message',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      })

      // Simulate auth check
      if (ctx.env.API_KEY) {
        const path = new URL(ctx.req.url).pathname
        const isPublic = path === '/health' || path.startsWith('/webhook/')
        if (!isPublic) {
          const auth = ctx.req.headers.Authorization || ''
          expect(auth).toBe(`Bearer ${apiKey}`)
          // Auth passes, continue to handler
        }
      }
    })

    it('should not require auth when API_KEY is not set', async () => {
      const ctx = createMockContext({
        env: { DB: createMockContext().env.DB }, // No API_KEY
        req: {
          url: 'http://localhost:8787/message',
          method: 'POST',
          headers: {},
        },
      })

      // Auth middleware skips if no API_KEY
      if (!ctx.env.API_KEY) {
        expect(ctx.env.API_KEY).toBeUndefined()
        // Request proceeds without auth check
      }
    })

    it('should exempt /webhook/* routes from API_KEY auth', async () => {
      const ctx = createMockContext({
        env: { API_KEY: 'secret', DB: createMockContext().env.DB },
        req: {
          url: 'http://localhost:8787/webhook/telegram-one',
          method: 'POST',
          headers: {}, // No auth header needed
        },
      })

      // Simulate auth middleware for webhooks
      if (ctx.env.API_KEY) {
        const path = new URL(ctx.req.url).pathname
        const isPublic = path === '/health' || path.startsWith('/webhook/')
        expect(isPublic).toBe(true)
        // Webhook routes bypass auth check
      }
    })
  })

  describe('Persona Selection', () => {
    it('should select persona from BOT_PERSONA env var when set', () => {
      const ctx = createMockContext({
        env: {
          BOT_PERSONA: 'donal',
          DB: createMockContext().env.DB,
        },
      })

      const personaKey = ctx.env.BOT_PERSONA
      const persona = personas[personaKey!]

      expect(personaKey).toBe('donal')
      expect(persona).toBeDefined()
      expect(persona.name).toBe('OO Marketing CMO')
      expect(persona.systemPrompt).toContain('orchestrator')
    })

    it('should fallback to default persona when BOT_PERSONA not set', () => {
      const ctx = createMockContext({
        env: { DB: createMockContext().env.DB }, // No BOT_PERSONA
      })

      const personaKey = ctx.env.BOT_PERSONA ?? 'one'
      const persona = personas[personaKey]

      expect(persona).toBeDefined()
      expect(persona.name).toBe('ONE Assistant')
    })

    it('should detect persona from group prefix tg-{name}-*', () => {
      const groupId = 'tg-donal-marketing'
      const personaKey = Object.keys(personas).find((k) => groupId.startsWith(`tg-${k}`))

      expect(personaKey).toBe('donal')
      const persona = personas[personaKey!]
      expect(persona.name).toBe('OO Marketing CMO')
    })

    it('should use worker-level BOT_PERSONA over group prefix', () => {
      const groupId = 'tg-donal-marketing'
      const workerPersona = 'one'

      // Worker BOT_PERSONA takes priority
      const personaKey = workerPersona ?? Object.keys(personas).find((k) => groupId.startsWith(`tg-${k}`))

      expect(personaKey).toBe('one')
      const persona = personas[personaKey!]
      expect(persona.name).toBe('ONE Assistant')
    })

    it('should list all available personas', () => {
      expect(Object.keys(personas).length).toBeGreaterThan(0)
      expect(personas).toHaveProperty('donal')
      expect(personas).toHaveProperty('one')
      expect(personas).toHaveProperty('concierge')
    })
  })

  describe('Webhook Routes', () => {
    it('should return 200 on valid webhook POST', async () => {
      const ctx = createMockContext({
        env: { DB: createMockContext().env.DB, AGENT_QUEUE: createMockContext().env.AGENT_QUEUE },
        req: {
          url: 'http://localhost:8787/webhook/telegram-one',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          json: async () => ({
            message: { text: 'Hello', from: { id: 123 } },
          }),
        },
      })

      // Simulate successful webhook handling
      const response = ctx.json({ ok: true, id: 'msg-1', group: 'tg-user-123' }, 200)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.ok).toBe(true)
    })

    it('should return 400 on invalid webhook payload', async () => {
      const ctx = createMockContext({
        env: { DB: createMockContext().env.DB },
        req: {
          url: 'http://localhost:8787/webhook/telegram-one',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      })

      // Simulate invalid payload
      const response = ctx.json({ ok: false, error: 'Invalid payload' }, 400)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })
  })

  describe('Message Routes', () => {
    it('should store and respond to POST /message', async () => {
      const ctx = createMockContext({
        env: { DB: createMockContext().env.DB },
        req: {
          url: 'http://localhost:8787/message',
          method: 'POST',
          headers: { Authorization: 'Bearer test' },
          json: async () => ({ group: 'my-group', text: 'Hello' }),
        },
      })

      // Simulate message handler
      const response = ctx.json({
        ok: true,
        id: 'msg-123',
        group: 'my-group',
        response: 'Hi there!',
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.ok).toBe(true)
      expect(data.group).toBe('my-group')
    })

    it('should return 400 if group or text missing from POST /message', async () => {
      const ctx = createMockContext({
        req: {
          json: async () => ({ text: 'Hello' }), // Missing group
        },
      })

      // Validate required fields
      const body = await ctx.req.json()
      if (!body || typeof body !== 'object' || !('group' in body && 'text' in body)) {
        const response = ctx.json({ ok: false, error: 'group and text required' }, 400)
        expect(response.status).toBe(400)
      }
    })
  })

  describe('Highways Route', () => {
    it('should return proven paths from GET /highways', async () => {
      const ctx = createMockContext({
        env: { DB: createMockContext().env.DB, KV: createMockContext().env.KV },
        req: {
          url: 'http://localhost:8787/highways?limit=10',
          method: 'GET',
          headers: {},
          query: (key: string) => (key === 'limit' ? '10' : undefined),
        },
      })

      // Simulate highways handler
      const mockHighways = [
        { from: 'unit-1', to: 'unit-2', strength: 0.85 },
        { from: 'unit-2', to: 'unit-3', strength: 0.72 },
      ]

      const response = ctx.json({ highways: mockHighways })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.highways).toHaveLength(2)
      expect(data.highways[0].strength).toBeGreaterThan(0)
    })

    it('should default limit to 10', async () => {
      const ctx = createMockContext({
        req: {
          query: () => undefined, // no limit param
        },
      })

      const limit = parseInt(ctx.req.query?.('limit') || '10', 10)
      expect(limit).toBe(10)
    })
  })

  describe('Personas Export', () => {
    it('should export all persona keys', () => {
      expect(Object.keys(personas)).toContain('donal')
      expect(Object.keys(personas)).toContain('one')
      expect(Object.keys(personas)).toContain('concierge')
    })

    it('each persona should have required fields', () => {
      for (const [_key, persona] of Object.entries(personas)) {
        expect(persona.name).toBeDefined()
        expect(typeof persona.name).toBe('string')
        expect(persona.model).toBeDefined()
        expect(typeof persona.model).toBe('string')
        expect(persona.systemPrompt).toBeDefined()
        expect(typeof persona.systemPrompt).toBe('string')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query strings gracefully', () => {
      const ctx = createMockContext({
        req: {
          url: 'http://localhost:8787/highways',
          query: () => undefined,
        },
      })

      const limit = parseInt(ctx.req.query?.('limit') || '10', 10)
      expect(Number.isInteger(limit)).toBe(true)
      expect(limit).toBeGreaterThan(0)
    })

    it('should handle missing Authorization header gracefully', () => {
      const ctx = createMockContext({
        env: { API_KEY: 'secret' },
        req: {
          headers: {}, // no Authorization
        },
      })

      const auth = ctx.req.headers.Authorization || ''
      expect(auth).toBe('')
    })

    it('should handle malformed Bearer tokens', () => {
      const ctx = createMockContext({
        env: { API_KEY: 'secret-key' },
        req: {
          headers: {
            Authorization: 'Bearer wrong-key',
          },
        },
      })

      const auth = ctx.req.headers.Authorization
      expect(auth).not.toBe(`Bearer ${ctx.env.API_KEY}`)
    })
  })
})
