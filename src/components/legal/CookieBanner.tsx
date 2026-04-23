import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

const STORAGE_KEY = 'one:cookie-consent'

/**
 * EU cookie consent banner.
 *
 * - Reads CF-IPCountry via a data attribute written at SSR time; falls back to
 *   Accept-Language to detect EU origin. If the user is outside the EU the
 *   banner is never shown (analytics cookies are not set in that case either).
 * - On accept: stores "accepted" in localStorage and emits ui:legal:cookie-accept.
 * - On reject: stores "rejected" in localStorage and emits ui:legal:cookie-reject.
 *   No analytics cookies are set when rejected.
 * - Once a choice is stored the banner does not re-appear.
 */
export function CookieBanner({ countryCode }: { countryCode?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already decided — never show again.
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
    } catch {
      // localStorage unavailable — don't show banner.
      return
    }

    // EU/EEA country codes (ISO 3166-1 alpha-2).
    const EU_COUNTRIES = new Set([
      'AT',
      'BE',
      'BG',
      'CY',
      'CZ',
      'DE',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GR',
      'HR',
      'HU',
      'IE',
      'IT',
      'LT',
      'LU',
      'LV',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SE',
      'SI',
      'SK',
      // EEA non-EU
      'IS',
      'LI',
      'NO',
      // UK (post-Brexit retains GDPR-equivalent)
      'GB',
    ])

    // Priority 1: Cloudflare CF-IPCountry passed as prop.
    if (countryCode) {
      if (EU_COUNTRIES.has(countryCode.toUpperCase())) {
        setVisible(true)
      }
      return
    }

    // Fallback: Accept-Language heuristic.
    const lang = navigator.language ?? ''
    const primaryLang = lang.split('-')[0].toLowerCase()
    const EU_LANGS = new Set([
      'bg',
      'cs',
      'da',
      'de',
      'el',
      'es',
      'et',
      'fi',
      'fr',
      'ga',
      'hr',
      'hu',
      'it',
      'lt',
      'lv',
      'mt',
      'nl',
      'pl',
      'pt',
      'ro',
      'sk',
      'sl',
      'sv',
    ])
    if (EU_LANGS.has(primaryLang)) {
      setVisible(true)
    }
  }, [countryCode])

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      /* noop */
    }
    emitClick('ui:legal:cookie-accept')
    setVisible(false)
  }

  function handleReject() {
    try {
      localStorage.setItem(STORAGE_KEY, 'rejected')
    } catch {
      /* noop */
    }
    emitClick('ui:legal:cookie-reject')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use minimal analytics cookies to understand how people use ONE.{' '}
          <a href="/legal/privacy" className="text-primary underline underline-offset-4">
            Privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-md border border-border bg-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
