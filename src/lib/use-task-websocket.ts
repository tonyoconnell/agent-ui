/**
 * useTaskWebSocket — Live pheromone + task status updates via WebSocket.
 *
 * Features:
 * - Exponential backoff reconnection (1s → 30s max)
 * - Heartbeat ping/pong with 45s timeout detection
 * - Graceful degradation to 5s polling after 3 failed reconnects
 * - Origin-aware: dev uses localhost, prod uses api.one.ie
 *
 * Uses the typed WsMessage discriminated union for exhaustive message handling.
 * Each message type updates exactly the fields it carries — no cross-type field
 * bleed (mark only touches trailPheromone, warn only touches alarmPheromone).
 */

import { useEffect, useRef, useState } from 'react'
import type { WsMessage } from '@/lib/ws-server'

const GATEWAY_URL = (import.meta.env.PUBLIC_GATEWAY_URL as string | undefined) ?? ''

// Stability constants
const MAX_RECONNECT_ATTEMPTS = 3
const HEARTBEAT_INTERVAL = 30_000 // 30s
const HEARTBEAT_TIMEOUT = 45_000 // 45s (allow 15s jitter)
const POLL_INTERVAL = 5_000 // 5s fallback polling

// Minimal shape the hook requires. TaskBoard's Task satisfies this.
interface TaskLike {
  tid: string
  trailPheromone: number
  alarmPheromone: number
  status: string
}

export interface UseTaskWebSocketState {
  connected: boolean
  polling: boolean
  reconnectAttempt: number
}

export function useTaskWebSocket<T extends TaskLike>(
  setTasks: (fn: (prev: T[]) => T[]) => void,
): UseTaskWebSocketState {
  const wsRef = useRef<WebSocket | null>(null)
  const lastPongRef = useRef<number>(Date.now())
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [connected, setConnected] = useState(false)
  const [polling, setPolling] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const handleMessage = (msg: WsMessage) => {
      switch (msg.type) {
        case 'mark':
          setTasks((prev) => prev.map((t) => (t.tid === msg.taskId ? { ...t, trailPheromone: msg.strength } : t)))
          break
        case 'warn':
          setTasks((prev) => prev.map((t) => (t.tid === msg.taskId ? { ...t, alarmPheromone: msg.resistance } : t)))
          break
        case 'complete':
          setTasks((prev) => prev.map((t) => (t.tid === msg.taskId ? { ...t, status: 'complete' as const } : t)))
          break
        case 'unblock':
          setTasks((prev) => prev.map((t) => (t.tid === msg.taskId ? { ...t, status: 'todo' as const } : t)))
          break
        case 'sync':
          // Full sync — replace pheromone values for matching tasks
          if (msg.tasks) {
            const taskMap = new Map(msg.tasks.map((t) => [t.tid, t]))
            setTasks((prev) =>
              prev.map((t) => {
                const update = taskMap.get(t.tid)
                return update ? { ...t, trailPheromone: update.strength, alarmPheromone: update.resistance } : t
              }),
            )
          }
          break
        case 'task-update':
          if (msg.task) {
            setTasks((prev) =>
              prev.map((t) => (t.tid === msg.task.tid ? { ...t, status: msg.task.status as T['status'] } : t)),
            )
          }
          break
        case 'pong':
        case 'ping':
          // Keepalive only
          break
      }
    }

    const connect = (reconnectAttempt = 0) => {
      // Graceful degradation: fall back to polling after max attempts
      if (reconnectAttempt > MAX_RECONNECT_ATTEMPTS) {
        console.warn('WebSocket failed, falling back to polling')
        setPolling(true)
        return
      }

      setAttempt(reconnectAttempt)

      // Production: wss://api.one.ie/ws — live substrate pheromone
      // Dev: same-origin ws://localhost:4321/api/ws — dev-ws-server
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

          // Start heartbeat with timeout detection
          heartbeatRef.current = setInterval(() => {
            // Check for stale connection (no pong in 45s)
            if (Date.now() - lastPongRef.current > HEARTBEAT_TIMEOUT) {
              console.warn('Heartbeat timeout, reconnecting')
              ws.close()
              return
            }
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping')
            }
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
            // Ignore malformed messages
          }
        }

        ws.onclose = () => {
          setConnected(false)
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
            heartbeatRef.current = null
          }

          // Exponential backoff reconnect: 1s, 2s, 4s, 8s... max 30s
          const delay = Math.min(1000 * 2 ** reconnectAttempt, 30_000)
          console.log(`WebSocket closed, reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`)
          reconnectTimerRef.current = setTimeout(() => connect(reconnectAttempt + 1), delay)
        }

        ws.onerror = () => {
          // onclose fires after onerror, so reconnect is handled there
        }
      } catch (e) {
        // WebSocket constructor can throw in some environments
        console.warn('WebSocket connection failed:', e)
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 30_000)
        reconnectTimerRef.current = setTimeout(() => connect(reconnectAttempt + 1), delay)
      }
    }

    // Start connection
    connect(0)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [setTasks])

  // Polling fallback
  useEffect(() => {
    if (!polling) return

    const tasksUrl = GATEWAY_URL ? `${GATEWAY_URL}/tasks` : '/api/tasks'

    type TaskRow = { tid?: string; id?: string; strength?: number; resistance?: number }

    const poll = async () => {
      try {
        const res = await fetch(tasksUrl)
        if (!res.ok) return
        const data = (await res.json()) as TaskRow[] | { tasks?: TaskRow[] }
        const tasks: TaskRow[] = Array.isArray(data) ? data : (data.tasks ?? [])
        if (tasks.length === 0) return
        // API may return `id` or `tid` — normalize to match component's `tid`
        const taskMap = new Map<string, TaskRow>(tasks.map((t) => [(t.tid || t.id) as string, t]))
        setTasks((prev) =>
          prev.map((t) => {
            const update = taskMap.get(t.tid)
            return update
              ? {
                  ...t,
                  trailPheromone: update.strength ?? t.trailPheromone,
                  alarmPheromone: update.resistance ?? t.alarmPheromone,
                }
              : t
          }),
        )
      } catch {
        // Ignore poll errors
      }
    }

    poll() // immediate first poll
    pollRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [polling, setTasks])

  return { connected, polling, reconnectAttempt: attempt }
}
