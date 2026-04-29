/** Focus management + reduced-motion helpers for AuthSurface. */

/** Move focus to the given element (must have tabindex="-1" or be focusable). */
export function focusElement(el: HTMLElement | null): void {
  el?.focus()
}

/** Focus the first focusable child of a container after render. */
export function focusFirstIn(container: HTMLElement | null): void {
  if (!container) return
  const focusable = container.querySelector<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  focusable?.focus()
}

/** Returns true if the user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Conditionally apply an animation class based on user motion preference. */
export function motionClass(cls: string): string {
  return prefersReducedMotion() ? '' : cls
}

/** Focus-order list for AuthSurface (Passkey → Google → Wallet → Email → Continue → Disclosure). */
export const AUTH_FOCUS_ORDER = [
  'passkey-btn',
  'google-btn',
  'wallet-btn',
  'email-input',
  'continue-btn',
  'more-ways-btn',
] as const

/** axe-core fixture config for testing AuthSurface accessibility. */
export const AXE_FIXTURE_CONFIG = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },
}
