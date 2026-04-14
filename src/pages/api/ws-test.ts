/**
 * GET /api/ws-test — Test WebSocket broadcast
 * Broadcasts a test message to all connected WebSocket clients
 */
import type { APIRoute } from 'astro'
import { wsManager } from '@/lib/ws-server'

export const GET: APIRoute = async () => {
  const timestamp = new Date().toISOString()
  // Cast to WsMessage type
  const message = {
    type: 'task-update' as const,
    message: `WebSocket test broadcast at ${timestamp}`,
    timestamp: Date.now(),
  }

  wsManager.broadcast(message)

  return new Response(
    JSON.stringify({
      sent: true,
      message,
      note: 'Check browser console for WebSocket message',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
