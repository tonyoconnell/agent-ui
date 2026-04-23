/**
 * C.j3 — Never saved + cleared browser: wallet lost (by design)
 *
 * Journey: wallet created in State 1 (no passkey save) → balance cap enforced
 *          for receive > $25 → IDB cleared → new wallet at different address →
 *          no error, no crash — fresh start, old address gone.
 *
 * This is the designed loss path. The product intentionally loses an unsaved
 * State-1 wallet when the browser is cleared. The UX must NOT show an error —
 * it should simply create a new wallet. The cap message must appear when
 * a user tries to receive above the unsaved-wallet limit.
 *
 * Setup requirements:
 *   1. `bun add -D @playwright/test` + `bunx playwright install chromium`
 *   2. A `playwright.config.ts` at project root (baseURL: http://localhost:4321).
 *   3. No WebAuthn virtual authenticator needed for this test (State 1 only,
 *      no passkey enrollment).
 *
 * Reference: passkeys.md § State 1, wallet.md § balance cap ($25 unsaved),
 *            vault/storage.ts (DB_NAME = 'one-vault').
 */

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the displayed wallet address from the page. Returns empty string if not found. */
async function tryReadWalletAddress(page: Page): Promise<string> {
  try {
    const el = page.getByTestId('wallet-address')
    await el.waitFor({ state: 'visible', timeout: 8_000 })
    return (await el.textContent() ?? '').trim()
  } catch {
    return ''
  }
}

/** Delete the vault IndexedDB, simulating a cleared browser. */
async function deleteVaultIdb(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('one-vault')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()  // best-effort
      req.onblocked = () => resolve()
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('C.j3 — Never saved + cleared browser', () => {
  test('unsaved wallet is lost after browser clear — fresh wallet created, no error', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1 — Create a State-1 wallet by visiting /u.
    // -----------------------------------------------------------------------
    await page.goto('/u')
    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 15_000 })

    const originalAddress = await tryReadWalletAddress(page)
    expect(originalAddress).toMatch(/^0x[0-9a-f]{40,}$/i)

    // -----------------------------------------------------------------------
    // Step 2 — Verify the balance cap message appears when trying to receive
    //           above the unsaved-wallet limit ($25).
    //
    // The "Receive" flow should show a cap warning before allowing a QR code
    // for amounts > $25 to prevent unsaved-wallet funds being unrecoverable.
    // -----------------------------------------------------------------------
    const receiveButton = page.getByRole('button', { name: /receive/i })
    await receiveButton.waitFor({ state: 'visible', timeout: 10_000 })
    await receiveButton.click()

    // Look for the cap/limit warning — wording varies but the semantic intent
    // is "you haven't saved your wallet, large funds are at risk".
    // The warning may appear immediately, or after entering an amount > $25.
    const capIndicators = [
      page.getByText(/save.*wallet|unsaved|protect.*wallet|backup.*first/i),
      page.getByText(/\$25|25 limit|cap/i),
      page.getByText(/at risk|not saved|no passkey/i),
    ]

    // At least one cap/warning message must be visible within the receive flow.
    const capVisible = await Promise.any(
      capIndicators.map(loc =>
        loc.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true)
      )
    ).catch(() => false)

    expect(capVisible, 'Cap/save warning should be visible in receive flow for unsaved wallet').toBe(true)

    // Close the receive flow (press Escape or a close button).
    await page.keyboard.press('Escape')

    // -----------------------------------------------------------------------
    // Step 3 — Simulate "cleared browser": delete the vault IDB.
    //           (The user did NOT save their wallet before clearing.)
    // -----------------------------------------------------------------------
    await deleteVaultIdb(page)

    // -----------------------------------------------------------------------
    // Step 4 — Reload the page.
    // -----------------------------------------------------------------------
    await page.reload()

    // -----------------------------------------------------------------------
    // Step 5 — A fresh wallet should auto-create. No error messages.
    //           The page should behave exactly as a first-time visit.
    // -----------------------------------------------------------------------
    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 15_000 })

    // No crash / error state visible
    await expect(page.getByText(/error|crash|failed|something went wrong/i)).not.toBeVisible()

    // -----------------------------------------------------------------------
    // Step 6 — The new wallet address must differ from the lost one.
    //           (Ed25519 from a fresh random seed — astronomically unlikely to collide.)
    // -----------------------------------------------------------------------
    const newAddress = await tryReadWalletAddress(page)
    expect(newAddress).toMatch(/^0x[0-9a-f]{40,}$/i)
    expect(newAddress).not.toBe(originalAddress)
  })

  test('cleared browser with no prior wallet — fresh wallet, no error', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Variant: browser has never had a wallet (fresh profile).
    // The page should auto-create cleanly with no error or recovery prompt.
    // -----------------------------------------------------------------------

    // Ensure clean state before navigating.
    await page.goto('about:blank')
    await deleteVaultIdb(page)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.goto('/u')

    // Page must load without any error state.
    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/error|crash|failed|something went wrong/i)).not.toBeVisible()

    // A valid Sui address must be present.
    const address = await tryReadWalletAddress(page)
    expect(address).toMatch(/^0x[0-9a-f]{40,}$/i)
  })
})
