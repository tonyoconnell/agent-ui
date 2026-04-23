/**
 * ChatIslandWithBoundary — ChatIsland wrapped in an error boundary.
 *
 * This thin wrapper is the Astro island entry point for /chat.
 * The ErrorBoundary catches render errors, emits a substrate signal,
 * and shows a minimal fallback so the page never goes blank.
 */

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ChatIsland } from './ChatIsland'

export function ChatIslandWithBoundary() {
  return (
    <ErrorBoundary surface="chat">
      <ChatIsland />
    </ErrorBoundary>
  )
}
