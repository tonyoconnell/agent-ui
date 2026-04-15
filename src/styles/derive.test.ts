import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { defaultBrand, deriveShadcn } from './derive'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ENV_CSS = readFileSync(resolve(__dirname, './global.css'), 'utf8')

describe('deriveShadcn contract', () => {
  test('light mode regenerates every --color-* in @theme block', () => {
    const light = deriveShadcn(defaultBrand, 'light')
    for (const [key, value] of Object.entries(light)) {
      expect(ENV_CSS, `--color-${key}: ${value}; not found in global.css`).toContain(`--color-${key}: ${value};`)
    }
  })

  test('dark mode regenerates every --color-* in .dark block', () => {
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
      'background', 'foreground', 'font', 'card', 'card-foreground',
      'popover', 'popover-foreground', 'primary', 'primary-foreground',
      'secondary', 'secondary-foreground', 'tertiary', 'tertiary-foreground',
      'muted', 'muted-foreground', 'accent', 'accent-foreground',
      'destructive', 'destructive-foreground', 'border', 'input', 'ring',
      'overlay', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
      'sidebar-background', 'sidebar-foreground', 'sidebar-primary',
      'sidebar-primary-foreground', 'sidebar-accent', 'sidebar-accent-foreground',
      'sidebar-border', 'sidebar-ring', 'gold', 'gold-foreground',
      'urgency-stock', 'urgency-offer', 'urgency-timer',
    ]
    for (const mode of ['light', 'dark'] as const) {
      const result = deriveShadcn(defaultBrand, mode)
      for (const key of expectedKeys) {
        expect(result, `missing key '${key}' in ${mode} mode`).toHaveProperty(key)
      }
    }
  })
})
