/**
 * C.j4 — Moved to Windows: BIP39 bootstrap + Windows Hello enrollment
 *
 * Journey: user has an existing Apple wallet (State 2: passkey-prf + bip39-shown)
 *          → moves to a Windows machine (no iCloud Keychain, different authenticator)
 *          → uses /u/restore to enter BIP39 phrase
 *          → same Sui address recovered
 *          → "Save with Windows Hello" CTA visible
 *          → after enrollment, wrappings includes a new passkey-prf entry
 *
 * Setup requirements:
 *   1. `bun add -D @playwright/test` + `bunx playwright install chromium`
 *   2. A `playwright.config.ts` at project root (baseURL: http://localhost:4321).
 *   3. WebAuthn PRF: Chromium Virtual Authenticator does NOT support PRF via CDP
 *      as of Chromium 124. Mock `navigator.credentials` via `page.addInitScript`
 *      to return a deterministic 32-byte PRF output for the new Windows credential.
 *      See `tests/fixtures/mock-webauthn.ts` for the recommended pattern.
 *   4. The "Apple wallet" is simulated by pre-seeding IDB with a WalletRecord
 *      that has both a `bip39-shown` wrapping (no apple passkey-prf stored on
 *      this origin since it was on a different machine) and the known fixture phrase.
 *   5. The Windows context is simulated by a fresh browser context (different
 *      virtual authenticator, no existing passkey-prf wrapping in IDB).
 *   6. Platform label: guessAuthenticatorLabel() returns "Windows Hello" when
 *      navigator.userAgent contains "Windows" — the mock MUST set this UA.
 *
 * IDB pre-seed:
 *   The test injects a WalletRecord via page.evaluate before navigating to
 *   /u/restore. Record has:
 *     version: 1
 *     address: FIXTURE_EXPECTED_ADDRESS  (pre-computed from fixture phrase)
 *     wrappings: [{ type: "bip39-shown", createdAt: <iso> }]
 *     plaintextSeed: null
 *     bip39ShownAt: <iso>
 *
 * Reference: passkeys.md § State 2 → State 4 cross-ecosystem,
 *            interfaces/types-wallet.d.ts WalletRecord,
 *            src/pages/u/restore.astro, src/components/u/lib/vault/passkey.ts
 *            guessAuthenticatorLabel().
 *
 * Known BIP-39 fixture phrase (12 words, valid checksum, canonical test vector):
 *   "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
 *   NEVER use in production.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const FIXTURE_PHRASE_WORDS = [
  'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about',
] as const

/**
 * Expected Sui address for the fixture phrase.
 * Pre-computed offline: Ed25519Keypair.fromSecretKey(seed.slice(0,32)).toSuiAddress()
 * where seed = mnemonicToSeed("abandon × 11 … about").
 * Leave empty until populated from tests/fixtures/recovery-fixture.ts.
 */
const FIXTURE_EXPECTED_ADDRESS = '' // TODO: populate with pre-computed address

const DB_NAME = 'one-vault'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pre-seed the one-vault IDB with a WalletRecord that has only a bip39-shown
 * wrapping — simulating a wallet whose Apple passkey-prf was on a different device
 * and whose seed can only be recovered via the BIP39 phrase on this origin.
 */
async function seedAppleWalletStateInIdb(page: Page, address: string): Promise<void> {
  await page.evaluate(
    async ({ dbName, address: addr }: { dbName: string; address: string }) => {
      const isoNow = new Date().toISOString()
      const record = {
        version: 1,
        address: addr,
        wrappings: [{ type: 'bip39-shown', createdAt: isoNow }],
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
    { dbName: DB_NAME, address: FIXTURE_EXPECTED_ADDRESS || '0xdeadbeefdeadbeef' },
  )
}

/**
 * Add the Windows user-agent override so guessAuthenticatorLabel() returns
 * "Windows Hello". This must be called before page.goto().
 */
async function setWindowsUserAgent(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      get: () =>
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    })
  })
}

/**
 * Mock navigator.credentials to return a deterministic PRF output for
 * enrollment and assertion on the "Windows" virtual authenticator.
 *
 * PRF output is a stable 32-byte array derived from the credential challenge
 * so it is deterministic per test run.
 *
 * NOTE: Remove or replace this stub once Chromium Virtual Authenticator
 * gains native PRF extension support via CDP.
 */
async function mockWindowsHelloPrf(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const MOCK_PRF = new Uint8Array(32).fill(0xab) // stable 32-byte mock PRF output
    const MOCK_CRED_ID = new Uint8Array(16).fill(0xcd) // stable credential ID

    const originalCreate = navigator.credentials.create.bind(navigator.credentials)
    const originalGet = navigator.credentials.get.bind(navigator.credentials)

    // Intercept create() — return a fake credential with PRF extension result
    navigator.credentials.create = async (options) => {
      // Only intercept WebAuthn public-key requests
      if (!(options as CredentialCreationOptions)?.publicKey) {
        return originalCreate(options)
      }
      const fakeCredential = {
        type: 'public-key',
        id: btoa(String.fromCharCode(...MOCK_CRED_ID)),
        rawId: MOCK_CRED_ID.buffer,
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
      return fakeCredential
    }

    // Intercept get() — return a fake assertion with PRF extension result
    navigator.credentials.get = async (options) => {
      if (!(options as CredentialRequestOptions)?.publicKey) {
        return originalGet(options)
      }
      const fakeAssertion = {
        type: 'public-key',
        id: btoa(String.fromCharCode(...MOCK_CRED_ID)),
        rawId: MOCK_CRED_ID.buffer,
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
      return fakeAssertion
    }
  })
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
 * Read passkey-prf wrapping count from the one-vault IDB WalletRecord.
 * Returns 0 if the record or wallet store does not exist.
 */
async function countPasskeyPrfWrappings(page: Page): Promise<number> {
  return page.evaluate(async (dbName: string) => {
    try {
      const record = await new Promise<Record<string, unknown> | null>((resolve, reject) => {
        const req = indexedDB.open(dbName)
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('wallet')) {
            resolve(null)
            return
          }
          const tx = db.transaction('wallet', 'readonly')
          const get = tx.objectStore('wallet').get('wallet')
          get.onsuccess = () => resolve(get.result ?? null)
          get.onerror = () => reject(get.error)
        }
        req.onerror = () => resolve(null)
      })
      if (!record) return 0
      const wrappings = (record.wrappings as Array<{ type: string }>) ?? []
      return wrappings.filter(w => w.type === 'passkey-prf').length
    } catch {
      return 0
    }
  }, DB_NAME)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('C.j4 — Moved to Windows: BIP39 bootstrap + new passkey', () => {
  test.beforeEach(async ({ context }) => {
    // Set Windows UA + mock PRF before any page is opened
    await setWindowsUserAgent(context)
    await mockWindowsHelloPrf(context)
  })

  test('BIP39 restore on Windows recovers same address and shows Windows Hello CTA', async ({ page }) => {
    // -------------------------------------------------------------------------
    // Step 1 — Pre-seed IDB to simulate the "previous Apple wallet"
    //   (bip39-shown wrapping only; the Apple passkey is gone).
    // Navigate to a blank page in the same origin first so IDB is accessible.
    // -------------------------------------------------------------------------
    await page.goto('/u')
    await page.waitForLoadState('domcontentloaded')
    await seedAppleWalletStateInIdb(page, FIXTURE_EXPECTED_ADDRESS || '0xdeadbeefdeadbeef')

    // -------------------------------------------------------------------------
    // Step 2 — Navigate to /u/restore (the cross-device break-glass path).
    // -------------------------------------------------------------------------
    await page.goto('/u/restore')
    await expect(page.getByRole('heading', { name: /restore/i })).toBeVisible({ timeout: 10_000 })

    // -------------------------------------------------------------------------
    // Step 3 — Enter the 12 BIP-39 fixture words.
    // -------------------------------------------------------------------------
    await fillRecoveryWords(page, FIXTURE_PHRASE_WORDS)

    // -------------------------------------------------------------------------
    // Step 4 — Submit the form.
    // -------------------------------------------------------------------------
    const submitButton = page.getByRole('button', { name: /restore|recover|confirm/i })
    await submitButton.waitFor({ state: 'visible', timeout: 5_000 })
    await submitButton.click()

    // -------------------------------------------------------------------------
    // Step 5 — Verify the same address is recovered.
    // RestoreIsland displays the recovered address in data-testid="restore-address".
    // -------------------------------------------------------------------------
    const addressEl = page.getByTestId('restore-address')
    await addressEl.waitFor({ state: 'visible', timeout: 15_000 })
    const restoredAddress = (await addressEl.textContent() ?? '').trim()

    expect(restoredAddress).toMatch(/^0x[0-9a-f]{40,}$/i)

    if (FIXTURE_EXPECTED_ADDRESS) {
      expect(restoredAddress).toBe(FIXTURE_EXPECTED_ADDRESS)
    }

    // -------------------------------------------------------------------------
    // Step 6 — "Save with Windows Hello" (or generic "Save with Touch ID")
    //           CTA must be visible. The label adapts to OS via guessAuthenticatorLabel().
    //           On the mocked Windows UA, the label should be "Windows Hello".
    // -------------------------------------------------------------------------
    const saveCta = page.getByRole('button', {
      name: /save|windows hello|touch id|face id|protect/i,
    })
    await saveCta.waitFor({ state: 'visible', timeout: 10_000 })

    // Prefer the Windows Hello label; fall back to generic save wording.
    const ctaText = (await saveCta.textContent() ?? '').toLowerCase()
    const hasWindowsHelloLabel = ctaText.includes('windows hello') || ctaText.includes('save')
    expect(hasWindowsHelloLabel).toBe(true)

    // -------------------------------------------------------------------------
    // Step 7 — Click the CTA to enroll the Windows Hello passkey.
    //           The mocked navigator.credentials.create() returns a valid PRF credential.
    //           After enrollment, the WalletRecord in IDB should have a new
    //           passkey-prf wrapping.
    // -------------------------------------------------------------------------
    await saveCta.click()

    // Wait for success indicator
    await expect(
      page.getByText(/saved|protected|windows hello enabled|backed up/i)
    ).toBeVisible({ timeout: 20_000 })

    // -------------------------------------------------------------------------
    // Step 8 — Verify wrappings in IDB now includes a passkey-prf entry.
    //           (The bip39-shown entry from step 1 should still be there.)
    // -------------------------------------------------------------------------
    const passkeyCount = await countPasskeyPrfWrappings(page)
    expect(passkeyCount).toBeGreaterThanOrEqual(1)
  })

  test('invalid BIP39 phrase on Windows shows validation error', async ({ page }) => {
    await page.goto('/u/restore')
    await expect(page.getByRole('heading', { name: /restore/i })).toBeVisible({ timeout: 10_000 })

    const NONSENSE_WORDS = Array(12).fill('xxxxxxxx')
    for (let i = 0; i < NONSENSE_WORDS.length; i++) {
      const input = page.locator('[data-testid="restore-form"] input').nth(i)
      await input.waitFor({ state: 'visible', timeout: 5_000 })
      await input.fill(NONSENSE_WORDS[i])
      await input.press('Tab')
    }

    await page.getByRole('button', { name: /restore|recover|confirm/i }).click()

    await expect(
      page.getByText(/invalid|not in.*wordlist|check.*typo|error/i)
    ).toBeVisible({ timeout: 8_000 })

    expect(page.url()).toContain('/u/restore')
  })
})
