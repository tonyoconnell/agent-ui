/**
 * POST /api/pay — x402 payment between units
 *
 * Body: { from: string, to: string, task: string, amount: number }
 * Records signal with amount, strengthens path by payment amount (revenue = weight).
 */
import type { APIRoute } from 'astro'
import { resolveUnit } from '@/lib/sui'
import { readParsed, write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { from, to, task, amount } = (await request.json()) as {
    from: string
    to: string
    task: string
    amount: number
  }

  if (!from || !to || !task || !amount || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Missing from, to, task, or valid amount' }), { status: 400 })
  }

  // Gate stage-10: cross-org payments require public path scope
  // Use ADL_ENFORCEMENT_MODE for audit/enforce semantics
  const { enforcementMode, audit } = await import('@/engine/adl-cache')
  const payMode = enforcementMode()

  // Check if from and to are in different groups
  const groupRows = await readParsed(`
    match $uf isa unit, has uid "${(from as string).replace(/"/g, '')}";
          $ut isa unit, has uid "${(to as string).replace(/"/g, '')}";
          (group: $gf, member: $uf) isa membership;
          (group: $gt, member: $ut) isa membership;
          $gf has gid $gfid; $gt has gid $gtid;
    select $gfid, $gtid;
  `).catch(() => [] as any[])

  if (groupRows.length > 0) {
    const gf = (groupRows[0] as any).gfid as string
    const gt = (groupRows[0] as any).gtid as string
    if (gf !== gt) {
      // Cross-org payment — check path scope
      const scopeRows = await readParsed(`
        match $p isa path, has from $f, has to $t, has scope $sc;
              $uf isa unit, has uid "${(from as string).replace(/"/g, '')}"; $f = $uf;
              $ut isa unit, has uid "${(to as string).replace(/"/g, '')}"; $t = $ut;
        select $sc;
      `).catch(() => [] as any[])

      const hasPublicScope = (scopeRows as any[]).some((r) => (r as any).sc === 'public')
      if (!hasPublicScope) {
        audit({
          sender: from as string,
          receiver: to as string,
          gate: 'stage-10',
          decision: payMode === 'enforce' ? 'deny' : 'would-deny',
          mode: payMode,
          reason: 'cross-org payment requires public path scope',
        })
        if (payMode === 'enforce') {
          return Response.json(
            {
              error: 'cross-org payment requires public path scope',
              gate: 'stage-10',
              upgrade: 'POST /api/paths/:id/scope',
            },
            { status: 403 },
          )
        }
      }
    }
  }

  const now = new Date().toISOString().replace('Z', '')

  // Record payment signal
  await write(`
    match
      $from isa unit, has uid "${from}";
      $to isa unit, has uid "${to}";
    insert
      (sender: $from, receiver: $to) isa signal,
        has data "${task}",
        has amount ${amount},
        has success true,
        has ts ${now};
  `)

  // Strengthen path by payment amount (revenue = weight)
  await write(`
    match
      $from isa unit, has uid "${from}";
      $to isa unit, has uid "${to}";
      $e (source: $from, target: $to) isa path,
        has strength $s, has traversals $t, has revenue $r;
    delete $s of $e; delete $t of $e; delete $r of $e;
    insert
      $e has strength ($s + ${amount}),
        has traversals ($t + 1),
        has revenue ($r + ${amount});
  `).catch(() =>
    write(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${to}";
      insert
        (source: $from, target: $to) isa path,
          has strength ${amount}, has resistance 0.0,
          has traversals 1, has revenue ${amount};
    `),
  )

  // Mirror to Sui (if both units have wallets)
  const suiDigest: string | null = null
  try {
    const fromUnit = await resolveUnit(from)
    const toUnit = await resolveUnit(to)
    if (fromUnit?.objectId && toUnit?.objectId) {
      // TODO: need path object ID — for now, Sui pay requires on-chain Path
      // This will work once createPath is called during first signal between units
    }
  } catch {
    // Sui not configured — TypeDB payment still recorded
  }

  // Fire-and-forget substrate:pay signal (rule 4 — weight rail, status captured)
  // Rail is "crypto" if Sui mirror succeeded, else "weight"
  const payRail = suiDigest ? 'crypto' : 'weight'
  const baseUrl =
    typeof import.meta !== 'undefined'
      ? ((import.meta as { env?: Record<string, string> }).env?.ONE_API_URL ?? 'http://localhost:4321')
      : 'http://localhost:4321'
  // Promise.resolve wrap tolerates environments where fetch is undefined or throws sync
  Promise.resolve()
    .then(() =>
      fetch(`${baseUrl}/api/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'substrate:pay',
          data: {
            weight: amount,
            tags: ['pay', payRail, 'accept'],
            content: {
              rail: payRail,
              from,
              to,
              ref: task,
              status: 'captured',
              provider: 'sui-direct',
            },
          },
        }),
      }),
    )
    .catch(() => {})

  return new Response(JSON.stringify({ ok: true, from, to, task, amount, sui: suiDigest }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
