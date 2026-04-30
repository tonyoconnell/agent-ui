export interface MessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export function Message({ role, content, timestamp }: MessageProps) {
  const roleColors = {
    user: 'bg-[hsl(var(--color-primary-bright)/0.1)] dark:bg-[hsl(var(--color-primary-bright)/0.08)]',
    assistant: 'bg-muted dark:bg-background',
    system: 'bg-[hsl(var(--color-gold)/0.1)] dark:bg-[hsl(var(--color-gold)/0.08)]',
  }

  const roleLabels = {
    user: 'You',
    assistant: 'Assistant',
    system: 'System',
  }

  return (
    <div className={`rounded-lg p-4 ${roleColors[role]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{roleLabels[role]}</span>
        <span className="text-xs text-muted-foreground">{new Date(timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
