/**
 * Singleton PersistentWorld — loaded from TypeDB once, read from memory thereafter.
 *
 * All API routes import getNet() instead of querying TypeDB directly.
 * TypeDB writes are fire-and-forget (mark, warn, sync). Reads are always memory.
 */
import { world as createNet, type PersistentWorld } from '@/engine/persist'
import { readParsed } from '@/lib/typedb'

export type UnitMeta = {
  name: string
  kind: string
  status: string
  successRate: number
  generation: number
}

export type TagMap = Record<string, string[]>

let _net: PersistentWorld | null = null
let _units: Record<string, UnitMeta> = {}
let _tags: TagMap = {}
let _allTags: string[] = []
let _loadedAt = 0
let _loading: Promise<PersistentWorld> | null = null

/** Load unit metadata and tags from TypeDB into memory. */
async function loadMeta() {
  const [unitRows, tagRows] = await Promise.all([
    readParsed(`
      match $u isa unit, has uid $id, has name $name, has unit-kind $kind,
        has status $status, has success-rate $sr, has generation $g;
      select $id, $name, $kind, $status, $sr, $g;
    `).catch(() => []),
    readParsed(`
      match $sk isa skill, has skill-id $gid, has tag $tag;
      select $gid, $tag;
    `).catch(() => []),
  ])

  _units = {}
  for (const r of unitRows) {
    _units[r.id as string] = {
      name: r.name as string,
      kind: r.kind as string,
      status: r.status as string,
      successRate: r.sr as number,
      generation: r.g as number,
    }
  }

  _tags = {}
  const allTags = new Set<string>()
  for (const r of tagRows) {
    const gid = r.gid as string
    const tag = r.tag as string
    allTags.add(tag)
    ;(_tags[gid] ||= []).push(tag)
  }
  _allTags = [...allTags].sort()
}

/** Get or initialise the singleton world. Safe to call concurrently. */
export async function getNet(): Promise<PersistentWorld> {
  if (_net) return _net
  if (_loading) return _loading

  _loading = (async () => {
    const net = createNet()
    await Promise.all([
      net.load().catch(() => {}),
      loadMeta(),
    ])
    _net = net
    _loadedAt = Date.now()
    _loading = null
    return net
  })()

  return _loading
}

/** Force reload of unit metadata + tags from TypeDB (does not re-hydrate paths). */
export async function reloadMeta() {
  await loadMeta()
}

/** Cached unit metadata keyed by uid. */
export function getUnitMeta(): Record<string, UnitMeta> { return _units }

/** Cached tag map: skill-id → string[]. */
export function getTagMap(): TagMap { return _tags }

/** All known tags, sorted. */
export function getAllTags(): string[] { return _allTags }

/** Unix ms when the world was last loaded from TypeDB. 0 = never. */
export function loadedAt(): number { return _loadedAt }
