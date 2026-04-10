/**
 * STREAM SIGNALS — Real-time signal subscription client
 *
 * Connects to /api/stream (Server-Sent Events) or falls back to polling /api/signals
 * Emits signal events to subscribed handlers
 *
 * Usage:
 *   const stream = useSignalStream()
 *   const unsubscribe = stream.subscribe(signal => {
 *     // dispatch to ticker, particles, pulses, breathing
 *   })
 *   return () => unsubscribe()
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { EventEmitter } from 'events'
import { EventEmitter as EE } from 'events'

export interface Signal {
  id: string
  from: string
  fromName: string
  to: string
  toName: string
  skill: string
  outcome: 'success' | 'timeout' | 'dissolved' | 'failure'
  revenue: number
  ts: number
}

interface SignalStreamState {
  signals: Signal[]
  isConnected: boolean
  isFallback: boolean
  lastError?: string
}

const createEmitter = (): EventEmitter => {
  const emitter = new EE()
  emitter.setMaxListeners(100)
  return emitter
}

// Module-level singleton for signal stream
let globalEmitter: EventEmitter | null = null
let globalState: SignalStreamState | null = null
let eventSource: EventSource | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null
let lastSignalTs: number = 0
let reconnectAttempts = 0
const maxReconnectAttempts = 5
const reconnectDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000)

// Clean up global state
const cleanup = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Start SSE connection with fallback to polling
const startStream = async () => {
  if (!globalEmitter) {
    globalEmitter = createEmitter()
  }

  if (!globalState) {
    globalState = {
      signals: [],
      isConnected: false,
      isFallback: false,
    }
  }

  // Try SSE first
  try {
    if (eventSource) {
      eventSource.close()
    }

    eventSource = new EventSource('/api/stream')
    reconnectAttempts = 0

    eventSource.addEventListener('connected', () => {
      globalState!.isConnected = true
      globalState!.isFallback = false
      globalState!.lastError = undefined
      globalEmitter!.emit('connected')
    })

    eventSource.addEventListener('state', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.highways) {
          // Convert highways to signal-like events for visualization
          data.highways.forEach((h: any) => {
            const signal: Signal = {
              id: `${h.from}→${h.to}-${data.ts}`,
              from: h.from,
              fromName: h.from,
              to: h.to,
              toName: h.to,
              skill: 'flow',
              outcome: h.strength >= 50 ? 'success' : 'timeout',
              revenue: h.revenue || 0,
              ts: data.ts,
            }
            globalEmitter!.emit('signal', signal)
          })
        }
      } catch (err) {
        console.error('Failed to parse stream state:', err)
      }
    })

    eventSource.addEventListener('error', () => {
      eventSource?.close()
      eventSource = null
      globalState!.isConnected = false
      fallbackToPolling()
    })

    eventSource.addEventListener('close', () => {
      cleanup()
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++
        setTimeout(startStream, reconnectDelay(reconnectAttempts))
      }
    })
  } catch (err) {
    console.warn('SSE failed, falling back to polling:', err)
    fallbackToPolling()
  }
}

// Polling fallback
const fallbackToPolling = () => {
  if (!globalState) {
    globalState = {
      signals: [],
      isConnected: false,
      isFallback: true,
    }
  }

  if (!globalEmitter) {
    globalEmitter = createEmitter()
  }

  globalState.isFallback = true
  globalEmitter.emit('connected')

  // Clean up any existing event source
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }

  // Poll every 2 seconds
  pollInterval = setInterval(async () => {
    try {
      const since = lastSignalTs || Date.now() - 60000 // Last 60s if first time
      const res = await fetch(`/api/signals?limit=50&since=${since}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.signals && Array.isArray(data.signals)) {
        data.signals.forEach((s: any) => {
          const signal: Signal = {
            id: `${s.sender.uid}→${s.receiver.uid}-${s.ts}`,
            from: s.sender.uid,
            fromName: s.sender.name,
            to: s.receiver.uid,
            toName: s.receiver.name,
            skill: s.data || 'signal',
            outcome: s.success ? 'success' : 'failure',
            revenue: s.amount || 0,
            ts: parseInt(s.ts as string, 10),
          }
          lastSignalTs = Math.max(lastSignalTs, signal.ts)
          globalEmitter!.emit('signal', signal)
        })
      }
    } catch (err) {
      globalState!.lastError = err instanceof Error ? err.message : 'Unknown error'
      console.error('Polling error:', err)
    }
  }, 2000)
}

/**
 * Hook: useSignalStream()
 * Returns signal stream with subscribe/unsubscribe
 */
export function useSignalStream() {
  const [connected, setConnected] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const emitterRef = useRef<EventEmitter | null>(null)

  // Initialize stream on mount
  useEffect(() => {
    // Start stream if not already started
    if (!globalEmitter) {
      startStream()
    }

    emitterRef.current = globalEmitter

    // Listen for connection state changes
    const onConnected = () => {
      setConnected(true)
      setIsFallback(globalState?.isFallback || false)
    }

    const onError = () => {
      setConnected(false)
    }

    globalEmitter?.on('connected', onConnected)
    globalEmitter?.on('error', onError)

    return () => {
      globalEmitter?.off('connected', onConnected)
      globalEmitter?.off('error', onError)
    }
  }, [])

  const subscribe = useCallback(
    (handler: (signal: Signal) => void) => {
      if (!emitterRef.current) {
        emitterRef.current = globalEmitter || createEmitter()
      }
      emitterRef.current.on('signal', handler)
      return () => {
        emitterRef.current?.off('signal', handler)
      }
    },
    []
  )

  return {
    signals: globalState?.signals || [],
    isConnected: connected || globalState?.isConnected || false,
    isFallback,
    subscribe,
    lastError: globalState?.lastError,
  }
}

// Export for cleanup (if needed)
export const closeSignalStream = () => {
  cleanup()
  if (globalEmitter) {
    globalEmitter.removeAllListeners()
  }
  globalEmitter = null
  globalState = null
  reconnectAttempts = 0
}
