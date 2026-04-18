/**
 * CHAIRMAN — Wire recursive org-building handlers onto the CEO unit.
 *
 * registerChairman(net) wires hire + build-team on the CEO.
 * registerHire(net, uid) wires hire on any unit (enables recursion).
 *
 * Closed loop: mark on result, warn(0.5) on dissolved (no template).
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse, syncAgentWithIdentity } from '@/engine/agent-md'
import type { PersistentWorld } from '@/engine/persist'
import type { World } from '@/engine/world'

const ROLES_DIR = join(process.cwd(), 'agents', 'roles')

async function loadRole(role: string): Promise<string | null> {
  try {
    return await readFile(join(ROLES_DIR, `${role}.md`), 'utf-8')
  } catch {
    return null
  }
}

export function registerHire(net: World | PersistentWorld, uid: string): void {
  const unit = net.has(uid) ? net.get(uid)! : net.add(uid)

  unit.on('hire', async (data, emit) => {
    const d = data as { role?: string; spec?: string } | null
    const role = d?.role ?? ''
    if (!role) return

    // isToxic pre-check: skip LLM if this hire path has bad track record
    const edge = `${uid}→roles:${role}`
    const s = net.sense(edge)
    const r = net.danger(edge)
    if (r >= 10 && r > s * 2 && r + s > 5) return // dissolved — toxic path

    const markdown = d?.spec ?? (await loadRole(role))
    if (!markdown) return // dissolved — no template for this role

    const spec = await syncAgentWithIdentity(parse(markdown))
    const hired = spec.group ? `${spec.group}:${spec.name}` : spec.name

    net.mark(edge, 1) // pheromone: hiring path strengthens on success
    registerHire(net, hired) // recursion: hired unit inherits hire skill
    return hired
  })
}

export function registerChairman(net: World | PersistentWorld): void {
  const ceoId = 'ceo'

  // Wire hire skill (same recursive primitive as every other unit)
  registerHire(net, ceoId)

  // Wire build-team on top — CEO-specific fan-out
  const ceo = net.get(ceoId)!
  ceo.on('build-team', async (_data, emit) => {
    for (const role of ['cto', 'cmo', 'cfo']) {
      emit({ receiver: `${ceoId}:hire`, data: { role } })
    }
    return { building: ['cto', 'cmo', 'cfo'] }
  })
}
