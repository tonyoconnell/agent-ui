/**
 * POST /api/agents/create-path — Create on-chain Sui Path between two units
 *
 * Body: { signer: string, sourceObjectId: string, targetObjectId: string }
 *
 * Returns: { ok, digest, pathId }
 */
import type { APIRoute } from 'astro'
import { createPath } from '@/lib/sui'

export const POST: APIRoute = async ({ request }) => {
  const { signer, sourceObjectId, targetObjectId } = (await request.json()) as {
    signer?: string
    sourceObjectId?: string
    targetObjectId?: string
  }

  if (!signer || !sourceObjectId || !targetObjectId) {
    return Response.json({ error: 'signer, sourceObjectId, targetObjectId required' }, { status: 400 })
  }

  try {
    const result = await createPath(signer, sourceObjectId, targetObjectId)
    return Response.json({
      ok: true,
      digest: result.digest,
      pathId: result.pathId,
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
