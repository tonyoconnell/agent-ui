/**
 * GET /api/ws — WebSocket upgrade endpoint
 *
 * Handles WebSocket upgrade for realtime substrate broadcasts.
 * Clients subscribe and receive task-update, mark, warn, unblock, complete events.
 *
 * Production: Cloudflare Workers WebSocket via upgrade event.
 * Development: Returns 501 — TaskBoard falls back to HTTP polling.
 * Usage: const ws = new WebSocket('/api/ws')
 *        ws.addEventListener('message', e => JSON.parse(e.data))
 */
import type { APIRoute } from 'astro'
import { wsManager } from '@/lib/ws-server'

export const GET: APIRoute = async ({ request }) => {
  // Check if upgrade header is present
  const upgradeHeader = request.headers.get('upgrade')
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response(
      JSON.stringify({
        message: 'WebSocket endpoint. In production (CF Workers), upgrade header required.',
        fallback: 'TaskBoard falls back to HTTP polling for development.',
      }),
      { status: 501, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Cloudflare Workers: WebSocketPair is provided by CF runtime at request time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WebSocketPair = (globalThis as any).WebSocketPair
  if (!WebSocketPair) {
    // Development: WebSocketPair not available (local Astro dev doesn't support it)
    // TaskBoard will fall back to HTTP polling
    return new Response(
      JSON.stringify({ error: 'WebSocket not available in development. Using HTTP polling fallback.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Production (CF Workers): Create WebSocket pair
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pair = new WebSocketPair()
  const [client, server] = Object.values(pair) as WebSocket[]

  // Accept the connection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(server as any).accept?.()

  // Subscribe to broadcasts
  wsManager.subscribe(server)

  // Handle incoming messages (for future use)
  server.addEventListener('message', (event: MessageEvent) => {
    try {
      JSON.parse(event.data as string)
      // Client→server messages reserved for future filter preferences
    } catch {
      // Ignore malformed messages
    }
  })

  // Cleanup on disconnect
  server.addEventListener('close', () => {
    wsManager.unsubscribe(server)
  })

  server.addEventListener('error', () => {
    wsManager.unsubscribe(server)
  })

  // Return WebSocket response
  return new Response(null, {
    status: 101,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webSocket: client,
  } as any)
}
