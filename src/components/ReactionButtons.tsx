import { Button } from '@/components/ui/button'

interface Props {
  reactions: string[]
  askId: string
  onReply: (choice: string) => Promise<void>
}

export function ReactionButtons({ reactions, askId, onReply }: Props) {
  return (
    <div className="flex gap-2 mt-2">
      {reactions.map((r) => (
        <Button key={r} variant="outline" size="sm" onClick={() => onReply(r)} className="text-xs">
          {r}
        </Button>
      ))}
    </div>
  )
}
