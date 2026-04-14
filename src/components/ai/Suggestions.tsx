import { CornerDownRight, Menu } from 'lucide-react'

export interface SuggestionsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

export function Suggestions({ suggestions, onSuggestionClick }: SuggestionsProps) {
  return (
    <div className="w-full bg-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <Menu className="h-5 w-5 text-white/80" />
        <h3 className="text-lg font-normal text-white">Suggested questions</h3>
      </div>

      {/* Suggestion List */}
      <div className="flex flex-col">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex items-start gap-3 px-4 py-4 text-left text-white hover:bg-white/5 transition-colors duration-150 border-b border-white/5 last:border-b-0"
          >
            <CornerDownRight className="h-5 w-5 text-white/60 flex-shrink-0 mt-0.5" />
            <span className="text-base leading-relaxed">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
