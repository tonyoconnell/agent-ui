export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: unknown
}

export interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-4 ${
            message.role === 'user'
              ? 'bg-[hsl(var(--color-primary-bright)/0.15)] dark:bg-[hsl(var(--color-primary-bright)/0.15)] ml-auto max-w-[80%]'
              : 'bg-card dark:bg-card mr-auto max-w-[80%]'
          }`}
        >
          <div className="text-sm font-medium mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
      {isLoading && (
        <div className="rounded-lg p-4 bg-card dark:bg-card mr-auto max-w-[80%]">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
