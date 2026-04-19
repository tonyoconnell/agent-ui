/**
 * GET /api/me/agents
 *
 * Returns the agents the authenticated caller commands — co-members of groups
 * where the caller holds role `chairman` or `ceo`.
 *
 * Shape: Array<{ uid: string, name: string, role: string, wallet: string|null, status: string|null }>
 * Auth:  resolveUnitFromSession — Bearer API key or BetterAuth session cookie.
 * 401:   returned when caller cannot be resolved.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed } from '@/lib/typedb'

export const prerender = false

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const GET: APIRoute = async ({ request }) => {
  try {
    const ctx = await resolveUnitFromSession(request)

    if (!ctx.isValid || !ctx.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }

    // Step 1: find groups where caller holds chairman or ceo role
    const membershipRows = await readParsed(`
      match
        $u isa unit, has uid "${esc(ctx.user)}";
        (member: $u, group: $g) isa membership, has member-role $r;
        $g has name $gn;
        select $gn, $r;
    `).catch(() => [])

    const authGroups = membershipRows
      .filter((row) => row.r === 'chairman' || row.r === 'ceo')
      .map((row) => row.gn as string)
      .filter(Boolean)

    if (authGroups.length === 0) {
      return Response.json([])
    }

    // Step 2: for each authoritative group, fetch co-members
    const seen = new Map<
      string,
      { uid: string; name: string; role: string; wallet: string | null; status: string | null }
    >()

    await Promise.all(
      authGroups.map(async (groupName) => {
        let memberRows: Record<string, unknown>[] = []

        // Primary: group is modelled as unit with uid = groupName
        try {
          memberRows = await readParsed(`
            match
              $g isa unit, has uid "${esc(groupName)}";
              (member: $a, group: $g) isa membership, has member-role $mrole;
              $a has uid $uid, has name $name;
              not { $a has uid "${esc(ctx.user)}"; };
              select $uid, $name, $mrole;
          `)
        } catch {
          // Fallback: group is a separate group entity with name
          try {
            memberRows = await readParsed(`
              match
                $g isa group, has name "${esc(groupName)}";
                (member: $a, group: $g) isa membership, has member-role $mrole;
                $a has uid $uid, has name $name;
                not { $a has uid "${esc(ctx.user)}"; };
                select $uid, $name, $mrole;
            `)
          } catch {
            /* group not found — skip */
          }
        }

        for (const row of memberRows) {
          const uid = row.uid as string
          if (!uid || seen.has(uid)) continue
          seen.set(uid, {
            uid,
            name: row.name as string,
            role: row.mrole as string,
            wallet: null,
            status: null,
          })
        }
      }),
    )

    if (seen.size === 0) {
      return Response.json([])
    }

    // Step 3: look up wallet + status for each agent in parallel
    await Promise.all(
      Array.from(seen.keys()).map(async (agentUid) => {
        try {
          const rows = await readParsed(`
            match $u isa unit, has uid "${esc(agentUid)}";
            optional { $u has wallet $wallet; };
            optional { $u has status $status; };
            select $wallet, $status;
          `)
          if (rows.length > 0) {
            const entry = seen.get(agentUid)!
            entry.wallet = (rows[0].wallet as string) ?? null
            entry.status = (rows[0].status as string) ?? null
          }
        } catch {
          /* best-effort — leave wallet/status null */
        }
      }),
    )

    return Response.json(Array.from(seen.values()))
  } catch (err) {
    console.error('[me/agents]', err)
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500 })
  }
}
