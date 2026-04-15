import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'
import { GET } from '@/pages/api/g/[gid]/highways'

const mockReadParsed = vi.mocked(readParsed)

function makeContext(gid: string, limit?: string) {
  const url = new URL(`http://localhost/api/g/${gid}/highways`)
  if (limit) url.searchParams.set('limit', limit)
  return {
    params: { gid },
    url,
  } as unknown as Parameters<typeof GET>[0]
}

describe('GET /api/g/[gid]/highways', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns strength-sorted group paths', async () => {
    mockReadParsed.mockResolvedValueOnce([{ from: 'marketing:cmo', to: 'marketing:creative', s: 42 }])

    const res = await GET(makeContext('marketing'))
    const body = (await res.json()) as Array<{ from: string; to: string; strength: number }>

    expect(res.status).toBe(200)
    expect(body[0]).toMatchObject({ from: 'marketing:cmo', to: 'marketing:creative', strength: 42 })
  })

  it('filters by group membership on both endpoints', async () => {
    mockReadParsed.mockResolvedValueOnce([])
    await GET(makeContext('acme', '10'))
    const tql = mockReadParsed.mock.calls[0][0] as string
    expect(tql).toContain('"acme"')
    expect(tql).toContain('membership')
    expect(tql).toContain('limit 10')
  })

  it('returns empty on TypeDB error', async () => {
    mockReadParsed.mockRejectedValueOnce(new Error('timeout'))
    const res = await GET(makeContext('x'))
    expect(await res.json()).toEqual([])
  })
})
