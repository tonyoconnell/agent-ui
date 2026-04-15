import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export function sanitizeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
    return url
  } catch {
    return undefined
  }
}

export function maskSensitive(value: string, showChars = 4): string {
  if (value.length <= showChars * 2) return '***'
  return `${value.slice(0, showChars)}***${value.slice(-showChars)}`
}
