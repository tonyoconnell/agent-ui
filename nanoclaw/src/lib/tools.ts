/**
 * Substrate Tools — Claude can interact with the ONE substrate
 */

import type { Env } from '../types'
import { highways, mark, query, suggestRoute, warn } from './substrate'

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const tools = [
  {
    name: 'signal',
    description: 'Send a signal to another unit in the substrate',
    input_schema: {
      type: 'object',
      properties: {
        receiver: { type: 'string', description: 'Unit ID or unit:skill' },
        data: { type: 'object', description: 'Signal payload' },
      },
      required: ['receiver'],
    },
  },
  {
    name: 'discover',
    description: 'Find units with a capability, ranked by path strength',
    input_schema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Skill to find' },
      },
      required: ['skill'],
    },
  },
  {
    name: 'remember',
    description: 'Store knowledge in the substrate',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Knowledge key' },
        value: { type: 'string', description: 'Knowledge value' },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'recall',
    description: 'Retrieve knowledge from the substrate',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to recall' },
      },
      required: ['query'],
    },
  },
  {
    name: 'highways',
    description: 'Get the proven paths in the substrate',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max paths to return', default: 5 },
      },
    },
  },
  {
    name: 'mark',
    description: 'Strengthen a path (call after successful collaboration)',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Unit that helped' },
        strength: { type: 'number', description: 'How much to strengthen', default: 1 },
      },
      required: ['target'],
    },
  },
  {
    name: 'warn',
    description: 'Add resistance to a path (call after failed collaboration)',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Unit that failed' },
        strength: { type: 'number', description: 'How much resistance', default: 1 },
      },
      required: ['target'],
    },
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

export const executeTool = async (
  env: Env,
  group: string,
  tool: string,
  input: Record<string, unknown>,
): Promise<unknown> => {
  const selfId = `nanoclaw:${group}`

  switch (tool) {
    case 'signal':
      // Queue signal for processing
      await env.AGENT_QUEUE.send({
        type: 'substrate',
        sender: selfId,
        receiver: input.receiver as string,
        data: input.data,
      })
      return { sent: true, receiver: input.receiver }

    case 'discover': {
      const units = await suggestRoute(env, selfId, input.skill as string)
      return { skill: input.skill, units }
    }

    case 'remember': {
      const key = input.key as string
      const value = input.value as string
      await env.KV.put(`knowledge:${group}:${key}`, value)
      return { stored: key }
    }

    case 'recall': {
      const q = input.query as string
      // Check local KV first
      const local = await env.KV.get(`knowledge:${group}:${q}`)
      if (local) return { key: q, value: local, source: 'local' }

      // Query TypeDB for hypotheses
      const rows = await query(
        env,
        `
        match $h isa hypothesis, has statement $s;
        $s contains "${q}";
        select $s; limit 5;
      `,
      )
      return { query: q, results: rows, source: 'substrate' }
    }

    case 'highways': {
      const limit = (input.limit as number) || 5
      const paths = await highways(env, limit)
      return { highways: paths }
    }

    case 'mark':
      await mark(env, selfId, input.target as string, (input.strength as number) || 1)
      return { marked: input.target }

    case 'warn':
      await warn(env, selfId, input.target as string, (input.strength as number) || 1)
      return { warned: input.target }

    default:
      return { error: `Unknown tool: ${tool}` }
  }
}
