/**
 * I.1 — First-30-seconds Playwright test
 *
 * Walks the wallet storyboard end-to-end per wallet.md §The first 30 seconds:
 *   1. Land at /u → wallet exists immediately (no login, no button)
 *   2. Balance shows $0.00, Receive and Send actions visible
 *   3. Navigate to Receive → address displayed at /u/receive
 *   4. Navigate to Send → amount input visible at /u/send
 *   5. /u/save → "Save this wallet with Touch ID?" prompt visible
 *   6. "Not now" dismisses the prompt → redirects to /u
 *   7. Wallet address persists across reload (IDB survives tab-close)
 *
 * State-1 assumptions (no passkey enrolled):
 *   - Wallet auto-creates on first visit (ephemeral Ed25519 key in IDB)
 *   - Send is available without Touch ID (sponsored or capped flow)
 *   - Save prompt is a soft nag, always dismissable
 *
 * Required data-testid attributes (listed at bottom of file).
 *
 * Setup:
 *   bun add -D @playwright/test
 *   bunx playwright install chromium
 *   bun run dev   (localhost:4321)
 *   bunx playwright test tests/integration/first-30-seconds.spec.ts
 *
 * Reference: wallet.md §First 30 seconds, passkeys.md §State 1,
 *            SavePrompt.tsx, ReceivePage.tsx, SendPage.tsx
 */

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the displayed wallet address. Returns empty string if not found. */
async function readWalletAddress(page: Page, timeout = 10_000): Promise<string> {
  try {
    const el = page.getByTestId('wallet-address')
    await el.waitFor({ state: 'visible', timeout })
    return ((await el.textContent()) ?? '').trim()
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
      req.onerror = () => resolve() // best-effort
      req.onblocked = () => resolve()
    })
  })
}

// ---------------------------------------------------------------------------
// Suite: First 30 seconds
// ---------------------------------------------------------------------------

test.describe('I.1 — First 30 seconds storyboard', () => {
  /**
   * Step 1 — Land at /u
   *
   * The wallet must exist immediately: no login screen, no "Create wallet"
   * button required. Balance shows $0.00. Receive and Send are present.
   */
  test('step 1 — land at /u: wallet exists immediately', async ({ page }) => {
    await page.goto('/u')

    // Wallet address visible within 15s (IDB init + React hydration)
    const address = await readWalletAddress(page, 15_000)
    expect(address, 'Wallet address must be non-empty on first visit').toBeTruthy()

    // Balance $0.00 for a fresh wallet
    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 15_000 })

    // Primary actions present
    await expect(page.getByRole('button', { name: /receive/i }).or(page.getByText(/receive/i))).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByRole('button', { name: /send/i }).or(page.getByText(/send/i))).toBeVisible({
      timeout: 5_000,
    })
  })

  /**
   * Step 2 — Navigate to Receive
   *
   * Clicking Receive opens /u/receive (or a sheet/dialog).
   * The wallet address must be visible in the receive UI.
   */
  test('step 2 — receive: address shown', async ({ page }) => {
    await page.goto('/u')
    // Wait for wallet to initialise
    await readWalletAddress(page, 15_000)

    // Click Receive — may be a button, link, or nav item
    const receiveBtn = page
      .getByRole('button', { name: /receive/i })
      .or(page.getByRole('link', { name: /receive/i }))
    await receiveBtn.waitFor({ state: 'visible', timeout: 10_000 })
    await receiveBtn.click()

    // Should reach /u/receive (or a modal with the QR code)
    // Either URL changes or a receive-specific element appears
    const atReceivePage = page.url().includes('/u/receive')
    if (atReceivePage) {
      await expect(page).toHaveURL(/\/u\/receive/)
    }

    // Address visible in receive UI (full or truncated)
    const receiveAddress = page.getByTestId('wallet-address')
    await expect(receiveAddress).toBeVisible({ timeout: 8_000 })
  })

  /**
   * Step 3 — Send form opens (State 1 — no Touch ID required to open form)
   *
   * /u/send must show an amount input. The sponsored path means no Touch ID
   * gate on the form itself (gate appears only at confirm, or for amounts > cap).
   */
  test('step 3 — send: form opens without Touch ID', async ({ page }) => {
    await page.goto('/u')
    await readWalletAddress(page, 15_000)

    const sendBtn = page
      .getByRole('button', { name: /send/i })
      .or(page.getByRole('link', { name: /send/i }))
    await sendBtn.waitFor({ state: 'visible', timeout: 10_000 })
    await sendBtn.click()

    // Should reach /u/send (or open a send sheet)
    if (page.url().includes('/u/send')) {
      await expect(page).toHaveURL(/\/u\/send/)
    }

    // Amount input must be visible — no Touch ID prompt blocking the form
    const amountInput = page
      .locator('input[type="number"]')
      .or(page.locator('[placeholder*="amount" i]'))
      .or(page.locator('[data-testid="send-amount-input"]'))
    await expect(amountInput.first()).toBeVisible({ timeout: 8_000 })
  })

  /**
   * Step 4 — /u/save: "Save this wallet with Touch ID?" prompt
   *
   * The save route shows the SavePrompt component which invites the user to
   * enrol a passkey. The headline and "Not now" button must be present.
   */
  test('step 4 — /u/save: save-with-touch-id prompt visible', async ({ page }) => {
    await page.goto('/u/save')

    // Headline from SavePrompt.tsx: "Save this wallet with Touch ID?"
    const headline = page.getByText(/save this wallet with touch id/i)
    await expect(headline).toBeVisible({ timeout: 10_000 })

    // "Not now" dismiss button (isDismissable=true on SavePromptIsland)
    const notNow = page.getByText(/not now/i)
    await expect(notNow).toBeVisible({ timeout: 5_000 })
  })

  /**
   * Step 5 — "Not now" dismisses the save prompt
   *
   * Clicking "Not now" should navigate away from /u/save without enrolling.
   * The user ends up back at /u (or at least not on /u/save).
   */
  test('step 5 — save prompt: "not now" dismisses and returns to /u', async ({ page }) => {
    await page.goto('/u/save')

    const notNow = page.getByText(/not now/i)
    await notNow.waitFor({ state: 'visible', timeout: 10_000 })
    await notNow.click()

    // SavePromptIsland navigates to /u on dismiss
    await expect(page).toHaveURL(/\/u$/, { timeout: 8_000 })

    // Prompt is no longer visible after dismissal
    await expect(page.getByText(/save this wallet with touch id/i)).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Suite: IDB persistence
// ---------------------------------------------------------------------------

test.describe('I.1b — Wallet persists across reload', () => {
  /**
   * Same address survives a tab-close (page.reload() simulates session restart
   * without clearing IDB — the vault survives because IDB is origin-scoped).
   */
  test('wallet address is the same after reload', async ({ page }) => {
    await page.goto('/u')
    const address1 = await readWalletAddress(page, 15_000)
    expect(address1).toBeTruthy()

    await page.reload()
    const address2 = await readWalletAddress(page, 15_000)

    expect(address1).toBe(address2)
  })

  /**
   * After explicitly clearing IDB, the next visit creates a NEW wallet
   * (different address, no crash). This is the designed loss path for
   * unsaved State-1 wallets.
   */
  test('after IDB clear: fresh wallet at different address, no error', async ({ page }) => {
    await page.goto('/u')
    const address1 = await readWalletAddress(page, 15_000)
    expect(address1).toBeTruthy()

    await deleteVaultIdb(page)
    await page.reload()

    await expect(page.getByText(/\$0\.00/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/error|crash|failed|something went wrong/i)).not.toBeVisible()

    const address2 = await readWalletAddress(page, 15_000)
    expect(address2).toBeTruthy()
    // New seed → different address (collision probability ~2^-256)
    expect(address2).not.toBe(address1)
  })
})

// ---------------------------------------------------------------------------
// data-testid attributes required in components
// ---------------------------------------------------------------------------
//
// For these tests to pass, the following data-testid attributes must be added:
//
// 1. [data-testid="wallet-address"]
//    WHERE: UDashboard.tsx (dashboard address display), ReceivePage.tsx (address
//           under QR code), and any other surface that shows the primary wallet address.
//    WHAT:  The full Sui address string (0x...) as textContent, or a truncated
//           form of it — the test only checks for presence, not full value.
//
// 2. [data-testid="send-amount-input"]
//    WHERE: SendPage.tsx — the USD amount <input> in step 1 of the send form.
//    WHAT:  Falls back to input[type="number"] if this testid is absent.
//           Adding it makes the selector more robust.
//
// Components to edit:
//   src/components/u/UDashboard.tsx        — add data-testid="wallet-address" to balance/address display
//   src/components/u/pages/ReceivePage.tsx — add data-testid="wallet-address" to <code> showing address
//   src/components/u/pages/SendPage.tsx    — add data-testid="send-amount-input" to first amount <input>
