export type WsMessage = {
  type: 'task-update' | 'mark' | 'warn' | 'unblock' | 'complete'
  taskId?: string
  strength?: number
  resistance?: number
  status?: string
  timestamp: number
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
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    }
  },
}
