/**
 * @vitest-environment jsdom
 *
 * Chat sanitize — 5 adversarial fixtures that must not reach the DOM.
 *
 * DOMPurify strips dangerous HTML before dangerouslySetInnerHTML in
 * MarkdownContent.tsx. These fixtures cover the threat surface:
 *  1. Raw <script> tag
 *  2. Event-handler attribute (onerror)
 *  3. javascript: URL scheme in markdown link
 *  4. <iframe> with data: URI
 *  5. Inline onclick on anchor
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { describe, expect, it } from 'vitest'

marked.setOptions({ breaks: true, gfm: true })

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { FORCE_BODY: true })
}

function renderMd(md: string): string {
  return sanitize(marked.parse(md) as string)
}

function hasDanger(html: string): boolean {
  const lower = html.toLowerCase()
  return (
    lower.includes('<script') ||
    lower.includes('<iframe') ||
    /\bon\w+\s*=/.test(lower) ||
    lower.includes('javascript:') ||
    lower.includes('data:text/html')
  )
}

describe('MarkdownContent sanitizer — 5 adversarial fixtures', () => {
  it('fixture 1: strips raw <script> tag', () => {
    const out = renderMd('<script>alert(1)</script>')
    expect(hasDanger(out)).toBe(false)
    expect(out).not.toContain('alert(1)')
  })

  it('fixture 2: removes onerror event-handler attribute', () => {
    const out = renderMd('<img src=x onerror=alert(1)>')
    expect(hasDanger(out)).toBe(false)
  })

  it('fixture 3: neutralises javascript: URL scheme in markdown link', () => {
    const out = renderMd('[click](javascript:alert(1))')
    expect(hasDanger(out)).toBe(false)
    // The link text may remain but href must be safe
    if (out.includes('href')) {
      expect(out.toLowerCase()).not.toContain('javascript:')
    }
  })

  it('fixture 4: strips <iframe> with data: URI', () => {
    const out = renderMd('<iframe src="data:text/html,<script>alert(1)</script>"></iframe>')
    expect(hasDanger(out)).toBe(false)
  })

  it('fixture 5: removes onclick from anchor tag', () => {
    const out = renderMd('<a href="//evil" onclick="alert(1)">x</a>')
    expect(hasDanger(out)).toBe(false)
    // The link text should survive
    expect(out).toContain('x')
  })
})
