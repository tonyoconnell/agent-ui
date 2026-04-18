/**
 * Cloudflare env accessor — bridges legacy `locals.runtime.env` and v13's
 * canonical `import { env } from "cloudflare:workers"`.
 *
 * Background: Astro 6 + @astrojs/cloudflare v13 deprecated `Astro.locals.runtime.env`
 * (still populated at runtime but emits a deprecation warning). The recommended
 * replacement is `import { env } from "cloudflare:workers"` — which only resolves
 * inside the Worker runtime. In Astro dev (Node adapter) that import fails.
 *
 * Strategy: try the canonical path first (dynamic import so it doesn't crash
 * Node dev at module-load time), fall back to the legacy locals path. Callers
 * get the D1Database directly, or `null` if neither is available.
 *
 * Usage:
 *   const db = await getD1(locals)
 *   if (!db) return new Response('D1 not available', { status: 500 })
 */

/** Returns the D1 binding, or null if unreachable (dev mode without binding). */
export async function getD1(locals: App.Locals | undefined): Promise<D1Database | null> {
  // Prefer the canonical v13 path. Dynamic import so module-load in Node dev
  // doesn't fail — only throws when we actually try to resolve it at runtime.
  try {
    const mod = (await import('cloudflare:workers' as string)) as { env?: { DB?: D1Database } }
    if (mod.env?.DB) return mod.env.DB
  } catch {
    // cloudflare:workers unavailable (dev mode, Node adapter) — fall through.
  }

  // Astro 6 removed locals.runtime.env — the getter throws now instead of
  // returning undefined. Optional chaining can't save us; wrap in try/catch.
  try {
    return locals?.runtime?.env?.DB ?? null
  } catch {
    return null
  }
}
