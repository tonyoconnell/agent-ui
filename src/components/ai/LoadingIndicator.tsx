export interface LoadingIndicatorProps {
  message?: string
}

export function LoadingIndicator({ message = 'AI is thinking...' }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}
