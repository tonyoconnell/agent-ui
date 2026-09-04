import { cn } from '@/lib/utils'

export interface LayerState {
  groups: boolean
  people: boolean
  things: boolean
  paths: boolean
  events: boolean
  insight: boolean
}

interface Props {
  value: LayerState
  onChange: (layer: keyof LayerState, visible: boolean) => void
  colors: Record<keyof LayerState, string>
}

const LAYER_ORDER: (keyof LayerState)[] = ['groups', 'people', 'things', 'paths', 'events', 'insight']

const SUBTITLES: Record<keyof LayerState, string> = {
  groups: 'worlds, teams',
  people: 'humans, agents',
  things: 'skills, tasks',
  paths: 'connections',
  events: 'what happened',
  insight: 'what was learned',
}

export function LayerToggle({ value, onChange, colors }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Layers</div>
      {LAYER_ORDER.map((layer) => {
        const active = value[layer]
        return (
          <button
            key={layer}
            type="button"
            onClick={() => onChange(layer, !active)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition',
              active
                ? 'border-border bg-card text-foreground'
                : 'border-transparent bg-transparent text-muted-foreground hover:bg-muted/30',
            )}
            aria-pressed={active}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                background: active ? colors[layer] : 'transparent',
                border: `1.5px solid ${colors[layer]}`,
              }}
            />
            <span className="flex-1">
              <div className="font-medium capitalize">{layer}</div>
              <div className="text-[10px] text-muted-foreground">{SUBTITLES[layer]}</div>
            </span>
          </button>
        )
      })}
    </div>
  )
}
