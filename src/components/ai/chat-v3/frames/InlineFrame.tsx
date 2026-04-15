import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional fixed height. Defaults to natural content height. */
  height?: string
}

/**
 * InlineFrame — document-flow mount.
 *
 * Renders as a normal block element in the page flow.
 * No fixed/absolute positioning. Reader-mode and article-layout friendly.
 * Use for embedding chat inside documentation or landing pages.
 */
export function InlineFrame({ children, height = 'auto' }: Props) {
  return (
    <div
      className="relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-background"
      style={{ height }}
    >
      {children}
    </div>
  )
}
