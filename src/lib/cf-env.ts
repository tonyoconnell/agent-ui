/**
 * Cloudflare env accessor — both dev and prod run on workerd via
 * `@astrojs/cloudflare@13`, so `cloudflare:workers` resolves in both.
 * `locals.runtime.env` is the legacy fallback (Astro 6 emits a deprecation
 * warning but still populates it).
 *
 * Usage:
 *   const db = await getD1(locals)
 *   if (!db) return new Response('D1 not available', { status: 503 })
 *
 * For Bun scripts/tests that need D1 without spinning up workerd, import
 * `getLocalD1` from `./local-d1` directly — it opens the wrangler-managed
 * SQLite file via `bun:sqlite`.
 */

/**
 * Returns the runtime env (KV/DB/IMAGES/etc.) — both `cloudflare:workers`
 * and the legacy `locals.runtime.env` are tried. Returns `{}` if neither
 * works (shouldn't happen in normal dev/prod under @astrojs/cloudflare v13).
 */
export async function getEnv(locals: App.Locals | undefined): Promise<Record<string, unknown>> {
  try {
    const mod = (await import('cloudflare:workers' as string)) as { env?: Record<string, unknown> }
    if (mod.env) return mod.env
  } catch {
    /* fall through to legacy locals path */
  }
  try {
    return ((locals as { runtime?: { env?: Record<string, unknown> } })?.runtime?.env as Record<string, unknown>) ?? {}
  } catch {
    return {}
  }
}

/**
 * Returns the D1 binding, or null if unreachable. Under @astrojs/cloudflare v13
 * the `cloudflare:workers` import resolves in both dev (workerd-in-Vite) and
 * prod (deployed Worker), so the first branch wins almost always.
 */
export async function getD1(locals: App.Locals | undefined): Promise<D1Database | null> {
  try {
    const mod = (await import('cloudflare:workers' as string)) as { env?: { DB?: D1Database } }
    if (mod.env?.DB) return mod.env.DB
  } catch {
    /* fall through to legacy locals path */
  }
  try {
    return locals?.runtime?.env?.DB ?? null
  } catch {
    return null
  }
}
