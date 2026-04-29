/** CF Workers runtime env — prefer globalThis bindings, fall back to import.meta.env. */
export function runtimeEnv(name: string): string | undefined {
  const g = globalThis as any
  return g[name] || import.meta.env[name] || undefined
}
