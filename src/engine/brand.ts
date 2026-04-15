import { type BrandTokens, deriveShadcn } from '@/styles/derive'
import { readParsed } from '../lib/typedb'
import { emitBrandApplied } from './brand-signals'

export type { BrandTokens }

export interface BrandContext {
  thingId?: string
  groupId?: string
  userId?: string
  mode?: 'light' | 'dark'
}

export type Mode = 'light' | 'dark'

const cache = new Map<string, BrandTokens | null>()

async function readBrand(
  entity: 'thing' | 'group' | 'actor',
  idAttr: 'tid' | 'gid' | 'aid',
  id: string,
): Promise<string | null> {
  const rows = await readParsed(`match $e isa ${entity}, has ${idAttr} "${id}"; $e has brand $b; select $b;`).catch(
    () => [] as Record<string, unknown>[],
  )
  return rows.length > 0 ? (rows[0].b as string) : null
}

const registry: Record<string, BrandTokens> = {
  purple: {
    background: { light: '0 0% 100%', dark: '0 0% 13%' },
    foreground: { light: '0 0% 13%', dark: '36 8% 96%' },
    font: { light: '0 0% 13%', dark: '0 0% 100%' },
    primary: { light: '280 100% 60%', dark: '280 100% 60%' },
    secondary: { light: '330 85% 55%', dark: '330 85% 60%' },
    tertiary: { light: '180 70% 40%', dark: '180 70% 50%' },
  },
}

export const purpleBrand = registry.purple

function labelToTokens(label: string | null): BrandTokens | null {
  if (!label) return null
  return registry[label] ?? null
}

export async function resolveBrand(ctx: BrandContext): Promise<BrandTokens | null> {
  const key = `${ctx.thingId ?? ''}|${ctx.groupId ?? ''}|${ctx.userId ?? ''}`
  if (cache.has(key)) return cache.get(key) ?? null

  const [thing, group, user] = await Promise.all([
    ctx.thingId ? readBrand('thing', 'tid', ctx.thingId) : null,
    ctx.groupId ? readBrand('group', 'gid', ctx.groupId) : null,
    ctx.userId ? readBrand('actor', 'aid', ctx.userId) : null,
  ])

  const tokens = labelToTokens(thing ?? group ?? user ?? null)
  cache.set(key, tokens)
  return tokens
}

export function invalidateBrandCache(): void {
  cache.clear()
}

export function injectBrand(brand: BrandTokens | null | undefined, mode: Mode): string {
  if (!brand) return ''
  const vars = Object.entries(deriveShadcn(brand, mode))
    .map(([k, v]) => `--color-${k}: ${v} !important;`)
    .join(' ')
  return `<style data-brand-override>:root { ${vars} }</style>`
}

export function renderBrand(
  brand: BrandTokens | null | undefined,
  ctx?: { thingId?: string; groupId?: string },
): string {
  if (!brand) return ''
  const light = Object.entries(deriveShadcn(brand, 'light'))
    .map(([k, v]) => `--color-${k}: ${v} !important;`)
    .join(' ')
  const dark = Object.entries(deriveShadcn(brand, 'dark'))
    .map(([k, v]) => `--color-${k}: ${v} !important;`)
    .join(' ')
  if (ctx && (ctx.thingId ?? ctx.groupId)) emitBrandApplied(brand, ctx)
  return `<style data-brand-override>:root { ${light} } .dark { ${dark} }</style>`
}

export function brandPalette(
  brand: BrandTokens | null | undefined,
  mode: Mode = 'light',
): Record<string, string> | null {
  if (!brand) return null
  return deriveShadcn(brand, mode)
}
