import { readParsed } from './typedb'

/**
 * Pre-LLM trust gate: actor is trusted if ANY of:
 * 1. Owns a group (membership with group-type "owns")
 * 2. Has paid to sender (path with revenue > 0)
 * 3. Has explicit invite (membership with member-role "invited")
 */
export async function isTrustedActor(uid: string): Promise<boolean> {
  const safeUid = uid.replace(/[^a-zA-Z0-9_:.-]/g, '')

  try {
    const ownRows = await readParsed(`
      match $u isa unit, has uid "${safeUid}";
      (member: $u, group: $g) isa membership;
      $g has group-type "owns";
      select $u;
      limit 1;
    `).catch(() => [])
    if (ownRows.length > 0) return true

    const revRows = await readParsed(`
      match $u isa unit, has uid "${safeUid}";
      (source: $u) isa path, has revenue $r;
      $r > 0.0;
      select $u;
      limit 1;
    `).catch(() => [])
    if (revRows.length > 0) return true

    const invRows = await readParsed(`
      match $u isa unit, has uid "${safeUid}";
      (member: $u) isa membership, has member-role "invited";
      select $u;
      limit 1;
    `).catch(() => [])
    if (invRows.length > 0) return true

    return false
  } catch {
    return false
  }
}
