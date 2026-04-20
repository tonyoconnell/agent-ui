/**
 * useMarketplaceSocket — Live pheromone updates for marketplace listings.
 *
 * Reuses the WsHub DO WebSocket pattern from use-task-websocket, filtered
 * to messages tagged "marketplace". Strength bars update live on mark/warn.
 *
 * Features:
 * - Exp backoff reconnect (1s → 30s), 45s heartbeat, 5s polling fallback
 * - useDeferredValue-friendly: updates arrive as individual calls to setListings
 */

import { useEffect, useRef, useState } from 'react'
import type { WsMessage } from '@/lib/ws-server'

const GATEWAY_URL = (import.meta.env.PUBLIC_GATEWAY_URL as string | undefined) ?? ''

const MAX_RECONNECT_ATTEMPTS = 3
const HEARTBEAT_INTERVAL = 30_000
const HEARTBEAT_TIMEOUT = 45_000
const POLL_INTERVAL = 5_000

export interface MarketplaceListing {
  skillId: string
  strength: number
  resistance: number
}

export interface UseMarketplaceSocketState {
  connected: boolean
  polling: boolean
}

export function useMarketplaceSocket(
  setListings: (fn: (prev: MarketplaceListing[]) => MarketplaceListing[]) => void,
): UseMarketplaceSocketState {
  const wsRef = useRef<WebSocket | null>(null)
  const lastPongRef = useRef<number>(Date.now())
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [connected, setConnected] = useState(false)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    const handleMessage = (msg: WsMessage) => {
      // Only process messages tagged marketplace (tag carried in tid by convention)
      if (msg.type !== 'mark' && msg.type !== 'warn') return
      if (!msg.tid?.startsWith('marketplace:')) return

      const skillId = msg.tid.replace('marketplace:', '')

      if (msg.type === 'mark') {
        setListings((prev) => prev.map((l) => (l.skillId === skillId ? { ...l, strength: msg.strength } : l)))
      } else {
        setListings((prev) => prev.map((l) => (l.skillId === skillId ? { ...l, resistance: msg.resistance } : l)))
      }
    }

    const connect = (attempt = 0) => {
      if (attempt > MAX_RECONNECT_ATTEMPTS) {
        setPolling(true)
        return
      }

      const wsUrl = GATEWAY_URL
        ? `${GATEWAY_URL.replace(/^http/, 'ws')}/ws`
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          lastPongRef.current = Date.now()
          heartbeatRef.current = setInterval(() => {
            if (Date.now() - lastPongRef.current > HEARTBEAT_TIMEOUT) {
              ws.close()
              return
            }
            if (ws.readyState === WebSocket.OPEN) ws.send('ping')
          }, HEARTBEAT_INTERVAL)
        }

        ws.onmessage = (e) => {
          if (e.data === 'pong') {
            lastPongRef.current = Date.now()
            return
          }
          try {
            const msg = JSON.parse(e.data as string) as WsMessage
            handleMessage(msg)
          } catch {
            // ignore malformed
          }
        }

        ws.onclose = () => {
          setConnected(false)
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
            heartbeatRef.current = null
          }
          const delay = Math.min(1000 * 2 ** attempt, 30_000)
          reconnectTimerRef.current = setTimeout(() => connect(attempt + 1), delay)
        }

        ws.onerror = () => {}
      } catch {
        const delay = Math.min(1000 * 2 ** attempt, 30_000)
        reconnectTimerRef.current = setTimeout(() => connect(attempt + 1), delay)
      }
    }

    connect(0)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [setListings])

  // Polling fallback — re-fetch /api/market/list to refresh strength/resistance
  useEffect(() => {
    if (!polling) return

    const poll = async () => {
      try {
        const res = await fetch('/api/market/list')
        if (!res.ok) return
        const data = (await res.json()) as { capabilities?: MarketplaceListing[] }
        const caps = data.capabilities ?? []
        if (caps.length === 0) return
        setListings((prev) =>
          prev.map((l) => {
            const updated = caps.find((c) => c.skillId === l.skillId)
            return updated ? { ...l, strength: updated.strength, resistance: updated.resistance } : l
          }),
        )
      } catch {
        // ignore poll errors
      }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [polling, setListings])

  return { connected, polling }
}
