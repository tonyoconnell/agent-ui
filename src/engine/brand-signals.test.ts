import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── mock @/lib/net before imports ─────────────────────────────────────────────

const mockMark = vi.fn()

vi.mock('@/lib/net', () => ({
  getNet: vi.fn().mockResolvedValue({ mark: mockMark }),
}))

import { purpleBrand } from '@/engine/brand'
import { brandKey, emitBrandApplied } from '@/engine/brand-signals'

// ── brandKey ──────────────────────────────────────────────────────────────────

describe('brandKey', () => {
  it('passes through lowercase string unchanged', () => {
    expect(brandKey('purple')).toBe('purple')
  })

  it('lowercases and hyphenates spaces', () => {
    expect(brandKey('Dark Mode')).toBe('dark-mode')
  })

  it('object with different values → starts with "custom-" and is 6+ hex chars', () => {
    const key = brandKey({
      background: { light: '0', dark: '0' },
      foreground: { light: '0', dark: '0' },
      font: { light: '0', dark: '0' },
      primary: { light: '0', dark: '0' },
      secondary: { light: '0', dark: '0' },
      tertiary: { light: '0', dark: '0' },
    })
    expect(key).toMatch(/^custom-[0-9a-f]{6}$/)
  })

  it('same object passed twice → same key (stable)', () => {
    const a = brandKey(purpleBrand)
    const b = brandKey(purpleBrand)
    expect(a).toBe(b)
  })

  it('two different objects → different keys', () => {
    const obj1 = {
      background: { light: '0 0% 100%', dark: '0 0% 13%' },
      foreground: { light: '0 0% 13%', dark: '36 8% 96%' },
      font: { light: '0 0% 13%', dark: '0 0% 100%' },
      primary: { light: '280 100% 60%', dark: '280 100% 60%' },
      secondary: { light: '330 85% 55%', dark: '330 85% 60%' },
      tertiary: { light: '180 70% 40%', dark: '180 70% 50%' },
    }
    const obj2 = {
      background: { light: '0 0% 50%', dark: '0 0% 50%' },
      foreground: { light: '0 0% 50%', dark: '0 0% 50%' },
      font: { light: '0 0% 50%', dark: '0 0% 50%' },
      primary: { light: '100 100% 50%', dark: '100 100% 50%' },
      secondary: { light: '200 50% 50%', dark: '200 50% 50%' },
      tertiary: { light: '300 50% 50%', dark: '300 50% 50%' },
    }
    expect(brandKey(obj1)).not.toBe(brandKey(obj2))
  })

  it('purpleBrand object collapses to "purple" via registry', () => {
    expect(brandKey(purpleBrand)).toBe('purple')
  })
})

// ── emitBrandApplied ──────────────────────────────────────────────────────────

describe('emitBrandApplied', () => {
  beforeEach(() => {
    mockMark.mockClear()
  })

  it('no-op when ctx is undefined (mark never called)', async () => {
    emitBrandApplied('purple')
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).not.toHaveBeenCalled()
  })

  it('no-op when ctx has neither thingId nor groupId', async () => {
    emitBrandApplied('purple', {})
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).not.toHaveBeenCalled()
  })

  it('marks brand→thing edge when thingId is provided', async () => {
    emitBrandApplied('purple', { thingId: 'widget-1' })
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).toHaveBeenCalledWith('brand:purple→thing:widget-1', 1)
  })

  it('marks brand→group edge when only groupId is provided', async () => {
    emitBrandApplied('purple', { groupId: 'team-a' })
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).toHaveBeenCalledWith('brand:purple→group:team-a', 1)
  })

  it('prefers thingId over groupId when both are present', async () => {
    emitBrandApplied('purple', { thingId: 'w1', groupId: 'g1' })
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).toHaveBeenCalledWith('brand:purple→thing:w1', 1)
    expect(mockMark).not.toHaveBeenCalledWith(expect.stringContaining('group:'), expect.anything())
  })

  it('derives key from object brand and marks correct edge', async () => {
    emitBrandApplied(purpleBrand, { thingId: 'widget-2' })
    await new Promise((r) => setTimeout(r, 0))
    const key = brandKey(purpleBrand)
    expect(mockMark).toHaveBeenCalledWith(`brand:${key}→thing:widget-2`, 1)
  })

  it('skips mark when ua matches bot regex (Googlebot)', async () => {
    emitBrandApplied('purple', { thingId: 'w1', ua: 'Googlebot/2.1 (+http://www.google.com/bot.html)' })
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).not.toHaveBeenCalled()
  })

  it('skips mark when ua matches bot regex (crawler/spider/preview/monitor)', async () => {
    for (const ua of ['SomeCrawler/1.0', 'Baiduspider', 'Slackbot-LinkPreviewer', 'UptimeMonitor/3']) {
      mockMark.mockClear()
      emitBrandApplied('purple', { thingId: 'w1', ua })
      await new Promise((r) => setTimeout(r, 0))
      expect(mockMark).not.toHaveBeenCalled()
    }
  })

  it('skips mark when ua is empty string', async () => {
    emitBrandApplied('purple', { thingId: 'w1', ua: '' })
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).not.toHaveBeenCalled()
  })

  it('marks normally when ua is a real browser', async () => {
    emitBrandApplied('purple', {
      thingId: 'w1',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(mockMark).toHaveBeenCalledWith('brand:purple→thing:w1', 1)
  })
})
