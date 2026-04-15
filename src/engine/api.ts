/**
 * API Unit Factory — wrap any HTTP endpoint as a substrate unit.
 *
 * null return → warn() fires automatically (no result = failure).
 * STAN learns latency, penalises slow APIs, routes around failures.
 *
 * Tasks: get | post | put | del
 *
 * Usage:
 *   net.units['github'] = apiUnit('github', {
 *     base: 'https://api.github.com',
 *     auth: `Bearer ${GITHUB_TOKEN}`
 *   })
 *   net.signal({ receiver: 'github:post',
 *     data: { path: '/repos/o/r/pulls', body: { title: 'Auto PR', head: 'feat', base: 'main' } }
 *   }, 'scout')
 */

import { readParsed } from '@/lib/typedb'
import { API_PERM_CACHE, API_PERM_TTL, audit, enforcementMode } from './adl-cache'
import { type Unit, unit } from './world'

// ADL: perm-network gate — shared cache from adl-cache.ts (Cycle 1.6 consolidation).
// Invalidated by `invalidateAdlCache(uid)` on every ADL write path.

function apiHostsAllow(hostname: string, allowedHosts: string[]): boolean {
  if (!allowedHosts.length) return true
  if (allowedHosts.includes('*')) return true
  return allowedHosts.includes(hostname)
}

async function canCallAPI(callerId: string, targetBase: string): Promise<boolean> {
  let hostname: string
  try {
    hostname = new URL(targetBase).hostname
  } catch {
    return true // unparseable base → fail open
  }
  const key = `${callerId}:${hostname}`
  const cached = API_PERM_CACHE.get(key)
  if (cached && cached.expires > Date.now()) {
    const allowed = apiHostsAllow(hostname, cached.allowedHosts)
    if (!allowed) {
      const mode = enforcementMode()
      audit({
        sender: callerId,
        receiver: hostname,
        gate: 'network',
        decision: mode === 'audit' ? 'allow-audit' : 'deny',
        mode,
        reason: `host ${hostname} not in allowedHosts=${JSON.stringify(cached.allowedHosts)}`,
      })
      if (mode === 'audit') return true
    }
    return allowed
  }
  const rows = await readParsed(
    `match $u isa unit, has uid "${callerId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}", has perm-network $pn; select $pn;`,
  ).catch(() => [])
  const allowedHosts: string[] = []
  if (rows.length) {
    try {
      const perms = JSON.parse(rows[0].pn as string) as Record<string, unknown>
      const raw = perms.allowed_hosts ?? perms.allowedHosts
      if (Array.isArray(raw)) allowedHosts.push(...(raw as string[]))
    } catch {
      /* malformed → fail open */
    }
  }
  API_PERM_CACHE.set(key, { allowedHosts, expires: Date.now() + API_PERM_TTL })
  const allowed = apiHostsAllow(hostname, allowedHosts)
  if (!allowed) {
    const mode = enforcementMode()
    audit({
      sender: callerId,
      receiver: hostname,
      gate: 'network',
      decision: mode === 'audit' ? 'allow-audit' : 'deny',
      mode,
      reason: `host ${hostname} not in allowedHosts=${JSON.stringify(allowedHosts)}`,
    })
    if (mode === 'audit') return true
  }
  return allowed
}

export interface ApiOpts {
  base: string
  auth?: string // 'Bearer TOKEN' or 'Basic ...'
  headers?: Record<string, string>
  timeout?: number // ms, default 10_000
}

const buildHeaders = (opts: ApiOpts): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(opts.auth ? { Authorization: opts.auth } : {}),
  ...(opts.headers || {}),
})

const ctrl = (timeout: number) => {
  const ac = new AbortController()
  setTimeout(() => ac.abort(), timeout)
  return ac
}

export const apiUnit = (id: string, opts: ApiOpts): Unit => {
  const h = buildHeaders(opts)
  const base = opts.base.replace(/\/$/, '')
  const timeout = opts.timeout ?? 10_000

  return unit(id)
    .on('get', async (data, _emit, ctx) => {
      if (!(await canCallAPI(ctx.from, opts.base))) return { dissolved: true }
      const { path, params } = data as { path: string; params?: Record<string, string> }
      const url = new URL(base + path)
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      const res = await fetch(url.toString(), { headers: h, signal: ctrl(timeout).signal }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('post', async (data, _emit, ctx) => {
      if (!(await canCallAPI(ctx.from, opts.base))) return { dissolved: true }
      const { path, body } = data as { path: string; body: unknown }
      const res = await fetch(base + path, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(body),
        signal: ctrl(timeout).signal,
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('put', async (data, _emit, ctx) => {
      if (!(await canCallAPI(ctx.from, opts.base))) return { dissolved: true }
      const { path, body } = data as { path: string; body: unknown }
      const res = await fetch(base + path, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify(body),
        signal: ctrl(timeout).signal,
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('del', async (data, _emit, ctx) => {
      if (!(await canCallAPI(ctx.from, opts.base))) return { dissolved: true }
      const { path } = data as { path: string }
      const res = await fetch(base + path, {
        method: 'DELETE',
        headers: h,
        signal: ctrl(timeout).signal,
      }).catch(() => null)
      return res?.ok ? { deleted: true } : null
    })
}
