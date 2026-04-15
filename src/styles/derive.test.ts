import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { defaultBrand, deriveShadcn } from '../../../ONE/web/src/styles/derive'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ONE_CSS = readFileSync(resolve(__dirname, '../../../ONE/web/src/styles/global.css'), 'utf8')
const ENV_CSS = readFileSync(resolve(__dirname, './global.css'), 'utf8')

describe('deriveShadcn contract', () => {
  test('light mode regenerates every --color-* in ONE @theme block', () => {
    const light = deriveShadcn(defaultBrand, 'light')
    for (const [key, value] of Object.entries(light)) {
      expect(ONE_CSS, `--color-${key}: ${value}; not found in ONE global.css`).toContain(`--color-${key}: ${value};`)
    }
  })

  test('dark mode regenerates every --color-* in ONE .dark block', () => {
    const dark = deriveShadcn(defaultBrand, 'dark')
    // Extract the .dark { ... } block and assert presence within it
    const darkBlock = ONE_CSS.match(/\.dark\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(darkBlock.length).toBeGreaterThan(0)
    for (const [key, value] of Object.entries(dark)) {
      // gold/urgency-* have no dark overrides — they live in @theme only.
      // Skip them for the .dark block check (they fall through via CSS cascade).
      if (key === 'gold' || key === 'gold-foreground' || key.startsWith('urgency-')) continue
      expect(darkBlock, `--color-${key}: ${value}; not found in ONE .dark block`).toContain(`--color-${key}: ${value};`)
    }
  })

  test('envelopes @theme block matches ONE @theme block byte-for-byte', () => {
    const extractTheme = (css: string) => css.match(/@theme\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(extractTheme(ENV_CSS)).toBe(extractTheme(ONE_CSS))
  })

  test('envelopes .dark block matches ONE .dark block byte-for-byte', () => {
    const extractDark = (css: string) => css.match(/\.dark\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(extractDark(ENV_CSS)).toBe(extractDark(ONE_CSS))
  })
})
