/**
 * analytics.ts — thin PostHog wrapper.
 *
 * Initialises PostHog only when the user has accepted analytics cookies.
 * Consent is stored as localStorage key "analytics_consent" = "accepted" | "rejected"
 * (the CookieBanner uses "one:cookie-consent" as its key — see below).
 *
 * If PUBLIC_POSTHOG_KEY is not set, all calls are no-ops.
 */

// CookieBanner stores consent under this key:
const CONSENT_KEY = 'one:cookie-consent'

let _initialised = false

/**
 * Call once (from CookieBanner on Accept, or on page load if already accepted).
 * Dynamically imports posthog-js so the bundle is never included for users
 * who have not consented or whose env var is missing.
 */
export async function initAnalytics(): Promise<void> {
  if (_initialised) return

  // Only run in the browser
  if (typeof window === 'undefined') return

  // Check consent
  let consent: string | null = null
  try {
    consent = localStorage.getItem(CONSENT_KEY)
  } catch {
    return
  }
  if (consent !== 'accepted') return

  // Env var must be set
  const key = (import.meta as { env?: Record<string, string | undefined> }).env?.PUBLIC_POSTHOG_KEY
  if (!key) return

  try {
    const { default: posthog } = await import('posthog-js')
    posthog.init(key, {
      api_host: 'https://eu.posthog.com',
      capture_pageview: false, // We call trackPageView manually
      persistence: 'localStorage',
    })
    _initialised = true
  } catch {
    // PostHog unavailable — fail silently
  }
}

/**
 * Track a named event with optional properties.
 * No-op if PostHog hasn't been initialised.
 */
export function trackEvent(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    // posthog is attached to window when initialised
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog
    ph?.capture(event, props)
  } catch {
    // Fail silently
  }
}

/**
 * Track a page view. Call after route changes (SPA) or on initial load.
 */
export function trackPageView(): void {
  trackEvent('$pageview')
}
