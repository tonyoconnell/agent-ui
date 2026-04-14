/**
 * Chatbot - Main chat container component
 * Provides full chat interface with messages, input, and suggestions
 */

import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageList } from './MessageList'
import { PromptInput } from './PromptInput'
import { Suggestions } from './Suggestions'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: any
}

export interface ChatbotProps {
  messages: Message[]
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSubmit: (value: string) => void
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  placeholder?: string
  className?: string
}

export function Chatbot({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  suggestions,
  onSuggestionClick,
  placeholder = 'Ask me anything...',
  className = '',
}: ChatbotProps) {
  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <MessageList messages={messages} isLoading={isLoading} />
        </ScrollArea>
      </div>

      {/* Suggestions (show when no messages) */}
      {messages.length === 0 && suggestions && suggestions.length > 0 && (
        <div className="border-t p-4">
          <Suggestions suggestions={suggestions} onSuggestionClick={onSuggestionClick || onSubmit} />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <PromptInput
          value={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          placeholder={placeholder}
        />
      </div>
    </Card>
  )
}
