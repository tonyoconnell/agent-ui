import { describe, expect, it, vi } from 'vitest'

// Inline mock for D1Database — avoids @cloudflare/workers-types import issues in vitest
function makeDb(rows: { uid: string }[]) {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(rows[0] ?? null),
      }),
    }),
  } as unknown as import('@cloudflare/workers-types').D1Database
}

describe('resolveTagReceiver', () => {
  it('returns null when db is null', async () => {
    const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
    const result = await resolveTagReceiver('seo', null)
    expect(result).toBeNull()
  })

  it('returns null when no subscriber exists', async () => {
    const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
    const db = makeDb([])
    const result = await resolveTagReceiver('seo', db)
    expect(result).toBeNull()
  })

  it('returns uid when a public subscriber exists', async () => {
    const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
    const db = makeDb([{ uid: 'alice' }])
    const result = await resolveTagReceiver('seo', db)
    expect(result).toBe('alice')
  })

  it('queries with public scope filter', async () => {
    const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
    const db = makeDb([{ uid: 'alice' }])
    await resolveTagReceiver('marketing', db)
    const bindCall = (db.prepare as ReturnType<typeof vi.fn>).mock.results[0].value.bind
    expect(bindCall).toHaveBeenCalledWith('marketing', 'public')
  })

  it('returns null when D1 throws', async () => {
    const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('D1 error')),
        }),
      }),
    } as unknown as import('@cloudflare/workers-types').D1Database
    const result = await resolveTagReceiver('seo', db)
    expect(result).toBeNull()
  })
})
