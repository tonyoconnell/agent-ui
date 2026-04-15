import { describe, expect, it } from 'vitest'
import { maskSensitive, sanitizeUrl } from './utils'

describe('sanitizeUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('rejects javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined()
  })

  it('rejects data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
  })

  it('returns undefined for null/undefined', () => {
    expect(sanitizeUrl(null)).toBeUndefined()
    expect(sanitizeUrl(undefined)).toBeUndefined()
  })

  it('returns undefined for invalid URL', () => {
    expect(sanitizeUrl('not-a-url')).toBeUndefined()
  })
})

describe('maskSensitive', () => {
  it('masks middle of long strings', () => {
    expect(maskSensitive('sk-or-v1-abcdefghijklmnop')).toMatch(/^sk-o\*\*\*mnop$/)
  })

  it('returns *** for short strings', () => {
    expect(maskSensitive('abc')).toBe('***')
  })

  it('respects custom showChars', () => {
    expect(maskSensitive('abcdefghij', 2)).toBe('ab***ij')
  })
})
