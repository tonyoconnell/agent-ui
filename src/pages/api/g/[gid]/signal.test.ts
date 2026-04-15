import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'
import { POST } from '@/pages/api/g/[gid]/signal'

const mockReadParsed = vi.mocked(readParsed)

function makeRequest(gid: string, body: unknown) {
  return {
    params: { gid },
    request: {
      json: () => Promise.resolve(body),
      headers: { get: (_: string) => null },
      url: `http://localhost/api/g/${gid}/signal`,
    },
  } as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/g/[gid]/signal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('dissolves (404) when unit is not a group member', async () => {
    mockReadParsed.mockResolvedValueOnce([]) // no membership row

    const res = await POST(makeRequest('acme', { receiver: 'stranger:task' }))
    const body = (await res.json()) as { dissolved: boolean }

    expect(res.status).toBe(404)
    expect(body.dissolved).toBe(true)
  })

  it('returns 400 when receiver is missing', async () => {
    const res = await POST(makeRequest('acme', {}))
    expect(res.status).toBe(400)
  })

  it('checks membership using the unit id segment before the colon', async () => {
    mockReadParsed.mockResolvedValueOnce([]) // member not found → 404
    await POST(makeRequest('acme', { receiver: 'marketing:cmo:write' }))
    const tql = mockReadParsed.mock.calls[0][0] as string
    // unit id extracted from 'marketing:cmo:write' → 'marketing'
    expect(tql).toContain('"marketing"')
    expect(tql).toContain('"acme"')
    expect(tql).toContain('membership')
  })
})
