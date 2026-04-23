import { z } from 'zod'

export const ListingCardSchema = z
  .object({
    type: z.literal('listing-card'),
    skillId: z.string(),
    name: z.string(),
    priceMist: z.string(), // bigint as string
    tags: z.array(z.string()),
    seller: z.string(),
    description: z.string().optional(),
  })
  .strict()

export type ListingCard = z.infer<typeof ListingCardSchema>
