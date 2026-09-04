/**
 * POST /api/invites/create — Generate a stateless HMAC-SHA256 invite token
 *
 * Body:    { gid: string, role?: string, email?: string }
 * Returns: { token: string, url: string }
 *
 * Accepts both session cookies (humans) and Bearer tokens (agents).
 * Agents must have operator/chairman/ceo/owner role in the target group.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { sendEmail } from '@/lib/notify/email'
import { readParsed } from '@/lib/typedb'

export const prerender = false

function esc(s: string) { return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') }

const INVITE_ROLES_WITH_INVITE_PERMISSION = new Set(['owner', 'chairman', 'ceo', 'operator'])

export const POST: APIRoute = async ({ request }) => {
  const auth = await resolveUnitFromSession(request).catch(() => null)
  if (!auth?.isValid || !auth.user) return new Response('Unauthorized', { status: 401 })

  let body: { gid?: string; role?: string; email?: string }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { gid, role = 'member', email } = body
  if (!gid || typeof gid !== 'string') return Response.json({ error: 'gid is required' }, { status: 400 })

  // Check sender has invite_member permission in this group
  const memberRows = await readParsed(`
    match $u isa actor, has aid "${esc(auth.user)}";
          $g isa group, has gid "${esc(gid)}";
          $m (member: $u, group: $g) isa membership, has member-role $r;
    select $r;
  `).catch(() => [])

  // Owner role bypasses group membership check
  const senderRole = memberRows[0]?.r as string | undefined
  const isOwner = auth.role === 'owner'
  if (!isOwner && (!senderRole || !INVITE_ROLES_WITH_INVITE_PERMISSION.has(senderRole))) {
    return Response.json({ error: 'Insufficient permissions to invite members to this group' }, { status: 403 })
  }

  const secret = import.meta.env.INVITE_SECRET || 'dev-secret'
  const payloadBase64 = btoa(JSON.stringify({
    gid, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000, nonce: crypto.randomUUID(),
  }))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadBase64))
  const token = `${payloadBase64}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`
  const url = `/join?token=${token}`

  if (email && typeof email === 'string') {
    const groupLabel = gid.replace(/^group:/, '')
    sendEmail({
      to: email,
      subject: `You've been invited to join ${groupLabel} on ONE`,
      html: `<p>You have been invited to join <strong>${groupLabel}</strong>.</p><p><a href="https://one.ie${url}">Accept invitation</a></p><p>This link expires in 7 days.</p>`,
      text: `You've been invited to join ${groupLabel} on ONE. Accept here: https://one.ie${url} (expires in 7 days)`,
    }).catch(() => { /* non-fatal */ })
  }

  return Response.json({ token, url })
}
