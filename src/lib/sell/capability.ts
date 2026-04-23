/**
 * Server-side capability creation.
 *
 * Creates a skill + capability relation in TypeDB and returns the
 * capability ID plus the pay.one.ie link for sharing.
 */
import { writeSilent } from '@/lib/typedb'

export interface CreateCapabilityArgs {
  uid: string
  name: string
  priceMist: bigint
  tags: string[]
  description?: string
}

export interface CreateCapabilityResult {
  capabilityId: string
  payUrl: string
}

/** Convert MIST (1e9 per SUI) to SUI as a float for TypeDB price storage. */
function mistToSui(mist: bigint): number {
  return Number(mist) / 1_000_000_000
}

/** Derive a URL-safe slug from a capability ID. */
function slugify(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Escape a string for inline TQL double-quoted literals. */
function q(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Create a skill + capability relation in TypeDB.
 *
 * skill-id format: `<uid-slug>:<name-slug>` — deterministic from uid + name.
 * This ensures idempotent re-minting (re-running with the same args is safe).
 */
export async function createCapability(args: CreateCapabilityArgs): Promise<CreateCapabilityResult> {
  const { uid, name, priceMist, tags, description } = args

  const uidSlug = slugify(uid)
  const nameSlug = slugify(name)
  const capabilityId = `${uidSlug}:${nameSlug}`
  const priceSui = mistToSui(priceMist)

  // Build tag clauses
  const allTags = [...tags]
  if (description) allTags.push(`description:${description.slice(0, 120)}`)

  const tagLines = allTags.map((t) => `has tag "${q(t)}"`).join(', ')
  const tagClause = tagLines ? `, ${tagLines}` : ''

  // Upsert skill: try updating price on existing skill, fall back to full insert
  await writeSilent(`
    match $s isa skill, has skill-id "${q(capabilityId)}";
    insert $s has price ${priceSui};
  `).then(undefined, () =>
    writeSilent(`
      insert $s isa skill,
        has skill-id "${q(capabilityId)}",
        has name "${q(name)}",
        has price ${priceSui}${tagClause};
    `),
  )

  // Insert capability relation: provider unit → offered skill
  await writeSilent(`
    match
      $u isa unit, has uid "${q(uid)}";
      $s isa skill, has skill-id "${q(capabilityId)}";
    insert (provider: $u, offered: $s) isa capability, has price ${priceSui};
  `)

  const payUrl = `https://pay.one.ie/${slugify(capabilityId)}`

  return { capabilityId, payUrl }
}
