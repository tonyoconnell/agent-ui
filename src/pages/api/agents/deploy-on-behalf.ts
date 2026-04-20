/**
 * POST /api/agents/deploy-on-behalf
 *
 * Stage 5b (3rd lane) — Trust Inheritance.
 *
 * Deploys a new agent unit on behalf of an existing owner, inheriting
 * half-strength copies of the owner's top-5 outbound paths.
 *
 * Body:
 *   { owner: string, spec: { name: string, model?: string, skills?: string[], group?: string } }
 *
 * Returns:
 *   { ok: true, uid: string, owner: string, inheritedPaths: {from, to, strength}[] }
 *
 * Rejects if owner has fewer than 3 proven outbound paths (not proven enough to
 * delegate trust) or if required fields are missing.
 */

import type { APIRoute } from 'astro'
import { readParsed, writeSilent } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      owner?: string
      spec?: Record<string, unknown>
    }

    if (!body.owner || !body.spec) {
      return Response.json({ error: 'owner and spec are required' }, { status: 400 })
    }

    const owner = body.owner
    const spec = body.spec

    if (!spec.name || typeof spec.name !== 'string') {
      return Response.json({ error: 'spec.name is required' }, { status: 400 })
    }

    const specName = spec.name as string

    // Gate: operator+ AND caller must be owner OR chairman
    const { requireRole } = await import('@/lib/api-auth')
    const gate = await requireRole(request, 'add_unit', { uid: owner, gate: 'stage-5b' })
    if (!gate.ok) return gate.res
    // Owner identity check: caller must be owner or chairman
    const canAct = gate.auth.user === owner || ['chairman', 'ceo'].includes(gate.role)
    if (!canAct) {
      const { enforcementMode, audit } = await import('@/engine/adl-cache')
      const mode = enforcementMode()
      audit({
        sender: gate.auth.user,
        receiver: owner,
        gate: 'stage-5b',
        decision: mode === 'enforce' ? 'deny' : 'would-deny',
        mode,
        reason: 'caller is not owner or chairman',
      })
      if (mode === 'enforce') {
        return Response.json({ error: 'caller must be owner or chairman', gate: 'stage-5b' }, { status: 403 })
      }
    }

    // Query owner's top-5 outbound paths by strength
    const pathRows = await readParsed(`
      match $p isa path, has from $f, has to $t, has strength $s;
      $u isa unit, has uid "${owner}"; $f = $u;
      sort $s desc; limit 5;
      select $f, $t, $s;
    `)

    if (pathRows.length < 3) {
      return Response.json(
        {
          error: `Owner "${owner}" has only ${pathRows.length} proven outbound path(s); minimum 3 required for trust inheritance`,
        },
        { status: 400 },
      )
    }

    // Derive the new unit's uid: owner-namespaced
    const newUid = `${owner}:${specName}`

    // Write the new unit to TypeDB (tagged with owner for lineage)
    await writeSilent(`insert $u isa unit, has uid "${newUid}", has name "${specName}", has tag "${owner}";`)

    // Inherit half-strength copies of owner's top-5 paths
    const inheritedPaths: { from: string; to: string; strength: number }[] = []

    for (const row of pathRows) {
      const toUid = row.t as string | undefined
      const ownerStrength = typeof row.s === 'number' ? row.s : Number(row.s ?? 0)
      const halfStrength = ownerStrength * 0.5

      if (!toUid) continue

      await writeSilent(`
        match $u isa unit, has uid "${newUid}"; $t isa unit, has uid "${toUid}";
        insert (from: $u, to: $t) isa path, has strength ${halfStrength};
      `)

      inheritedPaths.push({ from: newUid, to: toUid, strength: halfStrength })
    }

    return Response.json({
      ok: true,
      uid: newUid,
      owner,
      inheritedPaths,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: msg }, { status: 500 })
  }
}
