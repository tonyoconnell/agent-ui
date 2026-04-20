/**
 * Proxy an SSE stream from an upstream URL.
 * Cloudflare Workers stream response.body natively — no buffering needed.
 */

/**
 * Streams SSE from upstream without buffering. Pass the validated Origin as corsOrigin.
 */
export async function sseProxy(
  upstreamUrl: string,
  request: Request,
  corsOrigin: string,
  allowedHosts: string[],
): Promise<Response> {
  const host = new URL(upstreamUrl).hostname
  if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
    return new Response(JSON.stringify({ error: 'SSRF: host not allowed' }), { status: 403 })
  }
  const safeHeaders = new Headers(request.headers)
  safeHeaders.delete('Authorization')
  safeHeaders.delete('Cookie')
  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: safeHeaders,
    body: request.body,
  })

  if (!upstream.ok) {
    return new Response(await upstream.text(), { status: upstream.status })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
