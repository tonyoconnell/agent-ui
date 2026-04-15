import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * FullPageFrame — full-page mount. The default ChatShell layout.
 * Children fill the viewport; overflow is hidden at this boundary.
 */
export function FullPageFrame({ children }: Props) {
  return (
    <div className="relative flex size-full flex-col overflow-hidden items-center justify-center bg-background">
      {children}
    </div>
  )
}
