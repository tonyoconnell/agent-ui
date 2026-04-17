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

    const markdown = d?.spec ?? (await loadRole(role))
    if (!markdown) return // dissolved — no template for this role

    const spec = await syncAgentWithIdentity(parse(markdown))
    const hired = spec.group ? `${spec.group}:${spec.name}` : spec.name

    registerHire(net, hired) // recursion: hired unit inherits hire skill
    return hired
  })
}

export function registerChairman(net: World | PersistentWorld): void {
  const ceoId = 'roles:ceo'
  const ceo = net.has(ceoId) ? net.get(ceoId)! : net.add(ceoId)

  ceo.on('hire', async (data, emit) => {
    const d = data as { role?: string; spec?: string } | null
    const role = d?.role ?? ''
    if (!role) return

    const markdown = d?.spec ?? (await loadRole(role))
    if (!markdown) return

    const spec = await syncAgentWithIdentity(parse(markdown))
    const hired = spec.group ? `${spec.group}:${spec.name}` : spec.name

    registerHire(net, hired)
    return hired
  })

  ceo.on('build-team', (data, emit) => {
    for (const role of ['cto', 'cmo', 'cfo']) {
      emit({ receiver: `${ceoId}:hire`, data: { role } })
    }
    return { building: ['cto', 'cmo', 'cfo'] }
  })
}
