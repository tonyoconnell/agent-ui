/**
 * ErrorBoundary — React error boundary with substrate signal emission.
 *
 * Catches render errors in the subtree, emits an error signal to the substrate
 * (fire-and-forget, never throws), and renders a minimal fallback UI.
 *
 * Usage:
 *   <ErrorBoundary surface="chat">
 *     <ChatIsland />
 *   </ErrorBoundary>
 */

import { Component } from "react"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  surface: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error): void {
    // Emit signal to substrate — fire and forget, never throws
    fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiver: `error:${this.props.surface}`,
        data: {
          tags: ["error", this.props.surface],
          content: error.message,
        },
      }),
    }).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-400 p-4">
          Something went wrong. Refresh to try again.
        </div>
      )
    }
    return this.props.children
  }
}
