/**
 * OBFUSCATION ONLY — not cryptographic encryption.
 * Uses XOR + base64 against a static key. Raises the bar for casual
 * inspection but provides no real security guarantee. Any UI that says
 * "encrypted" should say "obfuscated" instead.
 * For real encryption use crypto.subtle AES-GCM (see SecureKeyStorage.ts).
 */

const KEY = 'ONE-PLATFORM-2025'

function obfuscate(value: string): string {
  return btoa(
    value
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length)))
      .join(''),
  )
}

function deobfuscate(value: string): string {
  return atob(value)
    .split('')
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length)))
    .join('')
}

export function secureSetItem(key: string, value: string): void {
  localStorage.setItem(key, obfuscate(value))
}

export function secureGetItem(key: string): string | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return deobfuscate(raw)
  } catch {
    return null
  }
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return ''
    return parsed.toString()
  } catch {
    return ''
  }
}

export function maskSensitive(value: string): string {
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '•'.repeat(value.length - 8) + value.slice(-4)
}
