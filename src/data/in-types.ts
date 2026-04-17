// Shape of the /in inbox dataset. Data lives in `in.json` and is imported
// at build time — the JSON is bundled into the JS and loaded in memory from
// first paint. Zero fetch, zero round-trip.
//
// Dimensions follow the six canonical names from docs/dictionary.md. Any
// page can create its own JSON matching this schema and mount the Inbox
// component with its own data.

export type Dimension = 'groups' | 'actors' | 'things' | 'paths' | 'events' | 'learning'

export type Status = 'now' | 'top' | 'todo' | 'done'

export interface InboxEntity {
  id: string
  dimension: Dimension
  title: string
  subtitle: string
  preview: string
  body?: string
  code?: string
  timestamp: number
  unread: boolean
  status: Status
  tags: string[]
  related?: string[]
  sender?: string
  group?: string
  channel?: string
  properties?: Record<string, unknown>
}

export interface InboxData {
  meta: {
    name: string
    version: string
    generated: number
    description?: string
  }
  entities: InboxEntity[]
}

export const DIMENSIONS: readonly Dimension[] = ['groups', 'actors', 'things', 'paths', 'events', 'learning'] as const

export const STATUS_FILTERS: readonly Status[] = ['now', 'top', 'todo', 'done'] as const

export const DIMENSION_LABEL: Record<Dimension, string> = {
  groups: 'Groups',
  actors: 'Actors',
  things: 'Things',
  paths: 'Paths',
  events: 'Events',
  learning: 'Learning',
}

export function countBy(data: InboxData, dim: Dimension): number {
  let n = 0
  for (const e of data.entities) if (e.dimension === dim) n++
  return n
}

export function filterInbox(data: InboxData, dim: Dimension, status: Status, query: string): InboxEntity[] {
  const q = query.trim().toLowerCase()
  const out: InboxEntity[] = []
  for (const e of data.entities) {
    if (e.dimension !== dim) continue
    if (e.status !== status) continue
    if (q) {
      const hay = `${e.title.toLowerCase()} ${e.subtitle.toLowerCase()} ${e.preview.toLowerCase()}`
      if (!hay.includes(q)) continue
    }
    out.push(e)
  }
  return out.sort((a, b) => b.timestamp - a.timestamp)
}
