import { beforeAll, describe, expect, it } from 'vitest'

describe('SEO & Accessibility Compliance', () => {
  let html: string

  beforeAll(async () => {
    const response = await fetch('https://dev.one.ie')
    html = await response.text()
  })

  describe('SEO Basics', () => {
    it('has a descriptive title tag', () => {
      expect(html).toContain('<title>ONE —')
      expect(html).toContain('</title>')
    })

    it('has meta description', () => {
      expect(html).toContain('name="description"')
      expect(html).toContain('content="Signal-based world')
    })

    it('has viewport meta tag', () => {
      expect(html).toContain('name="viewport"')
      expect(html).toContain('width=device-width')
    })

    it('has Open Graph tags', () => {
      expect(html).toContain('property="og:title"')
      expect(html).toContain('property="og:description"')
      expect(html).toContain('property="og:image"')
      expect(html).toContain('property="og:url"')
    })

    it('has Twitter Card meta tags', () => {
      expect(html).toContain('name="twitter:card"')
      expect(html).toContain('name="twitter:title"')
      expect(html).toContain('name="twitter:description"')
    })

    it('has canonical URL', () => {
      expect(html).toContain('rel="canonical"')
    })

    it('has JSON-LD structured data', () => {
      expect(html).toContain('application/ld+json')
      expect(html).toContain('"@context"')
      expect(html).toContain('schema.org')
      expect(html).toContain('SoftwareApplication')
    })

    it('has schema markup', () => {
      expect(html).toContain('"name":"ONE"')
      expect(html).toContain('SoftwareApplication')
    })
  })

  describe('Accessibility', () => {
    it('has h1 tag', () => {
      expect(html).toContain('<h1')
      expect(html).toContain('A world where agents work for you')
    })

    it('has proper heading hierarchy', () => {
      const h1Count = (html.match(/<h1/g) || []).length
      const h3Count = (html.match(/<h3/g) || []).length

      expect(h1Count).toBeGreaterThan(0)
      expect(h3Count).toBeGreaterThan(0)
    })

    it('has aria-label attributes for key sections', () => {
      expect(html).toContain('aria-label="Hero section"')
      expect(html).toContain('aria-label="Two audiences comparison"')
      expect(html).toContain('aria-label="Primary actions"')
    })

    it('has semantic footer tag', () => {
      expect(html).toContain('<footer')
      expect(html).toContain('aria-label="Footer"')
    })

    it('has semantic nav tags with aria-label', () => {
      expect(html).toContain('<nav')
      expect(html).toContain('aria-label')
    })

    it('has table with scope attributes', () => {
      expect(html).toContain('scope="col"')
      expect(html).toContain('<table')
      expect(html).toContain('Feature comparison')
    })

    it('has aria-hidden on decorative elements', () => {
      expect(html).toContain('aria-hidden="true"')
    })

    it('has alt-friendly link text', () => {
      expect(html).toContain('aria-label="Launch your first agent')
      expect(html).toContain('aria-label="Register and earn')
    })

    it('has color contrast friendly dark theme', () => {
      expect(html).toContain('text-white')
      expect(html).toContain('bg-[#0a0a0f]')
      expect(html).toContain('dark')
    })

    it('has proper lang attribute on html', () => {
      expect(html).toContain('lang="en"')
    })

    it('has charset specified', () => {
      expect(html).toContain('charset="UTF-8"')
    })
  })

  describe('Mobile Optimization', () => {
    it('has responsive viewport settings', () => {
      expect(html).toContain('width=device-width')
      expect(html).toContain('initial-scale=1')
    })

    it('has theme color for mobile', () => {
      expect(html).toContain('name="theme-color"')
      expect(html).toContain('#0a0a0f')
    })

    it('has apple mobile web app capable', () => {
      expect(html).toContain('name="apple-mobile-web-app-capable"')
      expect(html).toContain('content="yes"')
    })

    it('uses responsive classes', () => {
      expect(html).toContain('sm:')
      expect(html).toContain('max-w-')
    })

    it('has proper touch targets', () => {
      expect(html).toContain('py-4')
      expect(html).toContain('px-8')
    })
  })

  describe('Performance', () => {
    it('has critical CSS', () => {
      expect(html).toContain('<style')
      expect(html).toContain('/_astro/')
      expect(html).toContain('.css')
    })

    it('preconnects to critical origins', () => {
      expect(html).toContain('rel="preconnect"')
      expect(html).toContain('fonts.googleapis.com')
    })

    it('has favicon reference', () => {
      expect(html).toContain('rel="icon"')
      expect(html).toContain('favicon')
    })

    it('has manifest reference', () => {
      expect(html).toContain('rel="manifest"')
      expect(html).toContain('manifest.json')
    })
  })

  describe('Security & Metadata', () => {
    it('has proper encoding declaration', () => {
      expect(html).toContain('UTF-8')
    })

    it('specifies generator', () => {
      expect(html).toContain('name="generator"')
      expect(html).toContain('Astro')
    })
  })
})
