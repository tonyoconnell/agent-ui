interface UnitSnapshot {
  uid: string
  tags?: string[]
  [key: string]: unknown
}

export const DEFAULT_ORIGINS: string[] = [
  'http://localhost:4321',
  'http://localhost:3000',
  'https://one.ie',
  'https://app.one.ie',
  'https://www.one.ie',
]

export async function getAllowedOrigins(agentId: string, kv: KVNamespace): Promise<string[]> {
  try {
    const raw = await kv.get('units')
    if (!raw) return []
    const units: UnitSnapshot[] = JSON.parse(raw)
    const unit = units.find((u) => u.uid === agentId)
    if (!unit?.tags) return []
    return unit.tags.filter((tag) => tag.startsWith('origin:')).map((tag) => tag.slice(7))
  } catch {
    return []
  }
}

export function isOriginAllowed(origin: string, agentAllowed: string[], corsFallback: string[]): boolean {
  return agentAllowed.includes(origin) || corsFallback.includes(origin)
}
