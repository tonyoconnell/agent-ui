/**
 * Edge reads — all from KV JSON snapshots, never TypeDB direct.
 * <1ms reads. TypeDB → KV sync happens every 5s-60s.
 */

export async function getPaths(kv: KVNamespace) {
  const json = await kv.get('paths.json')
  return json ? JSON.parse(json) as Record<string, { strength: number; resistance: number }> : {}
}

export async function getUnits(kv: KVNamespace) {
  const json = await kv.get('units.json')
  return json ? JSON.parse(json) as Record<string, { kind: string; status: string }> : {}
}

export async function getSkills(kv: KVNamespace) {
  const json = await kv.get('skills.json')
  return json ? JSON.parse(json) as Record<string, { providers: string[]; price: number }> : {}
}

export async function isToxic(kv: KVNamespace, edge: string): Promise<boolean> {
  const json = await kv.get('toxic.json')
  const toxic = json ? JSON.parse(json) as string[] : []
  return toxic.includes(edge)
}

export async function getHighways(kv: KVNamespace, limit = 10) {
  const json = await kv.get('highways.json')
  const highways = json ? JSON.parse(json) as Array<{ from: string; to: string; strength: number }> : []
  return highways.slice(0, limit)
}

export async function discover(kv: KVNamespace, skill: string) {
  const skills = await getSkills(kv)
  return skills[skill]?.providers || []
}

export async function optimalRoute(kv: KVNamespace, from: string, skill: string) {
  const paths = await getPaths(kv)
  const skills = await getSkills(kv)

  const providers = skills[skill]?.providers || []
  if (!providers.length) return null

  let best: string | null = null
  let bestWeight = -Infinity

  for (const provider of providers) {
    const edge = `${from}\u2192${provider}`
    const path = paths[edge]
    if (path) {
      const weight = path.strength - path.resistance
      if (weight > bestWeight) {
        bestWeight = weight
        best = provider
      }
    }
  }

  return best
}
