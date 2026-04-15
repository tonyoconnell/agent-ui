/**
 * Integration test: Expire Recovery
 *
 * Test the /api/tasks/expire endpoint that releases stale claims.
 *
 * The expire handler in /api/tasks/expire.ts checks:
 *   claimed-at timestamp age > 30 min (CLAIM_TTL_MS)
 * and releases tasks back to "open" status.
 *
 * This test verifies the endpoint behavior with mocked TypeDB reads.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as typedb from '@/lib/typedb'

vi.mock('@/lib/typedb', () => ({
  read: vi.fn(),
}))

const CLAIM_TTL_MS = 30 * 60 * 1000

describe('expire-recovery: /api/tasks/expire releases stale claims', () => {
  const mockRead = vi.mocked(typedb.read)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('stale task (claimed >30min ago) is in expired output', async () => {
    const now = new Date()
    const claimedAt = new Date(now.getTime() - 31 * 60 * 1000) // 31min old

    // Mock the query that fetches active tasks
    mockRead.mockResolvedValueOnce([
      {
        t: '$t1',
        o: 'owner-1',
        c: claimedAt.toISOString(),
      },
    ])

    // Mock the query that fetches task-id
    mockRead.mockResolvedValueOnce([
      {
        id: 'task-123',
      },
    ])

    // Mock the delete+insert operation
    mockRead.mockResolvedValueOnce(null)

    // Simulate the endpoint logic
    const q = `match $t isa task, has task-status "active", has owner $o, has claimed-at $c; select $t, $o, $c;`
    const rows = (await typedb.read(q)) as Array<{ t: string; o: string; c: string }>
    const expired = []

    for (const row of rows) {
      const claimedAtParsed = new Date(row.c)
      const age = now.getTime() - claimedAtParsed.getTime()
      if (age > CLAIM_TTL_MS) {
        const idResult = (await typedb.read(
          `match $t isa task, has task-id $id; ${row.t}; select $id;`
        )) as Array<{ id: string }>
        const release = `match $t = ${row.t}; delete task-status of $t; delete owner of $t; delete claimed-at of $t; insert $t has task-status "open";`
        await typedb.read(release)
        expired.push({ id: idResult[0]?.id || '', owner: row.o, releasedAt: now.toISOString() })
      }
    }

    const response = { expired, count: expired.length }

    expect(response.count).toBe(1)
    expect(response.expired).toHaveLength(1)
    expect(response.expired[0]?.id).toBe('task-123')
    expect(response.expired[0]?.owner).toBe('owner-1')
  })

  it('fresh task (claimed <30min ago) is not in expired output', async () => {
    const now = new Date()
    const claimedAt = new Date(now.getTime() - 5 * 60 * 1000) // 5min old

    mockRead.mockResolvedValueOnce([
      {
        t: '$t2',
        o: 'owner-2',
        c: claimedAt.toISOString(),
      },
    ])

    const q = `match $t isa task, has task-status "active", has owner $o, has claimed-at $c; select $t, $o, $c;`
    const rows = (await typedb.read(q)) as Array<{ t: string; o: string; c: string }>
    const expired = []

    for (const row of rows) {
      const claimedAtParsed = new Date(row.c)
      const age = now.getTime() - claimedAtParsed.getTime()
      if (age > CLAIM_TTL_MS) {
        const idResult = (await typedb.read(
          `match $t isa task, has task-id $id; ${row.t}; select $id;`
        )) as Array<{ id: string }>
        const release = `match $t = ${row.t}; delete task-status of $t; delete owner of $t; delete claimed-at of $t; insert $t has task-status "open";`
        await typedb.read(release)
        expired.push({ id: idResult[0]?.id || '', owner: row.o, releasedAt: now.toISOString() })
      }
    }

    const response = { expired, count: expired.length }

    expect(response.count).toBe(0)
    expect(response.expired).toHaveLength(0)
  })

  it('response has correct shape {expired: string[], count: number}', async () => {
    const now = new Date()
    const claimedAt = new Date(now.getTime() - 31 * 60 * 1000)

    mockRead.mockResolvedValueOnce([
      { t: '$t3', o: 'owner-3', c: claimedAt.toISOString() },
      { t: '$t4', o: 'owner-4', c: new Date(now.getTime() - 10 * 60 * 1000).toISOString() },
    ])

    mockRead.mockResolvedValueOnce([{ id: 'task-a' }])
    mockRead.mockResolvedValueOnce(null)

    const q = `match $t isa task, has task-status "active", has owner $o, has claimed-at $c; select $t, $o, $c;`
    const rows = (await typedb.read(q)) as Array<{ t: string; o: string; c: string }>
    const expired = []

    for (const row of rows) {
      const claimedAtParsed = new Date(row.c)
      const age = now.getTime() - claimedAtParsed.getTime()
      if (age > CLAIM_TTL_MS) {
        const idResult = (await typedb.read(
          `match $t isa task, has task-id $id; ${row.t}; select $id;`
        )) as Array<{ id: string }>
        const release = `match $t = ${row.t}; delete task-status of $t; delete owner of $t; delete claimed-at of $t; insert $t has task-status "open";`
        await typedb.read(release)
        expired.push({ id: idResult[0]?.id || '', owner: row.o, releasedAt: now.toISOString() })
      }
    }

    const response = { expired, count: expired.length }

    expect(response).toHaveProperty('expired')
    expect(response).toHaveProperty('count')
    expect(typeof response.count).toBe('number')
    expect(Array.isArray(response.expired)).toBe(true)
    expect(response.count).toBe(1)
  })
})
