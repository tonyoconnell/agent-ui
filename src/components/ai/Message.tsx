export interface MessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export function Message({ role, content, timestamp }: MessageProps) {
  const roleColors = {
    user: 'bg-blue-50 dark:bg-blue-950',
    assistant: 'bg-gray-50 dark:bg-gray-900',
    system: 'bg-yellow-50 dark:bg-yellow-950',
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
