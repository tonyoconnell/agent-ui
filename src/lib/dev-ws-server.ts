/**
 * Development WebSocket server — attaches to Astro dev server
 * Production: Cloudflare Workers WebSocketPair
 * Development: Node.js ws library
 */

import type { Server } from 'node:http'
import { type WebSocket, WebSocketServer } from 'ws'
import { getTasksCache, updateTasksCache } from './ws-cache'
import { registerDevBroadcaster } from './ws-server'

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()

// Re-export so existing imports of `@/lib/dev-ws-server` keep working.
export { updateTasksCache }

/**
 * Attach WebSocket server to HTTP server (development only)
 * Called from astro.config.mjs astro:server:setup hook
 */
export function attachWebSocketServer(httpServer: Server) {
  if (wss) return

  // Register this module's broadcast function with wsManager
  registerDevBroadcaster(broadcastToDevClients)

  // WebSocketServer with noServer=true to manually handle upgrades
  // This prevents interference with Vite's HMR WebSocket
  wss = new WebSocketServer({ noServer: true })

  // Handle WebSocket upgrades manually.
  // IMPORTANT: only claim '/api/ws'. Ignore everything else so Vite's HMR
  // upgrade listener (same 'upgrade' event) can handle its own socket.
  // Calling socket.destroy() here would kill HMR and trigger full page reloads.
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url !== '/api/ws') return
    wss!.handleUpgrade(req, socket, head, (ws) => {
      wss!.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected')
    clients.add(ws)

    // Send full tasks state on connect
    const snapshot = getTasksCache()
    if (snapshot) {
      ws.send(
        JSON.stringify({
          type: 'full-state',
          data: snapshot,
          timestamp: Date.now(),
        }),
      )
    }

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'subscribe') {
          console.log('[WS] Subscribed to:', msg.channel)
          // Send current state again on explicit subscribe
          const current = getTasksCache()
          if (current) {
            ws.send(
              JSON.stringify({
                type: 'full-state',
                data: current,
                timestamp: Date.now(),
              }),
            )
          }
        }
      } catch {
        // Ignore invalid messages
      }
    })

    ws.on('close', () => {
      console.log('[WS] Client disconnected')
      clients.delete(ws)
    })

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message)
      clients.delete(ws)
    })
  })

  console.log('[WS] Server attached to Astro dev server')
  return wss
}

/**
 * Broadcast message to all connected WebSocket clients (development)
 * Production uses Cloudflare Workers broadcast
 */
export function broadcastToDevClients(message: Record<string, unknown>) {
  const payload = JSON.stringify(message)
  let sent = 0

  clients.forEach((ws) => {
    if (ws.readyState === 1) {
      // OPEN
      ws.send(payload, (err) => {
        if (!err) sent++
      })
    }
  })

  return sent
}

export function getDevClientCount() {
  return clients.size
}
