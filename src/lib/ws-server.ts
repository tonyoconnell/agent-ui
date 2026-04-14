export type WsMessage = {
  type: 'task-update' | 'mark' | 'warn' | 'unblock' | 'complete'
  taskId?: string
  strength?: number
  resistance?: number
  status?: string
  timestamp: number
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
