import type { APIRoute } from 'astro'
import type { BrandTokens } from '@/engine/brand'

// ── HSL conversion helpers ────────────────────────────────────────────────────

function hex2hsl(hex: string): [number, number, number] | null {
  const raw = hex.replace('#', '')
  const expanded =
    raw.length === 3 || raw.length === 4
      ? raw
          .slice(0, 3)
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6)
  if (expanded.length !== 6) return null
  const num = Number.parseInt(expanded, 16)
  if (Number.isNaN(num)) return null
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  return rgb2hsl(r, g, b)
}

function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function parseCssRgb(raw: string): [number, number, number] | null {
  const m = raw.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/)
  if (!m) return null
  return rgb2hsl(Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255)
}

function parseCssHsl(raw: string): [number, number, number] | null {
  const m = raw.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/)
  if (!m) return null
  return [Math.round(Number(m[1])), Math.round(Number(m[2])), Math.round(Number(m[3]))]
}

// ── Colour scanning ───────────────────────────────────────────────────────────

const RE_HEX = /#[0-9a-fA-F]{3,8}\b/g
const RE_RGB = /rgb\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)/g
const RE_HSL = /hsl\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)/g

function isUsable(h: number, s: number, l: number): boolean {
  return l >= 10 && l <= 95 && s >= 8
}

function extractHslTriples(css: string): Array<[number, number, number]> {
  const hits: Array<[number, number, number]> = []
  for (const m of css.matchAll(RE_HEX)) {
    const t = hex2hsl(m[0])
    if (t && isUsable(...t)) hits.push(t)
  }
  for (const m of css.matchAll(RE_RGB)) {
    const t = parseCssRgb(m[0])
    if (t && isUsable(...t)) hits.push(t)
  }
  for (const m of css.matchAll(RE_HSL)) {
    const t = parseCssHsl(m[0])
    if (t && isUsable(...t)) hits.push(t)
  }
  return hits
}

// ── Clustering ────────────────────────────────────────────────────────────────

const BUCKET_SIZE = 30
const NUM_BUCKETS = Math.ceil(360 / BUCKET_SIZE) // 12

function clusterByHue(triples: Array<[number, number, number]>): Map<number, [number, number, number][]> {
  const map = new Map<number, [number, number, number][]>()
  for (const t of triples) {
    const bucket = Math.floor(t[0] / BUCKET_SIZE) % NUM_BUCKETS
    const arr = map.get(bucket) ?? []
    arr.push(t)
    map.set(bucket, arr)
  }
  return map
}

function medianTriple(triples: Array<[number, number, number]>): [number, number, number] {
  const sorted = [...triples].sort((a, b) => a[0] - b[0])
  const mid = sorted[Math.floor(sorted.length / 2)]
  return mid
}

// ── Defaults (no hex literals — computed from HSL numbers) ───────────────────

const SLOT_DEFAULTS: Record<string, [number, number, number]> = {
  primary: [250, 80, 55],
  secondary: [330, 60, 55],
  accent: [180, 55, 45],
  neutral: [220, 15, 50],
  success: [140, 60, 40],
  warn: [35, 90, 50],
}

const SLOT_NAMES = ['primary', 'secondary', 'accent', 'neutral', 'success', 'warn'] as const
type SlotName = (typeof SLOT_NAMES)[number]

function hslStr(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`
}

function hslStrDark(h: number, s: number, l: number): string {
  // Nudge lightness slightly for dark mode readability
  const dl = Math.min(l + 8, 90)
  return `${h} ${s}% ${dl}%`
}

function buildTokens(slots: Record<SlotName, [number, number, number]>): BrandTokens {
  const [ph, ps, pl] = slots.primary
  const [sh, ss, sl] = slots.secondary
  const [nh, ns] = slots.neutral
  return {
    background: { light: hslStr(nh, ns, 100), dark: hslStr(nh, ns, 13) },
    foreground: { light: hslStr(nh, ns, 13), dark: hslStr(nh, ns, 92) },
    font: { light: hslStr(nh, ns, 10), dark: hslStr(nh, ns, 97) },
    primary: { light: hslStr(ph, ps, pl), dark: hslStrDark(ph, ps, pl) },
    secondary: { light: hslStr(sh, ss, sl), dark: hslStrDark(sh, ss, sl) },
    tertiary: { light: hslStr(slots.accent[0], slots.accent[1], slots.accent[2]), dark: hslStrDark(...slots.accent) },
  }
}

// ── HTML → CSS extraction ─────────────────────────────────────────────────────

function extractStylesheetHrefs(html: string, base: string): string[] {
  const hrefs: string[] = []
  const re = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi
  for (const m of html.matchAll(re)) {
    try {
      hrefs.push(new URL(m[1], base).href)
    } catch {
      /* skip malformed */
    }
  }
  return hrefs.slice(0, 5)
}

function extractInlineStyles(html: string): string {
  const parts: string[] = []
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    parts.push(m[1])
  }
  return parts.join('\n')
}

async function fetchWithTimeout(url: string, ms: number): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const raw = (body as Record<string, unknown>)?.url
  if (typeof raw !== 'string' || !raw.trim()) {
    return new Response(JSON.stringify({ error: 'Missing required field: url' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(raw.trim())
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  // Fetch the HTML page
  const html = await fetchWithTimeout(targetUrl.href, 3000)
  if (!html) {
    return new Response(JSON.stringify({ error: 'Failed to fetch URL' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  // Gather CSS: inline styles + external stylesheets (parallel, 500ms each)
  const inlineCss = extractInlineStyles(html)
  const sheetHrefs = extractStylesheetHrefs(html, targetUrl.href)
  const sheetTexts = await Promise.all(sheetHrefs.map((h) => fetchWithTimeout(h, 500)))
  const allCss = [inlineCss, ...sheetTexts].join('\n')

  // Extract and cluster colours
  const triples = extractHslTriples(allCss)
  const clusters = clusterByHue(triples)

  // Sort buckets by frequency, pick top 6 distinct
  const sorted = [...clusters.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6)

  const slots: Record<SlotName, [number, number, number]> = {
    primary: SLOT_DEFAULTS.primary,
    secondary: SLOT_DEFAULTS.secondary,
    accent: SLOT_DEFAULTS.accent,
    neutral: SLOT_DEFAULTS.neutral,
    success: SLOT_DEFAULTS.success,
    warn: SLOT_DEFAULTS.warn,
  }

  sorted.forEach(([, bucket], i) => {
    const name = SLOT_NAMES[i]
    if (name) slots[name] = medianTriple(bucket)
  })

  const distinctFound = Math.min(sorted.length, 6)
  const confidence = distinctFound / 6

  const brand = buildTokens(slots)

  return new Response(JSON.stringify({ brand, confidence, source: targetUrl.href }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
  })
}
