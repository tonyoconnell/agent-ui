/**
 * GET /api/auth/zklogin/callback
 *
 * HTML bounce page for Google's implicit OAuth flow.
 * Google sends id_token in URL fragment (#id_token=...), which browsers
 * never send to servers. This page reads location.hash and POSTs it to
 * the Better Auth zklogin/verify endpoint.
 *
 * POST is deprecated — use /api/auth/zklogin/verify (Better Auth plugin).
 */

import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async () => {
  const html = `<!doctype html><html><head><meta charset=utf-8><title>Signing in…</title></head>
<body style="font-family:system-ui;background:#0a0a0f;color:#cbd5e1;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Completing sign-in…</p>
<script>
(async () => {
  const hash = new URLSearchParams(location.hash.slice(1));
  const idToken = hash.get('id_token');
  if (!idToken) { document.body.innerText = 'No id_token in response'; return; }
  const res = await fetch('/api/auth/zklogin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (res.ok) { location.replace('/chairman'); }
  else { const { error } = await res.json().catch(() => ({})); document.body.innerText = 'Sign-in failed: ' + (error || res.status); }
})();
</script></body></html>`
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

/**
 * @deprecated Use Better Auth plugin: POST /api/auth/zklogin/verify
 */
export const POST: APIRoute = async () => {
  return Response.json(
    {
      error: 'deprecated',
      message: 'Use /api/auth/zklogin/verify instead',
      migration: 'The HTML bounce now POSTs to the Better Auth plugin endpoint',
    },
    { status: 410 },
  )
}
