/**
 * useChairmanStream — Live `unit-hired` subscription via WsHub.
 *
 * Mirrors the reconnect state machine from use-task-websocket.ts:
 *   - Exponential backoff (1s → 30s max, 3 attempts)
 *   - 30s heartbeat / 45s pong timeout
 *   - Falls back to silent no-op after MAX_RECONNECT_ATTEMPTS (chairman UI
 *     has no polling fallback — it's event-native or it's stale).
 *
 * State:
 *   - units: every 'unit-hired' frame received, accumulated
 *   - pending: roles the user requested to hire but which haven't landed yet
 *     (painted as ghost nodes by OrgChart)
 *   - addPending(roles): seed pending synchronously on Build Team click
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WsMessage, WsUnitHired } from '@/types/task'

const GATEWAY_URL = (import.meta.env.PUBLIC_GATEWAY_URL as string | undefined) ?? ''

const MAX_RECONNECT_ATTEMPTS = 3
const HEARTBEAT_INTERVAL = 30_000
const HEARTBEAT_TIMEOUT = 45_000

export interface HiredUnitEvent {
  uid: string
  name: string
  role: string
  wallet: string | null
  skills: string[]
}

export interface UseChairmanStreamState {
  connected: boolean
  reconnectAttempt: number
  units: HiredUnitEvent[]
  pending: string[]
  addPending: (roles: string[]) => void
}

export function useChairmanStream(): UseChairmanStreamState {
  const wsRef = useRef<WebSocket | null>(null)
  const lastPongRef = useRef<number>(Date.now())
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [connected, setConnected] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [units, setUnits] = useState<HiredUnitEvent[]>([])
  const [pending, setPending] = useState<string[]>([])

  const addPending = useCallback((roles: string[]) => {
    setPending((prev) => Array.from(new Set([...prev, ...roles])))
  }, [])

  useEffect(() => {
    const handleMessage = (msg: WsMessage) => {
      if (msg.type !== 'unit-hired') return
      const hired = msg as WsUnitHired
      const event: HiredUnitEvent = {
        uid: hired.uid,
        name: hired.uid,
        role: hired.role,
        wallet: hired.wallet,
        skills: hired.skills,
      }
      setUnits((prev) => (prev.some((u) => u.uid === event.uid) ? prev : [...prev, event]))
      setPending((prev) => prev.filter((r) => r !== hired.role))
    }

    const connect = (reconnectAttempt = 0) => {
      if (reconnectAttempt > MAX_RECONNECT_ATTEMPTS) return
      setAttempt(reconnectAttempt)

      const wsUrl = GATEWAY_URL
        ? `${GATEWAY_URL.replace(/^http/, 'ws')}/ws`
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          setAttempt(0)
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
          const delay = Math.min(1000 * 2 ** reconnectAttempt, 30_000)
          reconnectTimerRef.current = setTimeout(() => connect(reconnectAttempt + 1), delay)
        }

        ws.onerror = () => {
          // onclose handles reconnect
        }
      } catch {
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 30_000)
        reconnectTimerRef.current = setTimeout(() => connect(reconnectAttempt + 1), delay)
      }
    }

    connect(0)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [])

  return { connected, reconnectAttempt: attempt, units, pending, addPending }
}
