import { z } from 'zod'

export const HandoffCardSchema = z
  .object({
    type: z.literal('handoff-card'),
    fromAgent: z.string(),
    toAgent: z.string(),
    context: z.string().optional(),
    scopeChange: z.boolean().default(false),
  })
  .strict()

export type HandoffCard = z.infer<typeof HandoffCardSchema>
