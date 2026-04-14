/**
 * Development WebSocket server — attaches to Astro dev server
 * Production: Cloudflare Workers WebSocketPair
 * Development: Node.js ws library
 */

import type { Server } from 'node:http'
import { type WebSocket, WebSocketServer } from 'ws'
import { registerDevBroadcaster } from './ws-server'

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()

/**
 * Attach WebSocket server to HTTP server (development only)
 * Called from astro.config.mjs astro:server:setup hook
 */
export function attachWebSocketServer(httpServer: Server) {
  if (wss) return

  // Register this module's broadcast function with wsManager
  registerDevBroadcaster(broadcastToDevClients)

  wss = new WebSocketServer({ server: httpServer, path: '/api/ws' })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected')
    clients.add(ws)

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'subscribe') {
          console.log('[WS] Subscribed to:', msg.channel)
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
