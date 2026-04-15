import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/pages/api/brand/extract'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://test/api/brand/extract', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function htmlWith(css: string): string {
  return `<!doctype html><html><head><style>${css}</style></head><body></body></html>`
}

function mockHtmlFetch(html: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })),
  )
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/brand/extract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 1 ── happy path: inline style with 2 distinct hues
  it('returns brand tokens and positive confidence for HTML with inline CSS colors', async () => {
    mockHtmlFetch(htmlWith('h1{color:#ff0000}.b{background:#00ff00}'))

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { brand: unknown; confidence: number; source: string }
    expect(body.confidence).toBeGreaterThan(0)
    expect(body.source).toBe('https://test.local/')

    const brand = body.brand as Record<string, { light: string; dark: string }>
    for (const token of ['background', 'foreground', 'font', 'primary', 'secondary', 'tertiary']) {
      expect(brand[token]).toBeDefined()
      expect(typeof brand[token].light).toBe('string')
      expect(typeof brand[token].dark).toBe('string')
      // HSL triple: "H S% L%" — check it contains a percent sign
      expect(brand[token].light).toMatch(/%/)
      expect(brand[token].dark).toMatch(/%/)
    }
  })

  // 2 ── malformed JSON
  it('returns 400 for malformed JSON body', async () => {
    const req = new Request('http://test/api/brand/extract', {
      method: 'POST',
      body: 'not-json{{{',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST({ request: req } as never)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/json/i)
  })

  // 3 ── missing url field
  it('returns 400 when url field is missing', async () => {
    const res = await POST({ request: makeRequest({ notUrl: 'https://test.local' }) } as never)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/url/i)
  })

  // 4 ── invalid URL string
  it('returns 400 for an invalid URL string', async () => {
    const res = await POST({ request: makeRequest({ url: 'not a url' }) } as never)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/invalid url/i)
  })

  // 5 ── network error → 502
  it('returns 502 when fetch rejects with a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network failure')))

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(502)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/fetch/i)
  })

  // 6 ── HTML with NO colors → valid BrandTokens from defaults, confidence = 0
  it('returns valid BrandTokens from defaults and confidence 0 when CSS has no colors', async () => {
    mockHtmlFetch(htmlWith('h1 { font-size: 16px; } body { margin: 0; }'))

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { brand: unknown; confidence: number }
    expect(body.confidence).toBe(0)

    const brand = body.brand as Record<string, { light: string; dark: string }>
    for (const token of ['background', 'foreground', 'font', 'primary', 'secondary', 'tertiary']) {
      expect(brand[token]).toBeDefined()
      expect(brand[token].light).toMatch(/%/)
      expect(brand[token].dark).toMatch(/%/)
    }
  })

  // 7 ── near-grey colors are filtered, confidence stays low
  it('filters near-grey colors (low saturation) and returns low confidence', async () => {
    // #888888 → H=0 S=0 L=53 — fails isUsable (s < 8). #7a7a7a same.
    mockHtmlFetch(htmlWith('a{color:#888888}p{background:#7a7a7a}'))

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { confidence: number }
    expect(body.confidence).toBeLessThan(0.5)
  })

  // 8 ── 6 well-spaced hues → confidence ≥ 0.8
  it('returns confidence ≥ 0.8 when HTML contains 6 distinct well-spaced hues', async () => {
    // 6 hues 60° apart → 6 different buckets (bucket size = 30°)
    // Each color has high saturation + mid lightness to pass isUsable
    const css = [
      'h1{color:#ff2200}', // hue ~6°   bucket 0
      'h2{color:#ffcc00}', // hue ~48°  bucket 1
      'h3{color:#00ff44}', // hue ~129° bucket 4
      'h4{color:#00ffee}', // hue ~177° bucket 5
      'h5{color:#0044ff}', // hue ~222° bucket 7
      'h6{color:#cc00ff}', // hue ~282° bucket 9
    ].join(' ')

    mockHtmlFetch(htmlWith(css))

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { confidence: number }
    expect(body.confidence).toBeGreaterThanOrEqual(0.8)
  })

  // 9 ── rgb() and hsl() color formats are parsed
  it('parses rgb() and hsl() color formats from inline CSS', async () => {
    const css = ['a{color:rgb(255, 0, 0)}', 'b{background:hsl(120, 100%, 40%)}'].join(' ')

    mockHtmlFetch(htmlWith(css))

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { confidence: number }
    expect(body.confidence).toBeGreaterThan(0)
  })

  // 10 ── external stylesheet colors are merged
  it('fetches external stylesheets and includes their colors in extraction', async () => {
    const pageHtml = `<!doctype html><html><head>
      <link rel="stylesheet" href="/styles.css">
    </head><body></body></html>`
    const sheetCss = 'h1{color:#cc0055}.box{background:#0055cc}'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        const body = url.includes('styles.css') ? sheetCss : pageHtml
        const contentType = url.includes('styles.css') ? 'text/css' : 'text/html'
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': contentType } }))
      }),
    )

    const res = await POST({ request: makeRequest({ url: 'https://test.local' }) } as never)
    expect(res.status).toBe(200)

    const body = (await res.json()) as { confidence: number }
    // Both colors are usable saturated hues → at least 1 distinct cluster
    expect(body.confidence).toBeGreaterThan(0)
  })
})
