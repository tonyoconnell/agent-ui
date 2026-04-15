/**
 * Brand chrome helpers — pure functions that adapt a BrandTokens primary
 * HSL triple into channel-specific shapes:
 *
 *   Discord:  24-bit int (0xRRGGBB) for embeds[].color
 *   Telegram: bucket emoji (8 hue buckets) for an inline divider prefix
 *
 * Input shape matches the 6-token contract (src/engine/brand.ts):
 *   { primary: { light: "280 100% 60%", dark: "280 100% 60%" }, ... }
 *
 * Zero runtime deps. Both functions accept the raw HSL string to keep
 * nanoclaw workers free of any TypeDB dependency at chrome time.
 */

export function hslStringToRgbInt(hsl: string): number {
  const [h, sPct, lPct] = hsl
    .trim()
    .split(/\s+/)
    .map((x) => Number.parseFloat(x))
  const s = (sPct || 0) / 100
  const l = (lPct || 0) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = ((h || 0) / 60) % 6
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const R = Math.round((r + m) * 255)
  const G = Math.round((g + m) * 255)
  const B = Math.round((b + m) * 255)
  return (R << 16) | (G << 8) | B
}

export function embedColorFor(primaryHsl: string): number {
  return hslStringToRgbInt(primaryHsl)
}

const HUE_BUCKETS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'] as const

export function telegramTintFor(primaryHsl: string): string {
  const [h, , lPct] = primaryHsl
    .trim()
    .split(/\s+/)
    .map((x) => Number.parseFloat(x))
  const l = lPct || 50
  if (l < 10) return '⚫'
  if (l > 90) return '⚪'
  const hue = (((h || 0) % 360) + 360) % 360
  if (hue < 15 || hue >= 345) return HUE_BUCKETS[0]
  if (hue < 45) return HUE_BUCKETS[1]
  if (hue < 75) return HUE_BUCKETS[2]
  if (hue < 165) return HUE_BUCKETS[3]
  if (hue < 255) return HUE_BUCKETS[4]
  if (hue < 345) return HUE_BUCKETS[5]
  return HUE_BUCKETS[0]
}
