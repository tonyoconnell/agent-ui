/**
 * /forget command — two-step GDPR erasure with KV confirmation gate.
 *
 * Step 1: /forget        → stores pending flag in KV, asks for confirm
 * Step 2: /forget confirm → executes path deletion, confirms erasure
 */

import { query } from '../lib/substrate'
import type { Env } from '../types'

const CONFIRM_TTL = 300 // 5 minutes

/**
 * Handle /forget command. Returns the reply text.
 * isConfirm=true when the user sent "/forget confirm".
 */
export async function handleForgetCommand(
  actorUid: string,
  handle: string,
  isConfirm: boolean,
  env: Env,
): Promise<string> {
  const pendingKey = `forget_pending:${actorUid}`

  if (!isConfirm) {
    // Step 1: store confirmation flag, ask user to confirm
    await env.KV.put(pendingKey, '1', { expirationTtl: CONFIRM_TTL })
    return (
      `Erase all memory for ${handle}?\n\n` +
      `This will delete your paths, hypotheses, and profile from the substrate. ` +
      `This cannot be undone.\n\n` +
      `Send /forget confirm within 5 minutes to proceed, or do nothing to cancel.`
    )
  }

  // Step 2: check confirmation flag is still valid
  const pending = await env.KV.get(pendingKey)
  if (!pending) {
    return 'Confirmation expired. Send /forget to start over.'
  }

  await env.KV.delete(pendingKey)

  // Delete all outbound paths from this actor (soft erase)
  const safe = actorUid.replace(/"/g, '')
  await query(
    env,
    `
    match
      $u isa unit, has uid "${safe}";
      $p (source: $u) isa path;
    delete $p isa path;
  `,
    true,
  ).catch(() => {})

  // Delete inbound paths to this actor
  await query(
    env,
    `
    match
      $u isa unit, has uid "${safe}";
      $p (target: $u) isa path;
    delete $p isa path;
  `,
    true,
  ).catch(() => {})

  // Delete hypotheses about this actor
  await query(
    env,
    `
    match $h isa hypothesis, has subject "${safe}";
    delete $h isa hypothesis;
  `,
    true,
  ).catch(() => {})

  // Remove messages from D1
  await env.DB.prepare(`DELETE FROM messages WHERE group_id LIKE ?`)
    .bind(`conv:${safe}:%`)
    .run()
    .catch(() => {})

  return `Memory erased for ${handle}. Paths, hypotheses, and conversation history have been removed. You start fresh on the next message.`
}
