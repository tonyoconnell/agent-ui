import { z } from 'zod'

export const PreSignCardSchema = z
  .object({
    type: z.literal('pre-sign-card'),
    txSummary: z.string(), // human-readable tx description
    recipient: z.string(),
    amountMist: z.string(),
    resolvedName: z.string().optional(), // SuiNS or /u/people
    expiresAt: z.number(), // epoch ms
  })
  .strict()

export type PreSignCard = z.infer<typeof PreSignCardSchema>
