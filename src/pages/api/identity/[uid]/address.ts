/**
 * GET /api/identity/[uid]/address — Sui address for a unit
 *
 * Platform-held key derivation removed in sys-201.
 * Agents now use ephemeral keypairs; persistent addresses come from user vault.
 */
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  return Response.json(
    { error: 'platform key derivation removed (sys-201); use user vault for Sui addresses' },
    { status: 410 },
  )
}
