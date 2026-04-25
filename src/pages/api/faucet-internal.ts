/**
 * POST /api/faucet-internal — Internal faucet (disabled — no platform key)
 *
 * Platform-held SUI_SEED was removed in sys-201. Use the official faucet
 * at https://faucet.testnet.sui.io or POST /api/faucet instead.
 */
import type { APIRoute } from 'astro'

export const POST: APIRoute = async () => {
  return Response.json(
    { error: 'internal faucet disabled — platform key removed (sys-201); use /api/faucet' },
    { status: 503 },
  )
}
