import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/typedb', () => ({
  readParsed: vi.fn(),
}))

import { readParsed } from '../lib/typedb'
import { brandPalette, injectBrand, invalidateBrandCache, purpleBrand, renderBrand, resolveBrand } from './brand'

const mockRead = vi.mocked(readParsed)

describe('brand', () => {
  describe('renderBrand', () => {
    it('emits both :root and .dark with !important', () => {
      const html = renderBrand(purpleBrand)
      expect(html).toContain('data-brand-override')
      expect(html).toContain(':root {')
      expect(html).toContain('.dark {')
      expect(html).toContain('!important')
    })

    it('returns empty string for null', () => {
      expect(renderBrand(null)).toBe('')
      expect(renderBrand(undefined)).toBe('')
    })
  })

  describe('injectBrand', () => {
    it('emits :root only for given mode', () => {
      const html = injectBrand(purpleBrand, 'dark')
      expect(html).toContain(':root {')
      expect(html).not.toContain('.dark {')
    })
  })

  describe('brandPalette', () => {
    it('returns resolved palette map', () => {
      const palette = brandPalette(purpleBrand, 'dark')
      expect(palette).toBeTruthy()
      expect(Object.keys(palette!).length).toBeGreaterThan(0)
    })

    it('returns null for null input', () => {
      expect(brandPalette(null)).toBeNull()
    })
  })

  describe('resolveBrand fallback chain', () => {
    it('prefers thing over group over user', async () => {
      invalidateBrandCache()
      mockRead.mockImplementation(async (tql: string) => {
        if (tql.includes('isa thing')) return [{ b: 'purple' }]
        if (tql.includes('isa group')) return [{ b: 'other' }]
        return []
      })
      const tokens = await resolveBrand({ thingId: 't1', groupId: 'g1' })
      expect(tokens).toBe(purpleBrand)
    })

    it('falls through to group when thing has no brand', async () => {
      invalidateBrandCache()
      mockRead.mockImplementation(async (tql: string) => {
        if (tql.includes('isa group')) return [{ b: 'purple' }]
        return []
      })
      const tokens = await resolveBrand({ thingId: 't2', groupId: 'g2' })
      expect(tokens).toBe(purpleBrand)
    })

    it('returns null when no brand and no registry match', async () => {
      invalidateBrandCache()
      mockRead.mockResolvedValue([])
      const tokens = await resolveBrand({ thingId: 't3' })
      expect(tokens).toBeNull()
    })

    it('returns null for unknown brand label', async () => {
      invalidateBrandCache()
      mockRead.mockResolvedValue([{ b: 'unknown-brand' }])
      const tokens = await resolveBrand({ thingId: 't4' })
      expect(tokens).toBeNull()
    })

    it('caches resolved result', async () => {
      invalidateBrandCache()
      mockRead.mockResolvedValue([{ b: 'purple' }])
      await resolveBrand({ thingId: 't5' })
      mockRead.mockClear()
      await resolveBrand({ thingId: 't5' })
      expect(mockRead).not.toHaveBeenCalled()
    })
  })
})
