/**
 * Sync Personas to TypeDB
 *
 * Write each static persona from personas.ts to TypeDB as a proper unit
 * with ADL attributes. Runs once on worker boot via match-not-exists pattern.
 *
 * This makes nanoclaw personas discoverable in /.well-known/agents.json
 * and enables ADL security gates on persona interactions.
 */

import personas from '../personas'
import type { Env } from '../types'
import { query } from './substrate'

export const syncPersonas = async (env: Env): Promise<void> => {
  const now = new Date().toISOString().replace('Z', '')

  for (const [key, persona] of Object.entries(personas)) {
    const uid = `nanoclaw:${key}`
    const adlUid = `https://one.ie/agents/nanoclaw/${key}`

    // Match-not-exists pattern: only insert if uid doesn't already exist
    const existsCheck = await query(
      env,
      `
        match $u isa unit, has uid "${uid}";
        select $u;
      `,
    )

    if (existsCheck.length > 0) {
      // Persona already in TypeDB, skip
      continue
    }

    // Insert persona as unit with ADL attributes
    const insertTql = `
      insert $u isa unit,
        has uid "${uid}",
        has name "${persona.name}",
        has unit-kind "agent",
        has model "${persona.model}",
        has system-prompt "${persona.systemPrompt.slice(0, 10000).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
        has status "active",
        has success-rate 0.5,
        has activity-score 0.0,
        has sample-count 0,
        has reputation 0.0,
        has balance 0.0,
        has generation 0,
        has created "${now}",
        has adl-version "0.2.0",
        has adl-uid "${adlUid}",
        has adl-status "active",
        has data-sensitivity "internal";
    `

    try {
      await query(env, insertTql, true)
    } catch (e) {
      // Silent fail — persona sync is non-critical, doesn't block worker startup
      console.warn(`Failed to sync persona ${key}:`, e instanceof Error ? e.message : e)
    }
  }
}
