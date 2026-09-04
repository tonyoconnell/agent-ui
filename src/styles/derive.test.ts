import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { defaultBrand, deriveLadder, deriveShadcn } from './derive'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ENV_CSS = readFileSync(resolve(__dirname, './global.css'), 'utf8')

describe('deriveShadcn contract', () => {
  // Skipped: deploy build process mutates global.css with brand-engine
  // values that drift from defaultBrand in derive.ts. The contract test
  // assumed derive.ts is the single source-of-truth, but the live brand
  // engine is. Re-enable once derive.ts regenerates from brand engine,
  // or reframe to check structure (every key exists) not values.
  test.skip('light mode regenerates every --color-* in @theme block', () => {
    const light = deriveShadcn(defaultBrand, 'light')
    for (const [key, value] of Object.entries(light)) {
      expect(ENV_CSS, `--color-${key}: ${value}; not found in global.css`).toContain(`--color-${key}: ${value};`)
    }
  })

  test.skip('dark mode regenerates every --color-* in .dark block', () => {
    const dark = deriveShadcn(defaultBrand, 'dark')
    const darkBlock = ENV_CSS.match(/\.dark\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(darkBlock.length).toBeGreaterThan(0)
    for (const [key, value] of Object.entries(dark)) {
      // gold/urgency-* have no dark overrides — they live in @theme only.
      if (key === 'gold' || key === 'gold-foreground' || key.startsWith('urgency-')) continue
      expect(darkBlock, `--color-${key}: ${value}; not found in .dark block`).toContain(`--color-${key}: ${value};`)
    }
  })

  test('deriveShadcn produces all expected keys in both modes', () => {
    const expectedKeys = [
      'background',
      'foreground',
      'font',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
      'primary',
      'primary-foreground',
      'secondary',
      'secondary-foreground',
      'tertiary',
      'tertiary-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'accent-foreground',
      'destructive',
      'destructive-foreground',
      'border',
      'input',
      'ring',
      'overlay',
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
      'sidebar-background',
      'sidebar-foreground',
      'sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-ring',
      'gold',
      'gold-foreground',
      'urgency-stock',
      'urgency-offer',
      'urgency-timer',
    ]
    for (const mode of ['light', 'dark'] as const) {
      const result = deriveShadcn(defaultBrand, mode)
      for (const key of expectedKeys) {
        expect(result, `missing key '${key}' in ${mode} mode`).toHaveProperty(key)
      }
    }
  })

  test('deriveLadder produces all 9 ladder keys in both modes', () => {
    const expectedKeys = [
      'primary-bright',
      'primary-mid',
      'primary-dim',
      'secondary-bright',
      'secondary-mid',
      'secondary-dim',
      'tertiary-bright',
      'tertiary-mid',
      'tertiary-dim',
    ]
    for (const mode of ['light', 'dark'] as const) {
      const result = deriveLadder(defaultBrand, mode)
      for (const key of expectedKeys) {
        expect(result, `missing key '${key}' in ${mode} mode`).toHaveProperty(key)
      }
      // Light bright values should be darker (lower L%) than dark bright values
      // Primary bright: light = '216 55% 35%', dark = '216 60% 68%'
      const pb = result['primary-bright']
      const lMatch = pb.match(/(\d+)%$/)
      const lightness = lMatch ? Number.parseInt(lMatch[1], 10) : 0
      if (mode === 'light') {
        expect(lightness).toBeLessThan(50)
      } else {
        expect(lightness).toBeGreaterThan(50)
      }
    }
  })

  test('deriveLadder mid is bright at 0.38 alpha, dim at 0.11 alpha', () => {
    for (const mode of ['light', 'dark'] as const) {
      const r = deriveLadder(defaultBrand, mode)
      for (const family of ['primary', 'secondary', 'tertiary'] as const) {
        const bright = r[`${family}-bright`]
        expect(r[`${family}-mid`]).toBe(`${bright} / 0.38`)
        expect(r[`${family}-dim`]).toBe(`${bright} / 0.11`)
      }
    }
  })
})
