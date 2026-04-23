/**
 * Two-oracle consensus for SUI/USD price.
 *
 * Rejects if:
 *   (1) feeds deviate >2% from each other, or
 *   (2) any feed is stale >60s
 *
 * Single-feed fallback: if one oracle is unavailable the other is used,
 * provided it passes the staleness check. This keeps the system functional
 * during partial outages while still rejecting stale data.
 */

export interface OracleReading {
  price: number      // USD per SUI
  timestamp: number  // epoch ms when fetched
  source: string
}

export const STALENESS_MS = 60_000   // 60s
export const MAX_DEVIATION = 0.02    // 2%

// Pyth Network SUI/USD price feed ID (mainnet)
const PYTH_FEED_ID =
  "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744"

/**
 * Fetch price from Pyth Network (primary oracle).
 * Uses Hermes REST API — no API key required.
 */
export async function fetchPyth(): Promise<OracleReading> {
  const url =
    `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_FEED_ID}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`oracle: Pyth HTTP ${res.status}`)
  }
  const json = await res.json() as {
    parsed: Array<{
      price: { price: string; expo: number; publish_time: number }
    }>
  }

  const parsed = json.parsed?.[0]
  if (!parsed) throw new Error("oracle: Pyth response missing parsed data")

  const { price: rawPrice, expo, publish_time } = parsed.price
  // rawPrice is an integer string; actual price = rawPrice * 10^expo
  const price = Number(rawPrice) * Math.pow(10, expo)
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`oracle: Pyth returned invalid price ${rawPrice}e${expo}`)
  }

  return {
    price,
    timestamp: publish_time * 1000, // Pyth returns seconds → convert to ms
    source: "pyth",
  }
}

/**
 * Fetch price from CoinGecko (secondary oracle, no API key needed).
 * Uses the free public endpoint; timestamp is the local fetch time.
 */
export async function fetchCoinGecko(): Promise<OracleReading> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_last_updated_at=true"
  const fetchedAt = Date.now()
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`oracle: CoinGecko HTTP ${res.status}`)
  }
  const json = await res.json() as {
    sui?: { usd: number; last_updated_at?: number }
  }

  const data = json.sui
  if (!data || typeof data.usd !== "number") {
    throw new Error("oracle: CoinGecko response missing sui.usd")
  }

  // CoinGecko provides last_updated_at (seconds). Use it when available;
  // fall back to fetch time (conservative — may trigger staleness faster).
  const timestamp = data.last_updated_at
    ? data.last_updated_at * 1000
    : fetchedAt

  return {
    price: data.usd,
    timestamp,
    source: "coingecko",
  }
}

/**
 * Get consensus SUI/USD price.
 *
 * Algorithm:
 *   1. Fetch both oracles in parallel (allSettled — partial failure OK).
 *   2. Reject any reading that is stale (> STALENESS_MS old).
 *   3. If both readings are fresh, reject if they deviate > MAX_DEVIATION.
 *   4. Return the average of all fresh readings (1 or 2).
 *
 * Throws if: no feeds available, any feed stale, or feeds diverge >2%.
 */
export async function getConsensusSuiPrice(): Promise<number> {
  const [pythResult, geckoResult] = await Promise.allSettled([
    fetchPyth(),
    fetchCoinGecko(),
  ])

  const readings: OracleReading[] = []
  if (pythResult.status === "fulfilled") readings.push(pythResult.value)
  if (geckoResult.status === "fulfilled") readings.push(geckoResult.value)

  if (readings.length === 0) {
    throw new Error("oracle: no price feeds available")
  }

  // Staleness check — any stale feed is fatal
  const now = Date.now()
  for (const r of readings) {
    const ageMs = now - r.timestamp
    if (ageMs > STALENESS_MS) {
      throw new Error(
        `oracle: feed ${r.source} stale (${Math.round(ageMs / 1000)}s old, limit ${STALENESS_MS / 1000}s)`
      )
    }
  }

  // Deviation check — only applicable when both feeds are present
  if (readings.length === 2) {
    const [a, b] = readings
    const deviation = Math.abs(a.price - b.price) / a.price
    if (deviation > MAX_DEVIATION) {
      throw new Error(
        `oracle: feeds deviate ${(deviation * 100).toFixed(2)}% > ${(MAX_DEVIATION * 100).toFixed(0)}%` +
        ` (${a.source}=${a.price.toFixed(4)}, ${b.source}=${b.price.toFixed(4)})`
      )
    }
  }

  // Consensus = average of all fresh readings
  const sum = readings.reduce((acc, r) => acc + r.price, 0)
  return sum / readings.length
}

/**
 * Convert a MIST amount (smallest SUI unit, 10^-9 SUI) to USD.
 *
 * @param mist - Amount in MIST (bigint)
 * @param priceUsd - SUI/USD price from getConsensusSuiPrice()
 * @returns USD value as a floating-point number
 */
export function mistToUsd(mist: bigint, priceUsd: number): number {
  return Number(mist) / 1e9 * priceUsd
}
