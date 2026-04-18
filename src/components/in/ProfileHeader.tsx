import { ChevronDown } from 'lucide-react'
import { emitClick } from '@/lib/ui-signal'

interface ProfileHeaderProps {
  name: string
  initial: string
}

export function ProfileHeader({ name, initial }: ProfileHeaderProps) {
  return (
    <div className="flex h-16 items-center border-b border-border bg-card px-4">
      <button
        type="button"
        onClick={() => emitClick('ui:in:profile')}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 -mx-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
          {initial}
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-foreground">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </button>
    </div>
  )
}
