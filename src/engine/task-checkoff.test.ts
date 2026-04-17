import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({ writeSilent: vi.fn().mockResolvedValue(undefined) }))

import { writeSilent } from '@/lib/typedb'
import { selfCheckoff } from './task-checkoff'

const mockWrite = vi.mocked(writeSilent)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('selfCheckoff', () => {
  it('W4 PASS — ok:true, writes done status to TypeDB', async () => {
    const r = await selfCheckoff('T-1', {
      result: { taskId: 'T-1', verify: { ok: true, score: 0.88, message: 'PASS' } },
    })
    expect(r.ok).toBe(true)
    expect(r.outcome).toBe('result')
    expect(r.rubricScore).toBe(0.88)
    const call = mockWrite.mock.calls[0][0]
    expect(call).toContain('"done"')
    expect(call).toContain('done true')
  })

  it('W4 FAIL — ok:false, writes failed status to TypeDB', async () => {
    const r = await selfCheckoff('T-2', {
      result: { taskId: 'T-2', verify: { ok: false, score: 0.3, message: 'FAIL' } },
    })
    expect(r.ok).toBe(false)
    expect(r.outcome).toBe('failure')
    expect(r.rubricScore).toBe(0.3)
    const call = mockWrite.mock.calls[0][0]
    expect(call).toContain('"failed"')
  })

  it('no verify in envelope — ok:true (non-wave task backward compat)', async () => {
    const r = await selfCheckoff('T-3', { result: { taskId: 'T-3', someData: true } })
    expect(r.ok).toBe(true)
    expect(r.outcome).toBe('result')
    expect(r.rubricScore).toBeUndefined()
  })

  it('timeout — ok:false, no TypeDB write', async () => {
    const r = await selfCheckoff('T-4', { timeout: true })
    expect(r.ok).toBe(false)
    expect(r.outcome).toBe('timeout')
    expect(mockWrite).not.toHaveBeenCalled()
  })

  it('dissolved — ok:false, no TypeDB write', async () => {
    const r = await selfCheckoff('T-5', { dissolved: true })
    expect(r.ok).toBe(false)
    expect(r.outcome).toBe('dissolved')
    expect(mockWrite).not.toHaveBeenCalled()
  })

  it('failure — ok:false, writes failed status', async () => {
    const r = await selfCheckoff('T-6', { failure: true })
    expect(r.ok).toBe(false)
    expect(r.outcome).toBe('failure')
    expect(mockWrite.mock.calls[0][0]).toContain('"failed"')
  })

  it('invalid taskId — ok:false, no TypeDB write (injection guard)', async () => {
    const r = await selfCheckoff("'; DROP TABLE task; --", { result: { verify: { ok: true } } })
    expect(r.ok).toBe(false)
    expect(mockWrite).not.toHaveBeenCalled()
  })

  it('rubricScore surfaced from verify.score on both PASS and FAIL', async () => {
    const pass = await selfCheckoff('T-7', { result: { verify: { ok: true, score: 0.91 } } })
    const fail = await selfCheckoff('T-8', { result: { verify: { ok: false, score: 0.22 } } })
    expect(pass.rubricScore).toBe(0.91)
    expect(fail.rubricScore).toBe(0.22)
  })
})
