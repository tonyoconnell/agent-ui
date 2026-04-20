import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('u-pages: route files exist', () => {
  const routes = [
    'src/pages/u/index.astro',
    'src/pages/u/wallets.astro',
    'src/pages/u/send.astro',
    'src/pages/u/receive/index.astro',
  ]

  for (const route of routes) {
    it(`route exists: ${route}`, () => {
      expect(existsSync(join(process.cwd(), route))).toBe(true)
    })
  }

  it('all routes have client:only hydration', () => {
    for (const route of routes) {
      const content = readFileSync(join(process.cwd(), route), 'utf-8')
      expect(content).toMatch(/client:only/)
    }
  })
})
