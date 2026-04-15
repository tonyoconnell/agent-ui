import { useState } from 'react'
import { suggestionGroups } from '@/lib/chat/demos'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

interface Props {
  onSelectDemo: (prompt: string) => void
}

export function DemoSuggestions({ onSelectDemo }: Props) {
  const [activeCategory, setActiveCategory] = useState('')

  return (
    <div className="w-full" onMouseLeave={() => setActiveCategory('')}>
      <div className="flex flex-col gap-2">
        {/* Category pills - simple, no icons */}
        <div className="flex gap-2 justify-center flex-wrap">
          {suggestionGroups.map((group) => (
            <button
              key={group.label}
              onMouseEnter={() => setActiveCategory(group.label)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium capitalize cursor-pointer transition-all duration-200',
                activeCategory === group.label ? 'bg-accent scale-105' : 'bg-muted hover:bg-accent/50',
              )}
            >
              {group.label}
            </button>
          ))}
        </div>

        {/* Prompts - show only for active category */}
        <div className="relative min-h-[200px]">
          {activeCategory &&
            (() => {
              const activeCategoryData = suggestionGroups.find((group) => group.label === activeCategory)

              return activeCategoryData ? (
                <div className="flex flex-col gap-1 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  {activeCategoryData.items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        emitClick('ui:demo:select')
                        onSelectDemo(item)
                        setActiveCategory('')
                      }}
                      className="w-full text-left text-sm p-3 rounded-md bg-accent/10 hover:bg-accent/20 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null
            })()}
        </div>
      </div>
    </div>
  )
}
