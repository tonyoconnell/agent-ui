/**
 * Passkey auth lifecycle integration tests.
 *
 * Covers the test plan from /Users/toc/Server/lifecycle-auth.md § Test plan.
 * Tests A–I correspond to named scenarios in that doc.
 *
 * Manual scenarios (biometric hardware required) use it.todo().
 * Automatable scenarios (cassette-based) will be filled in incrementally.
 *
 * Record:
 *   RECORD=1 bun vitest run src/__tests__/integration/auth-passkey-lifecycle.test.ts
 */

import { describe, it } from 'vitest'

describe('auth passkey lifecycle', () => {
  describe('A: new account, fresh browser', () => {
    it.todo('creates account on 401 pivot from authenticate → register')
    it.todo('returns 24-word BIP-39 recovery phrase on account creation')
    it.todo('server stores cred_id in vault_passkey_hints')
    it.todo('vault chip shows 0 wallets after first sign-in')
  })

  describe('B: returning user, locked vault, same browser', () => {
    it.todo('unlockWithPasskey short-circuits — no network round-trip to /authenticate')
    it.todo('vault chip reflects unlocked state after local unlock')
  })

  describe('C: same account, fresh browser, synced passkey (cold restore)', () => {
    it.todo('server finds cred_id and returns wrappedMaster + session')
    it.todo('vault bootstrapped from cloud blob via /api/vault/fetch')
    it.todo('no recovery phrase shown on cold restore')
  })

  describe('D: existing user, no synced passkey (password fallback)', () => {
    it.todo('passkey cancel does NOT silently create a new account')
    it.todo('password sign-in leads to CloudRestorePanel when cloud blob exists')
    it.todo('phrase entry restores vault without Touch ID')
  })

  describe('E: all phrases lost — unrecoverable', () => {
    it.todo('server cannot help — wrappedMaster only unwraps with physical authenticator PRF')
    it.todo('user must createAccountWithPasskey again; old blob is orphaned')
  })

  describe('F: wallet creation while signed in', () => {
    it.todo('saveWallet triggers notifyMutation → syncToCloud → PUT /api/vault/sync')
    it.todo('wallet persists after lock + unlock cycle')
  })

  describe('F-bis: persistence guarantee (most important test)', () => {
    it.todo('3 wallets survive: sign-out → clear site data → sign-in → all 3 present with same addresses')
    it.todo('addresses are identical after cold restore (same master)')
  })

  describe('F-ter: cross-device persistence', () => {
    it.todo('wallet created on device B appears on device A after refresh')
  })

  describe('G: two-passkeys regression', () => {
    it.todo('OS picker shows at most one credential per ONE account after VaultSetupWizard deletion')
  })

  describe('H: ensureHumanUnit fires', () => {
    it.todo('TypeDB has unit-kind=human row after sign-in')
    it.todo('personal group and chairman membership exist')
  })

  describe('I: migrations applied', () => {
    it.todo('0022_vault_blob and 0023_vault_passkey_hints present in migration history')
    it.todo('0021_wallet_backups marked as legacy (table dropped by 0024)')
  })

  describe('M: sync watermark (Roadmap §0)', () => {
    it.todo('Sign out awaits flushPendingSync before authClient.signOut()')
    it.todo('wallet created immediately before sign-out is present after fresh sign-in')
  })
})
