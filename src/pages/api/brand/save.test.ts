import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks must be declared before imports ─────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/lib/typedb', () => ({
  writeSilent: vi.fn(),
  readParsed: vi.fn(),
}))

vi.mock('@/engine/brand', () => ({
  invalidateBrandCache: vi.fn(),
}))

import { invalidateBrandCache } from '@/engine/brand'
import { auth } from '@/lib/auth'
import { readParsed, writeSilent } from '@/lib/typedb'
import { POST } from '@/pages/api/brand/save'

// ── Typed mock handles ────────────────────────────────────────────────────────

const mockGetSession = vi.mocked(auth.api.getSession)
const mockReadParsed = vi.mocked(readParsed)
const mockWriteSilent = vi.mocked(writeSilent)
const mockInvalidate = vi.mocked(invalidateBrandCache)

// ── Minimal fake session ──────────────────────────────────────────────────────

const fakeSession = {
  user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
  session: { id: 'sess-abc' },
}

// ── Minimal AstroCookies shim ─────────────────────────────────────────────────

function makeCookies() {
  const setCalls: { name: string; value: string; opts?: unknown }[] = []
  return {
    set: vi.fn((name: string, value: string, opts?: unknown) => {
      setCalls.push({ name, value, opts })
    }),
    _calls: setCalls,
  }
}

// ── Helper to build a minimal Astro APIRoute context ─────────────────────────

function makeCtx(body: unknown) {
  const request = new Request('https://example.com/api/brand/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const cookies = makeCookies()
  return { request, cookies }
}

const fakeBrand = { primary: '#7c3aed', secondary: '#a78bfa' }

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/brand/save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. No session → 401 ───────────────────────────────────────────────────
  it('returns 401 when no session (thing scope)', async () => {
    mockGetSession.mockResolvedValue(null)
    const { request, cookies } = makeCtx({ scope: 'thing', id: 'thing-1', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(401)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toMatch(/unauthorized/i)
  })

  it('returns 401 when no session (group scope)', async () => {
    mockGetSession.mockResolvedValue(null)
    const { request, cookies } = makeCtx({ scope: 'group', id: 'grp-1', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(401)
  })

  // ── 2. user scope — sets cookie, no TypeDB writes ─────────────────────────
  // Note: user scope does NOT call getSession — it sets a cookie and returns
  // immediately. Auth is not required for user-scoped brand preferences.
  it('scope=user: sets ds.brand cookie and returns 200 without DB writes', async () => {
    const { request, cookies } = makeCtx({ scope: 'user', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.ok).toBe(true)

    // Cookie was set
    expect(cookies.set).toHaveBeenCalledOnce()
    const [name, value] = (cookies.set as ReturnType<typeof vi.fn>).mock.calls[0] as [string, string, unknown]
    expect(name).toBe('ds.brand')
    // Value is base64 of JSON
    expect(atob(value)).toBe(JSON.stringify(fakeBrand))

    // No TypeDB side-effects
    expect(mockWriteSilent).not.toHaveBeenCalled()
    expect(mockReadParsed).not.toHaveBeenCalled()
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  // ── 3. group scope, user NOT a member → 403 ───────────────────────────────
  it('scope=group: returns 403 when user is not a member', async () => {
    mockGetSession.mockResolvedValue(fakeSession as never)
    mockReadParsed.mockResolvedValue([])
    const { request, cookies } = makeCtx({ scope: 'group', id: 'grp-99', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(403)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toMatch(/forbidden/i)
    expect(mockWriteSilent).not.toHaveBeenCalled()
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  // ── 4. group scope, user IS a member → writes + invalidates ──────────────
  it('scope=group: calls writeSilent twice + invalidateBrandCache when member', async () => {
    mockGetSession.mockResolvedValue(fakeSession as never)
    mockReadParsed.mockResolvedValue([{ m: 'user-123' }])
    const { request, cookies } = makeCtx({ scope: 'group', id: 'grp-1', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(200)
    expect(((await res.json()) as Record<string, unknown>).ok).toBe(true)

    // delete-has then insert
    expect(mockWriteSilent).toHaveBeenCalledTimes(2)
    const [firstCall, secondCall] = mockWriteSilent.mock.calls
    expect(firstCall[0]).toContain('delete has brand')
    expect(secondCall[0]).toContain('insert $e has brand')

    // cache busted
    expect(mockInvalidate).toHaveBeenCalledOnce()
  })

  // ── 5a. thing scope, no prior owner → first-save stamps owner + writes brand ──
  // Schema: `thing owns owner`. First save stamps `has owner "${userId}"` before
  // the brand write. Subsequent saves must match.
  it('scope=thing, no prior owner: stamps owner + writes brand + invalidates cache', async () => {
    mockGetSession.mockResolvedValue(fakeSession as never)
    // owner-check returns empty → first save
    mockReadParsed.mockResolvedValueOnce([])
    const { request, cookies } = makeCtx({ scope: 'thing', id: 'thing-42', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(200)
    // readParsed called once for the owner probe
    expect(mockReadParsed).toHaveBeenCalledTimes(1)
    expect(mockReadParsed.mock.calls[0]?.[0]).toContain('has owner $o')
    // writeSilent: stamp owner + delete brand + insert brand = 3
    expect(mockWriteSilent).toHaveBeenCalledTimes(3)
    const stampCall = mockWriteSilent.mock.calls[0]?.[0] ?? ''
    expect(stampCall).toContain('insert $e has owner')
    expect(stampCall).toContain('user-123')
    expect(mockInvalidate).toHaveBeenCalledOnce()
  })

  // ── 5b. thing scope, existing owner matches session user → proceeds ──────
  it('scope=thing, owner matches session: writes brand normally', async () => {
    mockGetSession.mockResolvedValue(fakeSession as never)
    mockReadParsed.mockResolvedValueOnce([{ o: 'user-123' }])
    const { request, cookies } = makeCtx({ scope: 'thing', id: 'thing-42', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(200)
    expect(mockWriteSilent).toHaveBeenCalledTimes(2) // only brand delete + insert; no stamp
    expect(mockInvalidate).toHaveBeenCalledOnce()
  })

  // ── 5c. thing scope, existing owner mismatch → 403 ───────────────────────
  it('scope=thing, owner mismatch: returns 403, no writes', async () => {
    mockGetSession.mockResolvedValue(fakeSession as never)
    mockReadParsed.mockResolvedValueOnce([{ o: 'someone-else' }])
    const { request, cookies } = makeCtx({ scope: 'thing', id: 'thing-42', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(403)
    expect(mockWriteSilent).not.toHaveBeenCalled()
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  // ── 6. Missing brand body → 400 ──────────────────────────────────────────
  it('returns 400 when brand is missing', async () => {
    const { request, cookies } = makeCtx({ scope: 'user' })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toMatch(/brand/i)
  })

  // ── 7. Invalid scope → 400 ────────────────────────────────────────────────
  it('returns 400 for an invalid scope value', async () => {
    const { request, cookies } = makeCtx({ scope: 'other', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toMatch(/invalid scope/i)
  })

  // ── 8. Missing id for group scope → 400 ──────────────────────────────────
  it('returns 400 when id is missing for group scope', async () => {
    const { request, cookies } = makeCtx({ scope: 'group', brand: fakeBrand })

    const res = await POST({ request, cookies } as never)

    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toMatch(/id is required/i)
  })
})
