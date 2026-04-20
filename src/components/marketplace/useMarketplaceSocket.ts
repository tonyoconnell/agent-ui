/**
 * useMarketplaceSocket — Subscribe to substrate WS and filter mark/warn
 * messages for a given set of service provider UIDs.
 *
 * Returns a Map<uid, {strength, resistance}> that updates live so
 * MarketplaceHighways can reflect pheromone deltas without re-fetching.
 */

import { useEffect, useRef, useState } from 'react'

const MAX_RECONNECT_ATTEMPTS = 3

interface PheromoneDeltas {
  strength: number
  resistance: number
}

export function useMarketplaceSocket(serviceUids: string[]): Map<string, PheromoneDeltas> {
  const [deltas, setDeltas] = useState<Map<string, PheromoneDeltas>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uidsRef = useRef(serviceUids)

  // Keep uidsRef current without resetting the effect
  uidsRef.current = serviceUids

  useEffect(() => {
    let cancelled = false

    const connect = (attempt: number) => {
      if (cancelled) return
      if (attempt > MAX_RECONNECT_ATTEMPTS) return

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (e) => {
          if (e.data === 'pong') return
          try {
            const msg = JSON.parse(e.data as string) as {
              type: string
              task_id?: string
              strength?: number
              resistance?: number
            }
            if (msg.type !== 'mark' && msg.type !== 'warn') return
            if (!msg.task_id) return

            const matched = uidsRef.current.find((uid) => msg.task_id!.includes(uid))
            if (!matched) return

            setDeltas((prev) => {
              const next = new Map(prev)
              const current = next.get(matched) ?? { strength: 0, resistance: 0 }
              next.set(matched, {
                strength: msg.type === 'mark' ? (msg.strength ?? current.strength) : current.strength,
                resistance: msg.type === 'warn' ? (msg.resistance ?? current.resistance) : current.resistance,
              })
              return next
            })
          } catch {
            // ignore malformed messages
          }
        }

        ws.onclose = () => {
          if (cancelled) return
          reconnectRef.current = setTimeout(() => connect(attempt + 1), 2_000)
        }

        ws.onerror = () => {
          // onclose fires after onerror — reconnect handled there
        }
      } catch {
        if (!cancelled) {
          reconnectRef.current = setTimeout(() => connect(attempt + 1), 2_000)
        }
      }
    }

    connect(0)

    return () => {
      cancelled = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [])

  return deltas
}
