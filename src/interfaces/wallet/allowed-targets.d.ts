export interface AllowedTarget {
  kind: 'address' | 'package' | 'move-fn'
  value: string // address, packageId, or "packageId::module::fn"
  description?: string // human-readable label
}

export interface AllowedTargetSet {
  version: 1
  targets: AllowedTarget[]
  createdAt: string
  updatedAt: string
}

// Check if a transaction's targets are all allowed
export declare function isAllowed(txTargets: string[], allowlist: AllowedTargetSet): boolean

// Parse an allowlist from JSON (validates structure)
export declare function parseAllowedTargets(raw: unknown): AllowedTargetSet
