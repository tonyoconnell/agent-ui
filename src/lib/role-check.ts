export type RoleAction =
  | 'add_unit'
  | 'remove_unit'
  | 'mark'
  | 'warn'
  | 'tune_sensitivity'
  | 'read_highways'
  | 'read_revenue'
  | 'read_toxic'
  | 'appoint_role'
  | 'read_memory'
  | 'delete_memory'
  | 'discover'
  | 'create_group'
  | 'update_group'
  | 'delete_group'
  | 'invite_member'
  | 'change_role'
  | 'customize_vocabulary'
  | 'edit_schema'
  | 'mint_capability'
  | 'add_attribute'
  | 'view_onchain'

export type GovernanceRole = 'owner' | 'chairman' | 'board' | 'ceo' | 'operator' | 'agent' | 'auditor'

// Substrate owner — the human apex (Anthony O'Connell). Singleton per substrate;
// holds every action permission (matrix-equivalent to chairman) and additionally
// bypasses scope/network/sensitivity gates in src/pages/api/signal.ts. Owner-tier
// API calls are still subject to the rate ceiling (Gap 5) and every allow emits
// audit:owner:{action} before short-circuiting (Gap 2). See owner.md §"File map"
// and §"Owner identity vs the consumer wallet."
const OWNER_ACTIONS: Record<RoleAction, true> = {
  add_unit: true,
  remove_unit: true,
  mark: true,
  warn: true,
  tune_sensitivity: true,
  read_highways: true,
  read_revenue: true,
  read_toxic: true,
  appoint_role: true,
  read_memory: true,
  delete_memory: true,
  discover: true,
  create_group: true,
  update_group: true,
  delete_group: true,
  invite_member: true,
  change_role: true,
  customize_vocabulary: true,
  edit_schema: true,
  mint_capability: true,
  add_attribute: true,
  view_onchain: true,
}

// Hard-coded fallback — used when TypeDB is unreachable or role-grant table is empty.
// Keep in sync with migrations/typedb/seed-roles.tql.
const PERMISSIONS: Record<GovernanceRole, Partial<Record<RoleAction, true>>> = {
  owner: OWNER_ACTIONS,
  chairman: {
    add_unit: true,
    remove_unit: true,
    mark: true,
    warn: true,
    tune_sensitivity: true,
    read_highways: true,
    read_revenue: true,
    read_toxic: true,
    appoint_role: true,
    read_memory: true,
    delete_memory: true,
    discover: true,
    create_group: true,
    update_group: true,
    delete_group: true,
    invite_member: true,
    change_role: true,
    customize_vocabulary: true,
    edit_schema: true,
    mint_capability: true,
    add_attribute: true,
    view_onchain: true,
  },
  board: {
    read_highways: true,
    read_revenue: true,
    read_toxic: true,
    read_memory: true,
    discover: true,
    view_onchain: true,
  },
  ceo: {
    add_unit: true,
    remove_unit: true,
    mark: true,
    warn: true,
    tune_sensitivity: true,
    read_highways: true,
    read_revenue: true,
    read_toxic: true,
    read_memory: true,
    delete_memory: true,
    discover: true,
    create_group: true,
    update_group: true,
    delete_group: true,
    invite_member: true,
    change_role: true,
    customize_vocabulary: true,
    edit_schema: true,
    mint_capability: true,
    add_attribute: true,
    view_onchain: true,
  },
  operator: {
    add_unit: true,
    mark: true,
    warn: true,
    read_highways: true,
    read_toxic: true,
    read_memory: true,
    delete_memory: true,
    discover: true,
    create_group: true,
    invite_member: true,
    view_onchain: true,
  },
  agent: { mark: true, warn: true, discover: true, view_onchain: true },
  auditor: {
    read_highways: true,
    read_revenue: true,
    read_toxic: true,
    read_memory: true,
    discover: true,
    view_onchain: true,
  },
}

// In-process cache: role → Set<action>, busts after 60s.
// Populated from TypeDB role-grant entities on first call per role.
const _cache: Map<string, { actions: Set<string>; at: number }> = new Map()
const CACHE_TTL_MS = 60_000

async function loadRoleFromTypeDB(role: string): Promise<Set<string> | null> {
  try {
    const { readParsed } = await import('@/lib/typedb')
    const rows = await readParsed(
      `match $rg isa role-grant,
         has governance-role "${role}",
         has role-action $a;
       select $a;`,
    )
    if (!rows || rows.length === 0) return null
    const actions = new Set<string>()
    for (const row of rows) {
      const a = (row as Record<string, unknown>).a
      if (typeof a === 'string') actions.add(a)
    }
    return actions.size > 0 ? actions : null
  } catch {
    return null
  }
}

async function resolveActions(role: string): Promise<Set<string>> {
  const cached = _cache.get(role)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.actions

  const fromTypeDB = await loadRoleFromTypeDB(role)
  if (fromTypeDB) {
    _cache.set(role, { actions: fromTypeDB, at: Date.now() })
    return fromTypeDB
  }

  // Fallback to hard-coded matrix
  const perms = PERMISSIONS[role as GovernanceRole] ?? {}
  const actions = new Set(Object.keys(perms))
  _cache.set(role, { actions, at: Date.now() })
  return actions
}

// Async version — queries TypeDB with 60s cache, falls back to hard-coded matrix.
export async function roleCheckAsync(role: string, action: RoleAction): Promise<boolean> {
  const actions = await resolveActions(role)
  return actions.has(action)
}

// Sync version — uses hard-coded matrix only (safe to call in non-async contexts).
// Prefer roleCheckAsync where await is available.
export function roleCheck(role: string, action: RoleAction): boolean {
  const perms = PERMISSIONS[role as GovernanceRole]
  return perms?.[action] === true
}

export function isGovernanceRole(role: string): role is GovernanceRole {
  return role in PERMISSIONS
}
