import type { WsMessage } from '@/types/task'

export type { WsMessage } from '@/types/task'

// Gateway URL for production relay (resolves same value as typedb.ts)
const GATEWAY_URL = import.meta.env.PUBLIC_GATEWAY_URL || 'https://api.one.ie'

// Broadcast secret for authenticated relay (server-side only)
// In browser context this is undefined, which is fine — browser doesn't relay
const BROADCAST_SECRET = typeof process !== 'undefined' ? process.env.BROADCAST_SECRET : undefined

/**
 * relayToGateway — POST a WsMessage to the Gateway's /broadcast endpoint.
 *
 * The Gateway holds the connectedClients Set for production WebSocket connections.
 * wsManager.broadcast() only reaches same-process clients (dev server or CF Pages
 * Functions with native WS). In production, the Gateway worker holds live browser
 * connections — the relay is the only path to reach them.
 *
 * Requires X-Broadcast-Secret header for authentication (set in Gateway).
 * Fire-and-forget: never throws, never blocks the caller.
 */
export function relayToGateway(msg: WsMessage): void {
  // Skip relay if no secret configured (dev mode or browser context)
  if (!BROADCAST_SECRET) return

  fetch(`${GATEWAY_URL}/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Broadcast-Secret': BROADCAST_SECRET,
    },
    body: JSON.stringify(msg),
  }).catch(() => {}) // silence network errors — relay is best-effort
}

// Global dev broadcast function (set by dev-ws-server at runtime)
let devBroadcaster: ((msg: WsMessage) => void) | null = null

export function registerDevBroadcaster(fn: (msg: WsMessage) => void) {
  devBroadcaster = fn
}

export const wsManager = {
  clients: new Set<WebSocket>(),

  subscribe(ws: WebSocket) {
    this.clients.add(ws)
  },

  unsubscribe(ws: WebSocket) {
    this.clients.delete(ws)
  },

  broadcast(message: WsMessage) {
    // Production (CF Workers): broadcast to CF WebSocket clients
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    }

    // Development: also broadcast to dev WebSocket clients (via ws library)
    if (devBroadcaster) {
      devBroadcaster(message)
    }
  },
}
