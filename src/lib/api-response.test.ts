/**
 * Unit tests for src/lib/api-response.ts
 * Verifies the V1 locked response shape.
 */

import { describe, expect, it } from 'vitest'
import { badRequest, conflict, err, forbidden, notFound, ok, serviceUnavailable, unauthorized } from './api-response'

describe('ok()', () => {
  it('ok({ a: 1 }) → 200 with { ok: true, a: 1 }', async () => {
    const res = ok({ a: 1 })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true, a: 1 })
  })

  it('ok() with no args → 200 with { ok: true }', async () => {
    const res = ok()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })

  it('ok sets Content-Type: application/json', async () => {
    const res = ok({ x: 'y' })
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })
})

describe('err()', () => {
  it('err(400, bad-input, name required) → 400 with { ok: false, error, reason }', async () => {
    const res = err(400, 'bad-input', 'name required')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ ok: false, error: 'bad-input', reason: 'name required' })
  })

  it('err(409, already-registered) → 409 with no reason key', async () => {
    const res = err(409, 'already-registered')
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body).toEqual({ ok: false, error: 'already-registered' })
    expect(Object.keys(body)).not.toContain('reason')
  })

  it('err(503, d1-failed, undefined, { detail: X }) → 503 with extra field', async () => {
    const res = err(503, 'd1-failed', undefined, { detail: 'X' })
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({ ok: false, error: 'd1-failed', detail: 'X' })
    expect(Object.keys(body)).not.toContain('reason')
  })

  it('err sets Content-Type: application/json', async () => {
    const res = err(400, 'bad-input')
    expect(res.headers.get('Content-Type')).toBe('application/json')
  })
})

describe('helpers', () => {
  it('unauthorized() → 401 unauthenticated', async () => {
    const res = unauthorized('no session')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('unauthenticated')
    expect(body.reason).toBe('no session')
  })

  it('forbidden(error, reason) → 403 with given error code', async () => {
    const res = forbidden('not-owner', 'role must be owner')
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('not-owner')
    expect(body.reason).toBe('role must be owner')
  })

  it('badRequest(reason) → 400 bad-input', async () => {
    const res = badRequest('uid required')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('bad-input')
    expect(body.reason).toBe('uid required')
  })

  it('conflict(reason) → 409 already-registered', async () => {
    const res = conflict('keyHash exists')
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('already-registered')
    expect(body.reason).toBe('keyHash exists')
  })

  it('notFound(reason) → 404 not-found', async () => {
    const res = notFound('credId not found')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('not-found')
    expect(body.reason).toBe('credId not found')
  })

  it('serviceUnavailable(error, reason) → 503 with error code', async () => {
    const res = serviceUnavailable('d1-unavailable', 'D1 not configured')
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('d1-unavailable')
    expect(body.reason).toBe('D1 not configured')
  })
})
