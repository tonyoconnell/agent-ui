/**
 * Allowed-targets: allowlist filtering for scoped agent wallets.
 * See interfaces/wallet/allowed-targets.d.ts for the contract.
 */

export interface AllowedTarget {
  kind: 'address' | 'package' | 'move-fn'
  value: string
  description?: string
}

export interface AllowedTargetSet {
  version: 1
  targets: AllowedTarget[]
  createdAt: string
  updatedAt: string
}

/**
 * Check if ALL txTargets are permitted by the allowlist.
 *
 * Matching rules:
 *   kind="address"  — exact string match
 *   kind="package"  — txTarget starts with the packageId (covers all objects/fns in that package)
 *   kind="move-fn"  — exact string match (e.g. "0x2::coin::transfer")
 *
 * Returns true only when every target has at least one matching entry.
 */
export function isAllowed(txTargets: string[], allowlist: AllowedTargetSet): boolean {
  return txTargets.every((target) =>
    allowlist.targets.some((entry) => {
      switch (entry.kind) {
        case 'address':
          return target === entry.value
        case 'package':
          return target.startsWith(entry.value)
        case 'move-fn':
          return target === entry.value
        default:
          return false
      }
    }),
  )
}

/**
 * Parse and validate an AllowedTargetSet from unknown input.
 * Throws a WalletError with kind "scope-violation" when the structure is malformed.
 */
export function parseAllowedTargets(raw: unknown): AllowedTargetSet {
  function fail(detail: string): never {
    const err: { kind: string; message: string; cause: string } = {
      kind: 'scope-violation',
      message: 'Scope configuration is invalid.',
      cause: detail,
    }
    throw err
  }

  if (raw === null || typeof raw !== 'object') fail('root is not an object')

  const obj = raw as Record<string, unknown>

  if (obj.version !== 1) fail(`version must be 1, got ${String(obj.version)}`)
  if (!Array.isArray(obj.targets)) fail('targets must be an array')
  if (typeof obj.createdAt !== 'string') fail('createdAt must be a string')
  if (typeof obj.updatedAt !== 'string') fail('updatedAt must be a string')

  const targets: AllowedTarget[] = (obj.targets as unknown[]).map((t, i) => {
    if (t === null || typeof t !== 'object') fail(`targets[${i}] is not an object`)
    const entry = t as Record<string, unknown>
    const kind = entry.kind
    if (kind !== 'address' && kind !== 'package' && kind !== 'move-fn') {
      fail(`targets[${i}].kind must be "address" | "package" | "move-fn", got ${String(kind)}`)
    }
    if (typeof entry.value !== 'string') fail(`targets[${i}].value must be a string`)
    if (entry.description !== undefined && typeof entry.description !== 'string') {
      fail(`targets[${i}].description must be a string or undefined`)
    }
    return {
      kind: kind as AllowedTarget['kind'],
      value: entry.value as string,
      ...(entry.description !== undefined ? { description: entry.description as string } : {}),
    }
  })

  return {
    version: 1,
    targets,
    createdAt: obj.createdAt as string,
    updatedAt: obj.updatedAt as string,
  }
}
