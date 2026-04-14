/**
 * Runtime-safe cache for the latest tasks snapshot.
 *
 * Lives in its own module so API routes (which run on Cloudflare Pages)
 * can update the cache without transitively pulling in `ws` / `node:http`
 * from `dev-ws-server.ts`, which would crash the Edge runtime on cold start.
 */

let lastTasksState: unknown = null

export function updateTasksCache(state: unknown) {
  lastTasksState = state
}

export function getTasksCache(): unknown {
  return lastTasksState
}
