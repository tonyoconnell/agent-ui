/**
 * GET /.well-known/webauthn
 *
 * WebAuthn Related Origin Requests (ROR) file.
 * When rpID='one.ie' but the user is on dev.one.ie / local.one.ie / etc.,
 * browsers fetch this URL from the rpId's origin to verify the subdomain
 * is authorized to use that rpId. Without this, passkey assertion fails
 * with "The relying party ID is not a registrable domain suffix…"
 *
 * Spec: https://w3c.github.io/webauthn/#sctn-related-origins
 */

import type { APIRoute } from 'astro'

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      origins: [
        'https://one.ie',
        'https://dev.one.ie',
        'https://local.one.ie',
        'https://main.one.ie',
        'https://pay.one.ie',
      ],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  )
