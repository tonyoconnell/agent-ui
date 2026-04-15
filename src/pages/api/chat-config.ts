import type { APIRoute } from 'astro'

export const prerender = false

/**
 * Returns whether the server has an OpenRouter API key configured.
 * The client uses this to skip the "enter your API key" gate in the UI.
 * The actual key is never exposed to the browser.
 */
export const GET: APIRoute = async () => {
  const hasKey = !!import.meta.env.OPENROUTER_API_KEY
  return Response.json({ hasKey, provider: 'openrouter' })
}
