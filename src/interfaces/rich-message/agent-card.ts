import { z } from 'zod'

export const AgentCardSchema = z
  .object({
    type: z.literal('agent-card'),
    uid: z.string(),
    name: z.string(),
    description: z.string().optional(),
    capabilities: z.array(z.string()),
    wallet: z.string().optional(),
    status: z.enum(['active', 'paused', 'retired']),
  })
  .strict()

export type AgentCard = z.infer<typeof AgentCardSchema>
