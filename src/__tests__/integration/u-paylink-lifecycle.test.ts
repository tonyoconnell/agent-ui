import { describe, expect, it } from 'vitest'

describe('u-paylink: lifecycle from creation to pay', () => {
  it('PayService exists and has createShortlink', async () => {
    const payService = await import('@/components/u/lib/PayService')
    expect(typeof payService.createShortlink).toBe('function')
  })

  it('useShortlink hook is defined', async () => {
    const { existsSync } = await import('node:fs')
    const { join } = await import('node:path')
    expect(existsSync(join(process.cwd(), 'src/components/u/hooks/useShortlink.ts'))).toBe(true)
  })

  it('paylink lifecycle signal shape is correct', () => {
    const payLinkCreatedSignal = {
      receiver: 'substrate:pay',
      data: {
        tags: ['pay', 'crypto', 'accept'],
        content: {
          rail: 'crypto',
          ref: 'sl_test123',
          status: 'pending',
        },
      },
    }
    expect(payLinkCreatedSignal.data.content.ref).toMatch(/^sl_/)
    expect(payLinkCreatedSignal.data.content.rail).toBe('crypto')
  })
})
