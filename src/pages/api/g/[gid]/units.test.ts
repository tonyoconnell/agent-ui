import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'
import { GET } from '@/pages/api/g/[gid]/units'

const mockReadParsed = vi.mocked(readParsed)

function makeContext(gid: string) {
  return {
    params: { gid },
  } as unknown as Parameters<typeof GET>[0]
}

describe('GET /api/g/[gid]/units', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns units filtered by group membership', async () => {
    mockReadParsed.mockResolvedValueOnce([
      { id: 'marketing:creative', n: 'Creative' },
      { id: 'marketing:cmo', n: 'CMO' },
    ])

    const res = await GET(makeContext('marketing'))
    const body = (await res.json()) as Array<{ uid: string; name: string }>

    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body[0].uid).toBe('marketing:creative')
    expect(body[0].name).toBe('Creative')
  })

  it('returns empty array on TypeDB error', async () => {
    mockReadParsed.mockRejectedValueOnce(new Error('TypeDB timeout'))

    const res = await GET(makeContext('broken'))
    const body = (await res.json()) as Record<string, unknown>[]

    expect(body).toEqual([])
  })

  it('passes gid into TQL membership filter', async () => {
    mockReadParsed.mockResolvedValueOnce([])
    await GET(makeContext('acme'))
    const tql = mockReadParsed.mock.calls[0][0] as string
    expect(tql).toContain('"acme"')
    expect(tql).toContain('membership')
  })
})
