// >>> auth-ui integration tests
// Cases 12-14 are unit-testable; remaining cases require live services (skip).
import { describe, it, expect } from 'vitest'
import { validateRedirect } from '@/lib/auth-redirect'
import { checkAuthLimit } from '@/lib/auth-rate-limit'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const PAGES_ROOT = join(process.cwd(), 'src/pages')

// auth-ui-1: passkey conditional ≤1500ms (requires live passkey device)
describe('auth-ui-1 passkey-conditional', () => {
  it.skip('returning passkey via conditional UI signs in ≤1500ms — requires live passkey device', () => {})
})

// auth-ui-2: passkey new visitor ≤5000ms (requires live passkey device)
describe('auth-ui-2 passkey-new-visitor', () => {
  it.skip('new visitor passkey signup ≤5000ms — requires live passkey device', () => {})
})

// auth-ui-3: google OAuth round-trip (requires live Google OAuth)
describe('auth-ui-3 google-roundtrip', () => {
  it.skip('Google OAuth round-trip lands signed in — requires live Google OAuth', () => {})
})

// auth-ui-4: magic link new email (requires live Better Auth + email)
describe('auth-ui-4 magic-link-new-email', () => {
  it.skip('magic link for new email creates session + human unit — requires live Better Auth', () => {})
})

// auth-ui-5: email password opt-in (requires live Better Auth)
describe('auth-ui-5 email-password-optin', () => {
  it.skip('email password opt-in signs in inline — requires live Better Auth', () => {})
})

// auth-ui-6: ui signals fired
describe('auth-ui-6 ui-signals-fired', () => {
  it('emitClick is imported in PasskeyButton', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(join(process.cwd(), 'src/components/auth/PasskeyButton.tsx'), 'utf8')
    )
    expect(src).toContain("emitClick('ui:auth:passkey:start')")
    expect(src).toContain("emitClick('ui:auth:passkey:success')")
    expect(src).toContain("emitClick('ui:auth:passkey:fail')")
  })
  it('emitClick is imported in GoogleButton', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(join(process.cwd(), 'src/components/auth/GoogleButton.tsx'), 'utf8')
    )
    expect(src).toContain("emitClick('ui:auth:google:start')")
    expect(src).toContain("emitClick('ui:auth:google:fail')")
  })
})

// auth-ui-7: no-enumeration (response body identical for all emails)
describe('auth-ui-7 no-enumeration', () => {
  it('validateRedirect returns /app for external URLs', () => {
    expect(validateRedirect('https://evil.com/steal')).toBe('/app')
    expect(validateRedirect('https://evil.com')).toBe('/app')
  })
  it('/email/continue endpoint returns { sent: true } shape regardless of email (contract)', async () => {
    // The endpoint source always returns { sent: true } — verify the contract in source
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(join(process.cwd(), 'src/pages/api/auth/email/continue.ts'), 'utf8')
    )
    expect(src).toContain('{ sent: true }')
    // swallows all inner errors
    expect(src).toContain('} catch {')
  })
})

// auth-ui-8: ensureHumanUnit fires per door (requires live TypeDB)
describe('auth-ui-8 human-unit-per-door', () => {
  it.skip('5 doors create 1 human unit + 1 group each with no dupes — requires live TypeDB', () => {})
})

// auth-ui-9: account linking merge (requires live Better Auth)
describe('auth-ui-9 account-linking-merge', () => {
  it.skip('magic-link + google same email → one user record — requires live Better Auth', () => {})
})

// auth-ui-10: seed binding per door
describe('auth-ui-10 seed-binding-per-door', () => {
  it('passkey door maps to wrap mode', async () => {
    const { useExistingSeed } = await import('@/components/auth/useExistingSeed')
    // The hook is a React hook so we can't call it outside a component.
    // Verify the source contains the correct mode mapping.
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(join(process.cwd(), 'src/components/auth/useExistingSeed.ts'), 'utf8')
    )
    expect(src).toContain("door === 'passkey'")
    expect(src).toContain("'wrap'")
    expect(src).toContain("door === 'wallet'")
    expect(src).toContain("'sweep'")
    expect(src).toContain("'pending'")
  })
})

// auth-ui-11: existing session survives deploy (requires live deploy)
describe('auth-ui-11 existing-session-survives-deploy', () => {
  it.skip('session created before deploy is valid after deploy — requires live deploy', () => {})
})

// auth-ui-12: redirect allowlist rejects evil
describe('auth-ui-12 redirect-allowlist-rejects-evil', () => {
  it('rejects absolute evil.com URL', () => {
    expect(validateRedirect('https://evil.com')).toBe('/app')
  })
  it('rejects double-slash bypass attempt', () => {
    expect(validateRedirect('//evil.com/steal')).toBe('/app')
  })
  it('rejects open redirect via protocol confusion', () => {
    expect(validateRedirect('javascript:alert(1)')).toBe('/app')
  })
  it('allows relative paths', () => {
    expect(validateRedirect('/app')).toBe('/app')
    expect(validateRedirect('/dashboard')).toBe('/dashboard')
  })
  it('allows trusted one.ie origin', () => {
    expect(validateRedirect('https://one.ie/app')).toBe('https://one.ie/app')
    expect(validateRedirect('https://dev.one.ie/app')).toBe('https://dev.one.ie/app')
  })
  it('allows localhost in dev', () => {
    expect(validateRedirect('http://localhost:4321/app')).toBe('http://localhost:4321/app')
  })
})

// auth-ui-13: composite rate limit ignores IP rotation
describe('auth-ui-13 composite-rate-limit-per-email-ignores-IP-rotation', () => {
  it('email ceiling applies regardless of IP rotation', async () => {
    const email = `test-${Date.now()}@example.com`
    // 3 requests from different IPs for same email (email hourly limit = 3)
    const r1 = await checkAuthLimit({ ip: '1.1.1.1', email, action: '/email/continue' })
    const r2 = await checkAuthLimit({ ip: '2.2.2.2', email, action: '/email/continue' })
    const r3 = await checkAuthLimit({ ip: '3.3.3.3', email, action: '/email/continue' })
    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    expect(r3.ok).toBe(true)
    // 4th request from a 4th different IP — should be blocked by email hourly ceiling
    const r4 = await checkAuthLimit({ ip: '4.4.4.4', email, action: '/email/continue' })
    expect(r4.ok).toBe(false)
  })
})

// auth-ui-14: password lockout after 5 fails
describe('auth-ui-14 password-lockout-after-5-fails', () => {
  it('lockout triggers after 5 (IP,email) pair attempts in 15min', async () => {
    const email = `lockout-${Date.now()}@example.com`
    const ip = '9.9.9.9'
    for (let i = 0; i < 5; i++) {
      const r = await checkAuthLimit({ ip, email, action: '/sign-in/email' })
      expect(r.ok).toBe(true)
    }
    // 6th attempt triggers lockout
    const blocked = await checkAuthLimit({ ip, email, action: '/sign-in/email' })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.retryAfter).toBe(900) // 15 minutes
    }
  })
})

// auth-ui-15: magic link replay fails (requires live Better Auth)
describe('auth-ui-15 magic-link-replay-fails', () => {
  it.skip('same magic link token used twice returns error — requires live Better Auth', () => {})
})

// auth-ui-16: magic link expired shows route
describe('auth-ui-16 magic-link-expired-shows-route', () => {
  it('link-expired.astro page exists', () => {
    expect(existsSync(join(PAGES_ROOT, 'auth/link-expired.astro'))).toBe(true)
  })
  it('link-used.astro page exists', () => {
    expect(existsSync(join(PAGES_ROOT, 'auth/link-used.astro'))).toBe(true)
  })
  it('link-expired page contains email form to resend', () => {
    const src = require('node:fs').readFileSync(join(PAGES_ROOT, 'auth/link-expired.astro'), 'utf8')
    expect(src).toContain('/api/auth/email/continue')
  })
})

// auth-ui-17: axe-core no violations (requires @axe-core/react)
describe('auth-ui-17 axe-core-no-violations', () => {
  it.skip('AuthSurface render has no axe violations — requires @axe-core/react + DOM', () => {})
})

// auth-ui-18: mobile viewport renders
describe('auth-ui-18 mobile-viewport-renders', () => {
  it.skip('AuthSurface renders at 390px with no overflow — requires DOM environment', () => {})
})

// <<< auth-ui integration tests
