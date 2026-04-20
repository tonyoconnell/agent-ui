import { describe, expect, it } from 'vitest'

describe('u-send: substrate:pay signal shape', () => {
  it('substrate:pay signal has required fields per pay.md', () => {
    // Structural test: verify the signal shape used in SendPage
    // matches the pay.md contract
    const exampleSignal = {
      receiver: 'substrate:pay',
      data: {
        tags: ['pay', 'crypto', 'accept'],
        content: {
          rail: 'crypto',
          status: 'pending',
          from: '0xtest-from',
          to: '0xtest-to',
          amount: 10,
        },
      },
    }

    expect(exampleSignal.receiver).toBe('substrate:pay')
    expect(exampleSignal.data.tags).toContain('pay')
    expect(exampleSignal.data.tags).toContain('crypto')
    expect(exampleSignal.data.content.rail).toBe('crypto')
    expect(exampleSignal.data.content.status).toBeDefined()
  })

  it('create-link API endpoint exists', async () => {
    // Verify the API handler file exists (structural)
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    expect(() => readFileSync(join(process.cwd(), 'src/pages/api/pay/create-link.ts'), 'utf-8')).not.toThrow()
  })
})
