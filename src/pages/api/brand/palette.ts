import type { APIRoute } from 'astro'
import { brandPalette, type Mode, resolveBrand } from '@/engine/brand'

export const GET: APIRoute = async ({ url }) => {
  const thingId = url.searchParams.get('thingId') ?? undefined
  const groupId = url.searchParams.get('groupId') ?? undefined
  const userId = url.searchParams.get('userId') ?? undefined
  const modeParam = url.searchParams.get('mode')
  const mode: Mode = modeParam === 'dark' ? 'dark' : 'light'

  const tokens = await resolveBrand({ thingId, groupId, userId, mode })
  const palette = brandPalette(tokens, mode)

  if (!palette) {
    return new Response(JSON.stringify({ brand: null, mode }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
    })
  }

  return new Response(JSON.stringify({ brand: palette, mode }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
  })
}
