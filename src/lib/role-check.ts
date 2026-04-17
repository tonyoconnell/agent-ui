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

export type GovernanceRole = 'chairman' | 'board' | 'ceo' | 'operator' | 'agent' | 'auditor'

const PERMISSIONS: Record<GovernanceRole, Partial<Record<RoleAction, true>>> = {
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
  },
  board: { read_highways: true, read_revenue: true, read_toxic: true, read_memory: true, discover: true },
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
  },
  agent: { mark: true, warn: true, discover: true },
  auditor: { read_highways: true, read_revenue: true, read_toxic: true, read_memory: true, discover: true },
}

export function roleCheck(role: string, action: RoleAction): boolean {
  const perms = PERMISSIONS[role as GovernanceRole]
  return perms?.[action] === true
}

export function isGovernanceRole(role: string): role is GovernanceRole {
  return role in PERMISSIONS
}
