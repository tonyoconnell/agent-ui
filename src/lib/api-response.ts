/**
 * Shared response builders for owner-tier endpoints.
 * Locks the V1 shape: { ok: bool, error?: string, reason?: string, ...extra }
 * for non-2xx; { ok: true, ...payload } for 2xx.
 */

export function ok<T extends Record<string, unknown>>(payload: T = {} as T, init?: ResponseInit): Response {
  return new Response(JSON.stringify({ ok: true, ...payload }), {
    status: 200,
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
}

export function err(status: number, error: string, reason?: string, extra?: Record<string, unknown>): Response {
  const body = { ok: false, error, ...(reason ? { reason } : {}), ...(extra ?? {}) }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Common helpers
export const unauthorized = (reason?: string) => err(401, 'unauthenticated', reason)
export const forbidden = (error: string, reason?: string) => err(403, error, reason)
export const badRequest = (reason: string) => err(400, 'bad-input', reason)
export const conflict = (reason?: string) => err(409, 'already-registered', reason)
export const notFound = (reason?: string) => err(404, 'not-found', reason)
export const serviceUnavailable = (error: string, reason?: string) => err(503, error, reason)
