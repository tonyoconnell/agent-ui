/**
 * GET /api/market/bundle/:id — Resolve a highway edge as a priced bundle
 *
 * :id  — URL-encoded highway edge string, e.g. "scout%E2%86%92analyst"
 *         decoded to "scout→analyst"
 *
 * Returns:
 *   {
 *     id, from, to, strength, traversals,
 *     skills: [{ skillId, name, price }],
 *     totalPrice,
 *     status: 'active' | 'toxic' | 'exploratory'
 *   }
 *
 * Error: 404 { error: string }
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export type BundleDetail = {
  id: string
  from: string
  to: string
  strength: number
  traversals: number
  skills: Array<{ skillId: string; name: string; price: number }>
  totalPrice: number
  status: 'active' | 'toxic' | 'exploratory'
}

/** Derive status from path metrics */
function pathStatus(strength: number, resistance: number): BundleDetail['status'] {
  if (resistance >= 10 && resistance > strength * 2 && strength + resistance > 5) return 'toxic'
  if (strength === 0 && resistance === 0) return 'exploratory'
  return 'active'
}

export const GET: APIRoute = async ({ params }) => {
  // Decode URL-encoded edge id, e.g. "scout%E2%86%92analyst" → "scout→analyst"
  const raw = params.id ?? ''
  const edge = decodeURIComponent(raw)

  // Parse "from→to" — support both → (U+2192) and -> as separators
  const sep = edge.includes('→') ? '→' : '->'
  const parts = edge.split(sep)
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return Response.json({ error: `Invalid edge format: "${edge}". Expected "from→to".` }, { status: 404 })
  }

  const [from, to] = parts.map((p) => p.trim())

  // Sanitise: reject anything that looks like TypeQL injection
  const safe = (s: string) => /^[\w:.-]+$/.test(s)
  if (!safe(from) || !safe(to)) {
    return Response.json({ error: 'Invalid characters in edge id.' }, { status: 404 })
  }

  try {
    // 1. Query path strength + resistance (traversals derived from strength proxy)
    const pathRows = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r;
        $s has uid "${from}";
        $t has uid "${to}";
      select $str, $r;
    `)

    if (!pathRows.length) {
      return Response.json({ error: `Path not found: "${edge}"` }, { status: 404 })
    }

    const strength = pathRows[0].str as number
    const resistance = (pathRows[0].r as number) ?? 0
    // traversals: TypeDB doesn't store a raw count separately — use strength as proxy
    const traversals = Math.round(strength)

    // 2. Query capabilities offered by the source unit
    const capRows = await readParsed(`
      match
        $u has uid "${from}";
        (provider: $u, offered: $s) isa capability, has price $p;
        $s isa skill, has skill-id $sid, has name $sname;
      select $sid, $sname, $p;
    `).catch(() => [] as Record<string, unknown>[])

    const skills = capRows.map((r) => ({
      skillId: r.sid as string,
      name: r.sname as string,
      price: r.p as number,
    }))

    const totalPrice = skills.reduce((sum, s) => sum + s.price, 0)

    const bundle: BundleDetail = {
      id: edge,
      from,
      to,
      strength,
      traversals,
      skills,
      totalPrice: Math.round(totalPrice * 10000) / 10000,
      status: pathStatus(strength, resistance),
    }

    return Response.json(bundle, {
      headers: { 'Cache-Control': 'public, max-age=10' },
    })
  } catch {
    return Response.json({ error: `Failed to resolve bundle: "${edge}"` }, { status: 500 })
  }
}
