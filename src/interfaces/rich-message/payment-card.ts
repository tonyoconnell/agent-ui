import { z } from "zod"

export const PaymentCardSchema = z.object({
  type: z.literal("payment-card"),
  receiver: z.string(),
  amountMist: z.string(),     // bigint as string
  currency: z.literal("SUI"),
  description: z.string().optional(),
  action: z.enum(["pay", "claim", "refund"]),
  status: z.enum(["pending", "complete", "expired"]),
}).strict()

export type PaymentCard = z.infer<typeof PaymentCardSchema>
