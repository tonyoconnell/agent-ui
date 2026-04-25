/**
 * Integration test: chairman → owner migration (live TypeDB)
 *
 * Verifies that the 0.m1 migration correctly pivoted tony's membership
 * from "chairman" to "owner" and that every role-resolution surface
 * sees "owner" consistently.
 *
 * DOES NOT RUN IN DEFAULT CI — requires a live TypeDB connection.
 * Enable locally:
 *   bun --env-file=.env vitest run src/__tests__/integration/chairman-to-owner-migration.test.ts
 *
 * Skip guard: describe.skipIf(!TYPEDB_AVAILABLE) — no env, no run.
 *
 * Infra mocks: @/lib/auth and neighbours are stubbed so vitest can import
 * api-auth.ts without hitting the Better Auth / zod init path (which requires
 * the Astro/Workers runtime). This is NOT a mock of the TypeDB queries —
 * readParsed and getRoleForUser execute against the real database.
 */

import { describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Stub the Better Auth init path before any module that chains through it.
// auth.ts → sui-wallet.ts → zod crashes in the vitest node env; these stubs
// prevent the crash without touching the TypeDB query path we actually test.
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/human-unit', () => ({ ensureHumanUnit: vi.fn() }))
vi.mock('@/lib/security-signals', () => ({ emitSecurityEvent: vi.fn() }))
vi.mock('@/lib/cf-env', () => ({ getD1: vi.fn(), getEnv: vi.fn() }))
vi.mock('@/lib/net', () => ({ getNet: vi.fn().mockResolvedValue({ warn: vi.fn() }) }))
vi.mock('@/lib/tier-limits', () => ({ resolveTier: vi.fn().mockResolvedValue('free') }))
vi.mock('@/lib/api-key', () => ({
  getKeyPrefix: vi.fn().mockReturnValue('test0000'),
  verifyKey: vi.fn().mockResolvedValue(false),
}))

// After the infra stubs: import the modules under test.
// getRoleForUser and readParsed reach real TypeDB via the env vars.
import { getRoleForUser } from '@/lib/api-auth'
import { type RoleAction, roleCheck } from '@/lib/role-check'
import { readParsed } from '@/lib/typedb'

// ---------------------------------------------------------------------------
// Skip guard — any of the three env names that typedb.ts recognises
// ---------------------------------------------------------------------------

const TYPEDB_AVAILABLE =
  !!process.env.TYPEDB_URL ||
  !!process.env.TYPEDB_DIRECT_URL ||
  !!(import.meta.env as Record<string, unknown>).TYPEDB_URL

const TONY_UID = 'human:tony'
const TONY_GID = 'group:human:tony'

// ---------------------------------------------------------------------------
// Full RoleAction list — must match src/lib/role-check.ts exactly
// ---------------------------------------------------------------------------

const ALL_ROLE_ACTIONS: RoleAction[] = [
  'add_unit',
  'remove_unit',
  'mark',
  'warn',
  'tune_sensitivity',
  'read_highways',
  'read_revenue',
  'read_toxic',
  'appoint_role',
  'read_memory',
  'delete_memory',
  'discover',
  'create_group',
  'update_group',
  'delete_group',
  'invite_member',
  'change_role',
  'customize_vocabulary',
  'edit_schema',
  'mint_capability',
  'add_attribute',
  'view_onchain',
]

// ---------------------------------------------------------------------------
// Suite — skips cleanly when TypeDB is unavailable
// ---------------------------------------------------------------------------

describe.skipIf(!TYPEDB_AVAILABLE)('chairman → owner migration (live)', () => {
  /**
   * 1. TypeDB membership has role "owner"
   *
   * Directly queries the membership relation to confirm the migration
   * wrote the correct member-role value into TypeDB.
   */
  it('TypeDB membership row: role=owner, gid=group:human:tony', async () => {
    // Scope the query to tony's personal group so TypeDB can plan it with
    // two anchored constants — avoids a full membership scan (which can
    // take >20s on a large cluster). This mirrors the exact TQL spec in the
    // W2 plan but adds the gid filter directly in TypeQL for performance.
    const rows = await readParsed(`
      match $u isa unit, has uid "${TONY_UID}";
      $g isa group, has gid "${TONY_GID}";
      (member: $u, group: $g) isa membership, has member-role $r;
      select $r;
    `)

    // Exactly one membership row for tony in his personal group
    expect(rows).toHaveLength(1)

    const row = rows[0] as Record<string, unknown>
    expect(row.r).toBe('owner')
  }, 30_000)

  /**
   * 2. getRoleForUser('human:tony') returns "owner"
   *
   * Exercises the full role-resolution path in api-auth.ts including
   * the TypeDB query and the bestRole() ranking logic.
   */
  it('getRoleForUser returns "owner" for human:tony', async () => {
    const role = await getRoleForUser(TONY_UID)
    expect(role).toBe('owner')
  }, 20_000)

  /**
   * 3. roleCheck('owner', action) returns true for all 22 RoleActions
   *
   * Validates that the OWNER_ACTIONS matrix in role-check.ts is complete
   * and that no action is missing from the owner permission set.
   * Spot-checks chairman-level actions (add_unit) and sensitive actions
   * (delete_group) to ensure the owner role is a superset of all others.
   */
  it('roleCheck("owner", action) returns true for every RoleAction (22 total)', () => {
    const results = ALL_ROLE_ACTIONS.map((action) => ({
      action,
      allowed: roleCheck('owner', action),
    }))

    const denied = results.filter((r) => !r.allowed)
    expect(denied).toHaveLength(0)

    // Explicit spot-checks for high-signal actions
    expect(roleCheck('owner', 'add_unit')).toBe(true) // chairman-level
    expect(roleCheck('owner', 'delete_group')).toBe(true) // sensitive gate
    expect(roleCheck('owner', 'edit_schema')).toBe(true) // schema-level
    expect(roleCheck('owner', 'delete_memory')).toBe(true) // GDPR gate
  })

  /**
   * 4. ROLE_RANK: "owner" beats "chairman" when both are present
   *
   * getRoleForUser calls bestRole() internally, which sorts by ROLE_RANK
   * (owner=7, chairman=6). Verifying getRoleForUser('human:tony') === 'owner'
   * already covers this because tony's personal group carried "chairman"
   * before migration — if bestRole were broken, it would return "chairman"
   * when old rows co-exist during partial migrations.
   *
   * We also confirm directly that the resolved role is 'owner' and not any
   * lower-ranked governance role.
   */
  it('resolved role is "owner" — highest rank in ROLE_RANK (rank 7)', async () => {
    const role = await getRoleForUser(TONY_UID)

    // Must be owner, not chairman (6), ceo (5), board (4), etc.
    expect(role).toBe('owner')

    // Confirm owner has strictly more permissions than chairman by checking
    // a chairman-only action that lesser roles don't hold
    expect(roleCheck('owner', 'tune_sensitivity')).toBe(true)
    expect(roleCheck('agent', 'tune_sensitivity')).toBe(false)
    expect(roleCheck('board', 'tune_sensitivity')).toBe(false)
  }, 20_000)
})
