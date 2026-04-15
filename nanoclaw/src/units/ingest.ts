/**
 * chat:ingest — resolve stable actor uid + classify incoming message.
 *
 * Returns: { uid, group, tags }
 * - uid: stable actor uid from identity_links or "${channel}:${sender}" default
 * - group: conversation group id ("conv:${uid}:${bot}")
 * - tags: keyword-classified topic tags (fallback, no LLM call)
 */

import { classify } from '../lib/classify-fallback'
import { resolveActor } from '../lib/identity'
import type { Env } from '../types'

export interface IngestResult {
  uid: string
  group: string
  tags: string[]
}

export async function ingest(
  channel: string,
  sender: string,
  text: string,
  bot: string,
  env: Env,
): Promise<IngestResult> {
  const uid = await resolveActor(channel, sender, env)
  const group = `conv:${uid}:${bot}`
  const tags = classify(text)
  return { uid, group, tags }
}
