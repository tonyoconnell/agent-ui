/**
 * PayService - Integration with pay.one.ie (v3.0.0)
 *
 * Unified API for payments, wallets, and access control
 * across blockchains via pay.one.ie
 *
 * Features:
 * - Unified Protocol API (POST /)
 * - Escrow Payments
 * - Shortlinks
 * - Caching & Retry Logic
 * - Authentication
 */

const PAY_API = 'https://pay.one.ie'
const API_TIMEOUT = 15000 // 15s timeout

export interface PayResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  metadata?: Record<string, unknown>
}

export interface PayServiceConfig {
  apiKey?: string
  userId?: string
  enableCache?: boolean
  cacheTimeout?: number
}

// Default configuration
let config: PayServiceConfig = {
  enableCache: true,
  cacheTimeout: 60000, // 1 minute default cache
}

// Caching layer
const cache = new Map<string, { data: unknown; expires: number }>()

/**
 * Configure the PayService
 */
export function configure(newConfig: Partial<PayServiceConfig>) {
  config = { ...config, ...newConfig }
}

// ============================================
// CORE API EXECUTION
// ============================================

/**
 * Generic API call handler with retry, timeout, and caching
 */
async function callPay<T>(
  protocol: string,
  data: unknown,
  options: {
    cache?: boolean
    cacheTTL?: number
    retries?: number
    method?: 'POST' | 'GET'
    endpoint?: string // Optional override for non-unified endpoints
  } = {},
): Promise<PayResponse<T>> {
  // Construct cache key
  const cacheKey = `${protocol}:${JSON.stringify(data)}`

  // Check cache first
  if (options.cache !== false && config.enableCache) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.expires) {
      return cached.data as PayResponse<T>
    }
    // Clean up expired
    if (cached) cache.delete(cacheKey)
  }

  const retries = options.retries ?? 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

      const endpoint = options.endpoint || PAY_API
      const method = options.method || 'POST'

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add Auth headers if configured
      if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`
      if (config.userId) headers['X-User-Id'] = config.userId

      const response = await fetch(endpoint, {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(options.endpoint ? data : { protocol, data }) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        // Create error from status
        const text = await response.text()
        throw new Error(`HTTP Error ${response.status}: ${text}`)
      }

      const result = (await response.json()) as PayResponse<T>

      // Cache successful responses
      if ((result.success || response.ok) && options.cache !== false && config.enableCache) {
        // Handle direct response formats (some endpoints might not wrap in 'success')
        const normalizedResult = result.success === undefined ? { success: true, data: result } : result

        cache.set(cacheKey, {
          data: normalizedResult,
          expires: Date.now() + (options.cacheTTL || config.cacheTimeout!),
        })

        return normalizedResult as PayResponse<T>
      }

      return result
    } catch (error) {
      // console.warn(`PayService Attempt ${attempt + 1} failed:`, error);
      lastError = error as Error
      // Don't retry on abort/timeout unless it's strictly network
      if (attempt < retries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise((r) => setTimeout(r, 2 ** attempt * 500))
      }
    }
  }

  return {
    success: false,
    error: {
      code: 'NETWORK_ERROR',
      message: lastError?.message || 'Network request failed',
    },
  }
}

// ============================================
// ESCROW & PAYMENTS (NEW v3.0)
// ============================================

/**
 * Create a new escrow payment
 * Returns a unique deposit address for the user to pay to
 */
export async function createEscrow(params: {
  chain: string
  expectedAmount: string
  treasuryAddress: string
  merchantId?: string
  productId?: string
  expiryMinutes?: number
}): Promise<
  PayResponse<{
    paymentId: string
    escrowAddress: string
    checkStatusUrl: string
    expiresAt: number
  }>
> {
  return callPay('escrow_create', params, { endpoint: `${PAY_API}/escrow/create` })
}

/**
 * Check escrow payment status
 */
export async function getEscrowStatus(paymentId: string): Promise<
  PayResponse<{
    paymentId: string
    status: 'pending' | 'detected' | 'forwarding' | 'completed' | 'expired' | 'failed'
    receivedAmount?: string
    receivedTxHash?: string
    detectedAt?: number
  }>
> {
  return callPay(
    'escrow_status',
    {},
    {
      endpoint: `${PAY_API}/escrow/${paymentId}/status`,
      method: 'GET',
      cacheTTL: 5000, // Short cache for status checks
    },
  )
}

/**
 * Create a payment link (Legacy/Standard)
 */
export async function createPaymentLink(params: {
  amount: string
  currency: string
  recipient: string
  memo?: string
  chain?: string
}): Promise<PayResponse<{ link: string; expires: number }>> {
  return callPay('payment_link_create', params)
}

// ============================================
// SHORTLINKS (NEW v3.0)
// ============================================

/**
 * Create a shortlink for a product or payment
 */
export async function createShortlink(params: {
  payload: string
  signature: string
  baseUrl?: string
}): Promise<PayResponse<{ code: string; shortUrl: string; longUrl: string }>> {
  // This uses the unified protocol actually, or we can use the backend utility if exposed
  // For now we map to payment_link_create which might use shortlinks internally
  // Or we can assume we're crafting the link manually.

  // Implementation note: The API creates shortlinks automatically for payment links now.
  // This function is for explicit shortlink creation if needed.
  return callPay('shortlink_create', params)
}

// ============================================
// WALLETS
// ============================================

export async function generateWallet(params: {
  chain: string
  type?: 'standard' | 'multisig'
  withMnemonic?: boolean
}): Promise<
  PayResponse<{
    address: string
    publicKey: string
    privateKey?: string // Only if not server-derived
    mnemonic?: string
    instructions?: string
  }>
> {
  // Use the new /wallet/generate endpoint
  const result = await callPay('wallet_generate', params, { endpoint: `${PAY_API}/wallet/generate` })

  // Normalization for v3 API flat structure (wallet/secrets at root)
  if (result.success && !result.data && (result as any).wallet) {
    const raw = result as any
    const chainKey = params.chain.toLowerCase()

    let address = ''
    let privateKey = ''
    let publicKey = ''

    if (chainKey === 'sui') {
      address = raw.wallet.sui
      privateKey = raw.secrets?.suiPrivateKey
      publicKey = raw.wallet.suiPublicKey || ''
    } else if (chainKey === 'sol' || chainKey === 'solana') {
      address = raw.wallet.sol || raw.wallet.solana
      privateKey = raw.secrets?.solPrivateKey
    } else if (chainKey === 'btc' || chainKey === 'bitcoin') {
      address = raw.wallet.btc || raw.wallet.bitcoin
      privateKey = raw.secrets?.btcPrivateKey
    } else {
      // Default to EVM for ETH, ONE, USDC, BASE, etc.
      address = raw.wallet.evm
      privateKey = raw.secrets?.evmPrivateKey
    }

    return {
      success: true,
      data: {
        address,
        publicKey: publicKey || address, // Fallback
        privateKey,
        mnemonic: raw.secrets?.mnemonic,
        instructions: raw.instructions,
      },
    }
  }

  return result as PayResponse<{
    address: string
    publicKey: string
    privateKey?: string
    mnemonic?: string
    instructions?: string
  }>
}

export async function deriveWallet(params: { identifier: string; salt?: string }): Promise<
  PayResponse<{
    address: string
    publicKey: string
  }>
> {
  return callPay('wallet_derive', params, { endpoint: `${PAY_API}/wallet/derive` })
}

export async function getBalance(params: {
  address: string
  chain: string
  token?: string
}): Promise<PayResponse<{ balance: string; usdValue: number }>> {
  try {
    // Use unified protocol endpoint (POST /) instead of REST endpoint
    // This is the correct pattern for ONE Protocol API
    const result = await callPay<{ balance: string; usdValue: number }>('wallet_balance', params, {
      cache: true,
      cacheTTL: 30000, // 30s cache for balance checks
    })

    // Normalize response - backend may return different formats
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          balance: result.data.balance || '0.00',
          usdValue: result.data.usdValue || 0,
        },
      }
    }

    return { success: true, data: { balance: '0.00', usdValue: 0 } }
  } catch (e) {
    console.warn('Balance check failed (API likely unavailable), defaulting to 0', e)
    return { success: true, data: { balance: '0.00', usdValue: 0 } }
  }
}

export async function getTransactions(params: { address: string; chain: string; limit?: number }): Promise<
  PayResponse<{
    transactions: Array<{
      hash: string
      from: string
      to: string
      value: string
      timestamp: number
      status: string
    }>
  }>
> {
  try {
    // Use unified protocol endpoint (POST /) instead of REST endpoint
    const result = await callPay<{
      transactions: Array<{
        hash: string
        from: string
        to: string
        value: string
        timestamp: number
        status: string
      }>
    }>('wallet_transactions', params, {
      cache: true,
      cacheTTL: 60000, // 1 minute cache for transactions
    })

    if (result.success && result.data?.transactions) {
      return result
    }

    return { success: true, data: { transactions: [] } }
  } catch (e) {
    console.warn('Transaction history check failed, defaulting to empty', e)
    return { success: true, data: { transactions: [] } }
  }
}

// ============================================
// PRICES
// ============================================

export async function getPrice(params: {
  token: string
  currency?: string
}): Promise<PayResponse<{ price: number; change24h: number }>> {
  return callPay('price_get', params, { cacheTTL: 60000 }) // 60s cache
}

export async function convertCurrency(params: {
  from: string
  to: string
  amount: string
}): Promise<PayResponse<{ amount: string; rate: number }>> {
  const { data, success, error } = await getPrice({ token: params.from, currency: params.to })

  if (!success || !data) {
    return {
      success: false,
      error: error || { code: 'PRICE_FETCH_FAILED', message: 'Failed to fetch price for conversion' },
    }
  }

  const rate = data.price
  const convertedAmount = (parseFloat(params.amount) * rate).toString()

  return {
    success: true,
    data: {
      amount: convertedAmount,
      rate,
    },
  }
}

// ============================================
// PRODUCTS & THINGS
// ============================================

export async function createProduct(params: {
  name: string
  description: string
  price: string
  currency: string
  recipient: string
}): Promise<PayResponse<{ productId: string; paymentLink: string }>> {
  return callPay('product_create', params)
}

// ============================================
// HELPERS
// ============================================

/**
 * Generate a payment URL (Legacy)
 */
export function getPaymentUrl(params: {
  to: string
  amount?: string
  token?: string
  chain?: string
  memo?: string
  type?: string
  product?: string
}): string {
  const url = new URL('https://pay.one.ie/pay')
  url.searchParams.set('to', params.to)
  if (params.amount) url.searchParams.set('amount', params.amount)
  if (params.token) url.searchParams.set('token', params.token)
  if (params.chain) url.searchParams.set('chain', params.chain)
  if (params.memo) url.searchParams.set('memo', params.memo)
  if (params.type) url.searchParams.set('type', params.type)
  if (params.product) url.searchParams.set('product', params.product)
  return url.toString()
}

/**
 * Generate a QR code image URL for an arbitrary payload (URL, address, etc.)
 *
 * Uses api.qrserver.com — free, CORS-open, returns a PNG. The previous
 * `pay.one.ie/qr?address=&chain=` endpoint 404s; scanning a raw address
 * is also worse UX than scanning the full pay.one.ie checkout URL because
 * wallets do different things with bare addresses vs. URIs.
 */
export function getPaymentQRForData(data: string, size: number = 280): string {
  const base = 'https://api.qrserver.com/v1/create-qr-code/'
  const q = new URLSearchParams({
    size: `${size}x${size}`,
    data,
    margin: '4',
    bgcolor: 'ffffff', // white bg keeps wallet cameras happy
    color: '000000',
    qzone: '2',
  })
  return `${base}?${q.toString()}`
}

/**
 * Generate a QR code URL for a receive-address card. Encodes the full
 * pay.one.ie/pay URL so scanning opens a funded checkout, not a bare address.
 */
export function getPaymentQRUrl(address: string, chain: string = 'eth'): string {
  const payUrl = getPaymentUrl({ to: address, chain })
  return getPaymentQRForData(payUrl)
}

/**
 * Open payment window
 */
export function openPaymentWindow(url: string, title: string = 'pay_one_ie') {
  if (typeof window !== 'undefined') {
    return window.open(url, title, 'width=500,height=700')
  }
  return null
}

export default {
  configure,
  createEscrow,
  getEscrowStatus,
  createPaymentLink,
  createShortlink,
  generateWallet,
  deriveWallet,
  getBalance,
  getTransactions,
  getPrice,
  createProduct,
  getPaymentUrl,
  getPaymentQRUrl,
  openPaymentWindow,
  convertCurrency,
}
