/**
 * ListingCardComponent — renders a listing-card rich message inside ChatIsland.
 *
 * Activated when chat response has { type: "rich", richType: "listing-card" }.
 * Buy button navigates to /pay/[skillId] (Sui dapp-kit flow).
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import type { ListingCard } from '@/interfaces/rich-message/listing-card'

export interface ListingCardComponentProps {
  payload: ListingCard
  onBuy: (skillId: string) => void
}

export function ListingCardComponent({ payload, onBuy }: ListingCardComponentProps) {
  // priceMist is stored as bigint-as-string; display in SUI (1 SUI = 1e9 MIST)
  const priceSui = payload.priceMist
    ? (BigInt(payload.priceMist) / 1_000_000_000n).toString()
    : null

  const priceLabel = priceSui !== null && priceSui !== '0' ? `${priceSui} SUI` : 'Free'

  return (
    <Card className="border-border bg-card p-4">
      {/* Label */}
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Skill listing
      </div>

      <div className="space-y-2 text-sm">
        {/* Name */}
        <div className="font-semibold text-foreground">{payload.name}</div>

        {/* Description */}
        {payload.description && (
          <p className="text-xs leading-5 text-muted-foreground">{payload.description}</p>
        )}

        {/* Seller */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Seller</span>
          <span className="font-mono text-xs text-foreground">{payload.seller}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price</span>
          <span className="font-semibold text-foreground">{priceLabel}</span>
        </div>

        {/* Tags */}
        {payload.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {payload.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Buy */}
        <Button
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            emitClick('ui:chat:listing-buy', { skillId: payload.skillId })
            onBuy(payload.skillId)
          }}
        >
          Buy
        </Button>
      </div>
    </Card>
  )
}
