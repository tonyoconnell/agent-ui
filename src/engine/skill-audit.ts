import { readParsed } from '@/lib/typedb'

export interface AuditCandidate {
  providerUid: string
  skillId: string
  skillName: string
  price: number
  pathStrength: number
  tagOverlap: number
  matchingTags: string[]
}

export interface AuditResult {
  tags: string[]
  capable: AuditCandidate[]
  recommendation: 'ready' | 'exploratory' | 'acquire'
  acquisition?: {
    kind: 'install' | 'learn' | 'hire' | 'import'
    suggestedTaskId: string
    rationale: string
  }
  best?: AuditCandidate
}

const VALID_TAG = /^[a-zA-Z0-9:_.-]+$/

function sanitizeTags(tags: string[]): string[] {
  return tags.filter((t) => VALID_TAG.test(t))
}

function acquisitionKind(tags: string[]): 'install' | 'learn' | 'hire' | 'import' {
  if (tags.some((t) => t.includes('corpus') || t.includes('ingest') || t.includes('doc'))) return 'import'
  if (tags.some((t) => t.includes('market') || t.includes('agency') || t.includes('vendor'))) return 'hire'
  if (tags.some((t) => t.includes('sdk') || t.includes('npm') || t.includes('pkg'))) return 'install'
  return 'learn'
}

function score(c: AuditCandidate, maxPrice: number): number {
  const tagScore = c.tagOverlap
  const pathScore = Math.min(c.pathStrength / 50, 1)
  const budgetFit = 1
  const priceScore = maxPrice > 0 ? 1 - c.price / maxPrice : 1
  return 0.4 * tagScore + 0.35 * pathScore + 0.15 * budgetFit + 0.1 * priceScore
}

export async function auditSkills(
  tags: string[],
  opts: { budget?: number; requesterUid?: string } = {},
): Promise<AuditResult> {
  const safeTags = sanitizeTags(tags)

  if (safeTags.length === 0) {
    return {
      tags: safeTags,
      capable: [],
      recommendation: 'acquire',
      acquisition: {
        kind: acquisitionKind(tags),
        suggestedTaskId: `acquire-${tags[0] ?? 'unknown'}-skill`,
        rationale: 'No valid tags provided — cannot locate matching capabilities.',
      },
    }
  }

  // Q1: capabilities matching any of the requested tags
  const tagList = safeTags.map((t) => `"${t}"`).join(', ')
  const capRows = await readParsed(`
    match
      $s isa skill, has skill-id $sid, has tag $stag;
      $stag in [${tagList}];
      $cap (provider: $u, offered: $s) isa capability;
      $u has uid $uid;
      $s has price $price;
      $s has name $sname;
    select $uid, $sid, $sname, $price, $stag;
  `)

  // Aggregate by (uid, sid) — collect matching tags per pair
  const byKey = new Map<string, AuditCandidate>()
  for (const row of capRows) {
    const uid = row.uid as string
    const sid = row.sid as string
    const key = `${uid}::${sid}`
    if (!byKey.has(key)) {
      byKey.set(key, {
        providerUid: uid,
        skillId: sid,
        skillName: (row.sname as string) ?? sid,
        price: Number(row.price ?? 0),
        pathStrength: 0,
        tagOverlap: 0,
        matchingTags: [],
      })
    }
    const entry = byKey.get(key)!
    const tag = row.stag as string
    if (!entry.matchingTags.includes(tag)) {
      entry.matchingTags.push(tag)
    }
    entry.tagOverlap = entry.matchingTags.length / safeTags.length
  }

  // Q2: path strength from requester to each provider (if known)
  if (opts.requesterUid && byKey.size > 0) {
    const uidList = [...new Set([...byKey.values()].map((c) => `"${c.providerUid}"`))].join(', ')
    const pathRows = await readParsed(`
      match
        $req isa unit, has uid "${opts.requesterUid}";
        $to isa unit, has uid $tuid;
        $tuid in [${uidList}];
        $p (source: $req, target: $to) isa path, has strength $s;
      select $tuid, $s;
    `)
    for (const row of pathRows) {
      const tuid = row.tuid as string
      const strength = Number(row.s ?? 0)
      for (const candidate of byKey.values()) {
        if (candidate.providerUid === tuid) {
          candidate.pathStrength = Math.max(candidate.pathStrength, strength)
        }
      }
    }
  }

  // Filter by budget
  const capable = [...byKey.values()].filter((c) => opts.budget === undefined || c.price <= opts.budget)

  if (capable.length === 0) {
    return {
      tags: safeTags,
      capable: [],
      recommendation: 'acquire',
      acquisition: {
        kind: acquisitionKind(safeTags),
        suggestedTaskId: `acquire-${safeTags[0]}-skill`,
        rationale: `No capable units found for tags [${safeTags.join(', ')}].`,
      },
    }
  }

  // Rank candidates
  const maxPrice = Math.max(...capable.map((c) => c.price), 1)
  const ranked = [...capable].sort((a, b) => score(b, maxPrice) - score(a, maxPrice))
  const best = ranked[0]

  const recommendation = best.pathStrength >= 50 ? 'ready' : 'exploratory'

  return { tags: safeTags, capable: ranked, recommendation, best }
}
