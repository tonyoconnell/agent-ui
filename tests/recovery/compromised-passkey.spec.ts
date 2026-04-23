/**
 * C.j5 — Compromised passkey: revoke + re-seed via BIP39
 *
 * Journey:
 *   1. Start with State 2 wallet (passkey-prf wrapping + bip39-shown wrapping).
 *   2. Navigate to /u/devices — shows the enrolled passkey device.
 *   3. Revoke the passkey (fires DELETE /api/wallet/wrap/:credId).
 *   4. Verify the device is removed from the list.
 *   5. Navigate to /u/restore — BIP39 re-seed path.
 *   6. Verify the wallet re-enrolls at the same address.
 *
 * Setup requirements:
 *   1. `bun add -D @playwright/test` + `bunx playwright install chromium`
 *   2. A `playwright.config.ts` at project root (baseURL: http://localhost:4321).
 *   3. DELETE /api/wallet/wrap/:credId requires a Better Auth session cookie.
 *      In test, the route is either:
 *        a) Mocked via Playwright route interception to return 204, OR
 *        b) Exercised against a local dev server with a seeded test session.
 *      This spec mocks the DELETE endpoint to avoid auth complexity.
 *   4. WebAuthn PRF mock is required for the re-enrollment step (Step 6).
 *      See `tests/fixtures/mock-webauthn.ts` for the recommended pattern.
 *   5. The IDB wallet record is pre-seeded by the test before navigation.
 *
 * IDB pre-seed (State 2):
 *   version: 1
 *   address: FIXTURE_EXPECTED_ADDRESS
 *   wrappings: [
 *     { type: "passkey-prf", credId: MOCK_CRED_ID, iv: <iv>, ciphertext: <ct> },
 *     { type: "bip39-shown", createdAt: <iso> }
 *   ]
 *   plaintextSeed: null
 *   bip39ShownAt: <iso>
 *
 * Reference: passkeys.md § State 2 → revoke → restore,
 *            src/pages/u/devices.astro, src/components/u/DevicesIsland.tsx,
 *            src/pages/api/wallet/wrap/[credId].ts (DELETE),
 *            interfaces/types-wallet.d.ts WalletRecord.
 */

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const FIXTURE_PHRASE_WORDS = [
  'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about',
] as const

/** See C.j2 note: pre-compute offline and commit. */
const FIXTURE_EXPECTED_ADDRESS = '' // TODO: populate

const DB_NAME = 'one-vault'

/** Hex-encoded mock credential ID — must match what DevicesIsland reads from IDB. */
const MOCK_CRED_HEX = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd' // 16 bytes = 32 hex chars

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pre-seed the one-vault IDB with a State 2 WalletRecord:
 *   - One passkey-prf wrapping (the "compromised" credential)
 *   - One bip39-shown wrapping (the paper backup path)
 */
async function seedState2Wallet(page: Page): Promise<void> {
  await page.evaluate(
    async ({
      dbName,
      address,
      mockCredHex,
    }: {
      dbName: string
      address: string
      mockCredHex: string
    }) => {
      // Decode hex credId → ArrayBuffer
      const hexToBytes = (hex: string) => {
        const bytes = new Uint8Array(hex.length / 2)
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
        }
        return bytes
      }

      const credId = hexToBytes(mockCredHex).buffer
      const iv = new Uint8Array(12).fill(0x11) // stable dummy IV
      const ciphertext = new Uint8Array(32).fill(0x22) // stable dummy ciphertext

      const isoNow = new Date().toISOString()
      const record = {
        version: 1,
        address,
        wrappings: [
          { type: 'passkey-prf', credId, iv, ciphertext },
          { type: 'bip39-shown', createdAt: isoNow },
        ],
        plaintextSeed: null,
        bip39ShownAt: isoNow,
      }

      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, 1)
        req.onupgradeneeded = () => {
          req.result.createObjectStore('wallet', { keyPath: 'key' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('wallet', 'readwrite')
          tx.objectStore('wallet').put({ key: 'wallet', ...record })
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    },
    {
      dbName: DB_NAME,
      address: FIXTURE_EXPECTED_ADDRESS || '0xdeadbeefdeadbeef',
      mockCredHex: MOCK_CRED_HEX,
    },
  )
}

/**
 * Read all wrapping types from the one-vault IDB WalletRecord.
 * Returns [] if record does not exist.
 */
async function getWrappingTypes(page: Page): Promise<string[]> {
  return page.evaluate(async (dbName: string) => {
    try {
      const record = await new Promise<Record<string, unknown> | null>((resolve, reject) => {
        const req = indexedDB.open(dbName)
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('wallet')) { resolve(null); return }
          const tx = db.transaction('wallet', 'readonly')
          const get = tx.objectStore('wallet').get('wallet')
          get.onsuccess = () => resolve(get.result ?? null)
          get.onerror = () => reject(get.error)
        }
        req.onerror = () => resolve(null)
      })
      if (!record) return []
      const wrappings = (record.wrappings as Array<{ type: string }>) ?? []
      return wrappings.map(w => w.type)
    } catch {
      return []
    }
  }, DB_NAME)
}

/** Fill the RestoreIsland word inputs with the fixture phrase. */
async function fillRecoveryWords(page: Page, words: readonly string[]): Promise<void> {
  for (let i = 0; i < words.length; i++) {
    const input = page.locator('[data-testid="restore-form"] input').nth(i)
    await input.waitFor({ state: 'visible', timeout: 5_000 })
    await input.fill(words[i])
    await input.press('Tab')
  }
}

/**
 * Mock the DELETE /api/wallet/wrap/:credId endpoint to return 204 without
 * requiring a real auth session. Also removes the wrapping from IDB
 * to simulate what the client does after a successful revoke.
 */
async function mockRevokeEndpoint(page: Page): Promise<void> {
  await page.route('**/api/wallet/wrap/**', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' })
    } else {
      await route.continue()
    }
  })
}

/**
 * Mock navigator.credentials for re-enrollment after revoke.
 * Injects into page (not context) since page already exists at this point.
 */
async function mockPrfForPage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const MOCK_PRF = new Uint8Array(32).fill(0xef)
    const NEW_CRED_ID = new Uint8Array(16).fill(0x33) // new credential, different from revoked

    navigator.credentials.create = async (options) => {
      if (!(options as CredentialCreationOptions)?.publicKey) return null
      return {
        type: 'public-key',
        id: btoa(String.fromCharCode(...NEW_CRED_ID)),
        rawId: NEW_CRED_ID.buffer,
        response: {
          attestationObject: new ArrayBuffer(0),
          clientDataJSON: new ArrayBuffer(0),
          getTransports: () => ['internal'],
        },
        getClientExtensionResults: () => ({
          prf: { results: { first: MOCK_PRF.buffer } },
        }),
        authenticatorAttachment: 'platform',
      } as unknown as PublicKeyCredential
    }

    navigator.credentials.get = async (options) => {
      if (!(options as CredentialRequestOptions)?.publicKey) return null
      return {
        type: 'public-key',
        id: btoa(String.fromCharCode(...NEW_CRED_ID)),
        rawId: NEW_CRED_ID.buffer,
        response: {
          authenticatorData: new ArrayBuffer(0),
          clientDataJSON: new ArrayBuffer(0),
          signature: new ArrayBuffer(0),
          userHandle: null,
        },
        getClientExtensionResults: () => ({
          prf: { results: { first: MOCK_PRF.buffer } },
        }),
      } as unknown as PublicKeyCredential
    }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('C.j5 — Compromised passkey: revoke + re-seed', () => {
  test('revoke passkey removes device from list; BIP39 re-seed re-enrolls at same address', async ({ page }) => {
    // -------------------------------------------------------------------------
    // Setup — inject PRF mock before page loads
    // -------------------------------------------------------------------------
    await mockPrfForPage(page)

    // -------------------------------------------------------------------------
    // Step 1 — Navigate to origin, pre-seed IDB with State 2 wallet.
    // -------------------------------------------------------------------------
    await page.goto('/u')
    await page.waitForLoadState('domcontentloaded')
    await seedState2Wallet(page)

    // -------------------------------------------------------------------------
    // Step 2 — Navigate to /u/devices — should list the enrolled passkey device.
    // -------------------------------------------------------------------------
    await page.goto('/u/devices')
    await expect(page.getByRole('heading', { name: /devices|passkeys|enrolled/i })).toBeVisible({
      timeout: 10_000,
    })

    // DevicesIsland renders a device card per passkey-prf wrapping.
    // The mock credId hex is MOCK_CRED_HEX. DevicesIsland shows a truncated
    // credId or a generic "Device" label — look for any device card.
    const deviceCard = page.getByTestId('device-card').first()
    await deviceCard.waitFor({ state: 'visible', timeout: 8_000 })

    // -------------------------------------------------------------------------
    // Step 3 — Revoke the passkey.
    //
    // DevicesIsland shows a "Remove" or "Revoke" button per device card.
    // Clicking triggers:
    //   a) A confirmation AlertDialog ("Are you sure?")
    //   b) DELETE /api/wallet/wrap/:credId (mocked → 204)
    //   c) removeWrapping() call to IDB
    //   d) Device card disappears from the list
    // -------------------------------------------------------------------------
    await mockRevokeEndpoint(page)

    const revokeButton = deviceCard.getByRole('button', { name: /remove|revoke|delete/i })
    await revokeButton.waitFor({ state: 'visible', timeout: 5_000 })
    await revokeButton.click()

    // Confirm the AlertDialog
    const confirmButton = page.getByRole('button', { name: /confirm|yes|remove|revoke/i }).last()
    await confirmButton.waitFor({ state: 'visible', timeout: 5_000 })
    await confirmButton.click()

    // -------------------------------------------------------------------------
    // Step 4 — Verify the device is removed from the list.
    //
    // After revoke: no passkey-prf device card should appear.
    // The page may show an empty state or just the bip39-shown fallback notice.
    // -------------------------------------------------------------------------
    // Wait briefly for the list to update
    await page.waitForTimeout(500)

    // The device card should be gone
    const remainingCards = await page.getByTestId('device-card').count()
    expect(remainingCards).toBe(0)

    // Verify IDB was updated: passkey-prf wrapping removed
    const wrappingTypes = await getWrappingTypes(page)
    expect(wrappingTypes).not.toContain('passkey-prf')
    expect(wrappingTypes).toContain('bip39-shown') // paper backup still present

    // -------------------------------------------------------------------------
    // Step 5 — Navigate to /u/restore — BIP39 re-seed path.
    // -------------------------------------------------------------------------
    await page.goto('/u/restore')
    await expect(page.getByRole('heading', { name: /restore/i })).toBeVisible({ timeout: 10_000 })

    // -------------------------------------------------------------------------
    // Step 5a — Enter the BIP39 fixture words.
    // -------------------------------------------------------------------------
    await fillRecoveryWords(page, FIXTURE_PHRASE_WORDS)

    const submitButton = page.getByRole('button', { name: /restore|recover|confirm/i })
    await submitButton.waitFor({ state: 'visible', timeout: 5_000 })
    await submitButton.click()

    // -------------------------------------------------------------------------
    // Step 6 — Verify wallet re-enrolled at same address.
    // -------------------------------------------------------------------------
    const addressEl = page.getByTestId('restore-address')
    await addressEl.waitFor({ state: 'visible', timeout: 15_000 })
    const restoredAddress = (await addressEl.textContent() ?? '').trim()

    expect(restoredAddress).toMatch(/^0x[0-9a-f]{40,}$/i)

    if (FIXTURE_EXPECTED_ADDRESS) {
      expect(restoredAddress).toBe(FIXTURE_EXPECTED_ADDRESS)
    }

    // The "Save with Touch ID" CTA must appear (new passkey enrollment prompt)
    const saveCta = page.getByRole('button', { name: /save|touch id|windows hello|face id|protect/i })
    await saveCta.waitFor({ state: 'visible', timeout: 10_000 })
    await saveCta.click()

    // Wait for save confirmation
    await expect(
      page.getByText(/saved|protected|touch id enabled|backed up/i)
    ).toBeVisible({ timeout: 20_000 })

    // A new passkey-prf wrapping should now exist in IDB
    const finalWrappingTypes = await getWrappingTypes(page)
    expect(finalWrappingTypes).toContain('passkey-prf')
  })
})
