import { apiRequest } from '../lib/http.js'
import { flagNumber, flagString, parseArgs } from '../lib/args.js'

export const name = 'group'

const USAGE = `
group <subcommand> [options]

Subcommands:
  create <gid> --name <n> [--type world|org|team|community|dao|friends|personal] [--visibility public|private]
  list
  join <gid>
  leave <gid>
  members <gid>
  invite <gid> <uid> [--role member|operator|agent]
  bridge <from> <to>
  inbox <uid> [--limit N]
`.trim()

export async function run(argv: string[]): Promise<void> {
  const [sub, ...rest] = argv
  if (!sub || sub === '--help' || sub === '-h') {
    console.log(USAGE)
    return
  }

  const args = parseArgs(rest)

  switch (sub) {
    case 'create': {
      const gid = rest[0]
      if (!gid) { console.log(JSON.stringify({ error: 'gid required' })); return }
      const res = await apiRequest('/api/groups', {
        method: 'POST',
        body: { gid, name: flagString(args, 'name') ?? gid, groupType: flagString(args, 'type') ?? 'org', visibility: flagString(args, 'visibility') ?? 'private' },
      }).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'list': {
      const res = await apiRequest('/api/groups').catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'join': {
      const gid = rest[0]
      if (!gid) { console.log(JSON.stringify({ error: 'gid required' })); return }
      const res = await apiRequest('/api/groups/join', {
        method: 'POST',
        body: { gid },
      }).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'leave': {
      const gid = rest[0]
      if (!gid) { console.log(JSON.stringify({ error: 'gid required' })); return }
      const res = await apiRequest('/api/groups/leave', {
        method: 'POST',
        body: { gid },
      }).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'members': {
      const gid = rest[0]
      if (!gid) { console.log(JSON.stringify({ error: 'gid required' })); return }
      const res = await apiRequest(`/api/groups/${encodeURIComponent(gid)}/members`).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'invite': {
      const gid = rest[0]
      const uid = rest[1]
      if (!gid || !uid) { console.log(JSON.stringify({ error: 'gid and uid required' })); return }
      const res = await apiRequest(`/api/groups/${encodeURIComponent(gid)}/invite`, {
        method: 'POST',
        body: { uid, role: flagString(args, 'role') ?? 'member' },
      }).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'bridge': {
      const from = rest[0]
      const to = rest[1]
      if (!from || !to) { console.log(JSON.stringify({ error: 'from and to gids required' })); return }
      const res = await apiRequest('/api/paths/bridge', {
        method: 'POST',
        body: { from, to },
      }).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    case 'inbox': {
      const uid = rest[0]
      if (!uid) { console.log(JSON.stringify({ error: 'uid required' })); return }
      const limit = flagNumber(args, 'limit')
      const qs = limit ? `?limit=${limit}` : ''
      const res = await apiRequest(`/api/inbox/${encodeURIComponent(uid)}${qs}`).catch((e: Error) => ({ error: e.message }))
      console.log(JSON.stringify(res, null, 2))
      break
    }
    default:
      console.log(JSON.stringify({ error: `unknown subcommand: ${sub}` }))
  }
}
