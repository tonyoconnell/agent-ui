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

import { unit, type Unit } from './world'

export interface ApiOpts {
  base: string
  auth?: string                          // 'Bearer TOKEN' or 'Basic ...'
  headers?: Record<string, string>
  timeout?: number                       // ms, default 10_000
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
    .on('get', async (data) => {
      const { path, params } = data as { path: string; params?: Record<string, string> }
      const url = new URL(base + path)
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      const res = await fetch(url.toString(), { headers: h, signal: ctrl(timeout).signal }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('post', async (data) => {
      const { path, body } = data as { path: string; body: unknown }
      const res = await fetch(base + path, {
        method: 'POST', headers: h, body: JSON.stringify(body), signal: ctrl(timeout).signal
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('put', async (data) => {
      const { path, body } = data as { path: string; body: unknown }
      const res = await fetch(base + path, {
        method: 'PUT', headers: h, body: JSON.stringify(body), signal: ctrl(timeout).signal
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('del', async (data) => {
      const { path } = data as { path: string }
      const res = await fetch(base + path, {
        method: 'DELETE', headers: h, signal: ctrl(timeout).signal
      }).catch(() => null)
      return res?.ok ? { deleted: true } : null
    })
}
