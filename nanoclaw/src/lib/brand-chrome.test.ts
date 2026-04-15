import { describe, expect, it } from 'vitest'
import { embedColorFor, hslStringToRgbInt, telegramTintFor } from './brand-chrome'

describe('brand-chrome', () => {
  describe('hslStringToRgbInt', () => {
    it('converts pure red', () => {
      expect(hslStringToRgbInt('0 100% 50%')).toBe(0xff0000)
    })

    it('converts pure green', () => {
      expect(hslStringToRgbInt('120 100% 50%')).toBe(0x00ff00)
    })

    it('converts pure blue', () => {
      expect(hslStringToRgbInt('240 100% 50%')).toBe(0x0000ff)
    })

    it('converts purple primary (280 100 60)', () => {
      const int = hslStringToRgbInt('280 100% 60%')
      const r = (int >> 16) & 0xff
      const g = (int >> 8) & 0xff
      const b = int & 0xff
      expect(r).toBeGreaterThan(150)
      expect(b).toBeGreaterThan(150)
      expect(g).toBeLessThan(80)
    })
  })

  describe('embedColorFor', () => {
    it('aliases hslStringToRgbInt', () => {
      expect(embedColorFor('0 100% 50%')).toBe(0xff0000)
    })
  })

  describe('telegramTintFor', () => {
    it('buckets red hue', () => {
      expect(telegramTintFor('0 100% 50%')).toBe('🔴')
    })

    it('buckets purple hue', () => {
      expect(telegramTintFor('280 100% 60%')).toBe('🟣')
    })

    it('buckets green hue', () => {
      expect(telegramTintFor('120 80% 40%')).toBe('🟢')
    })

    it('returns black for very dark', () => {
      expect(telegramTintFor('0 0% 5%')).toBe('⚫')
    })

    it('returns white for very light', () => {
      expect(telegramTintFor('0 0% 98%')).toBe('⚪')
    })

    it('wraps 360 back to red', () => {
      expect(telegramTintFor('360 100% 50%')).toBe('🔴')
    })
  })
})
