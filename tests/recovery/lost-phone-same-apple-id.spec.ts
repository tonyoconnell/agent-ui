/**
 * C.j1 — Lost phone, same Apple ID
 *
 * Journey: wallet created → passkey saved → IDB wiped (simulates new device) →
 *          same iCloud Keychain credential available → wallet recovers at same address.
 *
 * Setup requirements:
 *   1. `bun add -D @playwright/test` + `bunx playwright install chromium`
 *   2. Playwright config must set `use.launchOptions.args` to include
 *      `--enable-virtual-authenticator` (via CDP) for WebAuthn PRF testing.
 *   3. A `playwright.config.ts` at project root pointing baseURL to
 *      http://localhost:4321 (or dev.one.ie for smoke).
 *   4. The virtual authenticator must have `hasUserVerification: true` and
 *      `isUserVerified: true` to satisfy `userVerification: 'required'`.
 *   5. PRF extension: Chromium's Virtual Authenticator does NOT support the
 *      PRF extension in the CDP API as of Chromium 124. Until upstream support
 *      lands, mock `navigator.credentials` via `page.addInitScript` to return
 *      a deterministic PRF output for the known test credential — see
 *      `tests/fixtures/mock-webauthn.ts` for the recommended pattern.
 *
 * Reference: passkeys.md § State 2 (passkey-wrapped), vault/passkey.ts,
 *            vault/storage.ts (DB_NAME = 'one-vault').
 */

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Delete the vault IndexedDB database, simulating a cleared browser or new device. */
async function deleteVaultIdb(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('one-vault')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve() // treat as ok — next open will see empty db
    })
  })
}

/** Read the displayed wallet address from the page. */
async function readWalletAddress(page: Page): Promise<string> {
  const el = page.getByTestId('wallet-address')
  await el.waitFor({ state: 'visible', timeout: 10_000 })
  const text = (await el.textContent()) ?? ''
  return text.trim()
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test.describe('C.j1 — Lost phone, same Apple ID', () => {
  test('wallet recovers via iCloud Keychain after IDB wipe on same Apple ID', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1 — Navigate to /u; wallet auto-creates in State 1.
    // -----------------------------------------------------------------------
    await page.goto('/u')

    // Wait for the dashboard to render. State 1 wallet shows $0.00 balance.
    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 15_000 })

    // -----------------------------------------------------------------------
    // Step 2 — Capture the freshly-generated wallet address.
    // -----------------------------------------------------------------------
    const addressBefore = await readWalletAddress(page)
    expect(addressBefore).toMatch(/^0x[0-9a-f]{40,}$/i)

    // -----------------------------------------------------------------------
    // Step 3 — Save wallet (State 1 → State 2).
    //
    // In a real browser this triggers the WebAuthn PRF enrollment dialog.
    // In test: a virtual authenticator (or mocked navigator.credentials) must
    // be in place before this step. The "Save with Touch ID" button navigates
    // to /u/save or opens a dialog depending on device width.
    // -----------------------------------------------------------------------
    const saveButton = page.getByRole('button', { name: /save|touch id|face id/i })
    await saveButton.waitFor({ state: 'visible', timeout: 10_000 })
    await saveButton.click()

    // Wait for save confirmation — the vault writes the passkey enrollment and
    // wraps the seed under the PRF output. The UI transitions to show the
    // enrolled state (e.g. "Saved" indicator or passkey badge).
    await expect(
      page.getByText(/saved|protected|touch id enabled|backed up/i)
    ).toBeVisible({ timeout: 20_000 })

    // -----------------------------------------------------------------------
    // Step 4 — Simulate "new device, same ecosystem":
    //   - Delete the local IndexedDB vault (new device has no local state).
    //   - Keep the virtual authenticator intact (iCloud Keychain persists the
    //     credential and PRF salt across devices sharing the same Apple ID).
    // -----------------------------------------------------------------------
    await deleteVaultIdb(page)

    // -----------------------------------------------------------------------
    // Step 5 — Reload the page. The wallet should detect no local vault,
    //           prompt for Touch ID, and re-derive the same seed via PRF →
    //           producing the same address.
    // -----------------------------------------------------------------------
    await page.reload()

    // The app should show a "Unlock with Touch ID" / "Recover" prompt.
    const unlockButton = page.getByRole('button', { name: /unlock|touch id|face id|recover/i })
    await unlockButton.waitFor({ state: 'visible', timeout: 10_000 })
    await unlockButton.click()

    // After passkey assertion, the vault is re-opened and the wallet address
    // is recovered from the encrypted record.
    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 20_000 })

    // -----------------------------------------------------------------------
    // Step 6 — Address must match the one from before the wipe.
    // -----------------------------------------------------------------------
    const addressAfter = await readWalletAddress(page)
    expect(addressAfter).toBe(addressBefore)
  })
})
