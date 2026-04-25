/**
 * kek.ts — Tenant Key Encryption Key (KEK) management
 *
 * Each group gets a random AES-256-GCM KEK, stored encrypted under MASTER_KEK in TypeDB.
 * Crypto-shred: deleting the tenant-kek entity renders all encrypted signal data unreadable.
 *
 * MASTER_KEK: env var (32 bytes base64). Never log or expose.
 */

import { readParsed, write } from '@/lib/typedb'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBuffer(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const ab = new ArrayBuffer(binary.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return view
}

async function getMasterKEK(): Promise<CryptoKey> {
  const raw = (typeof process !== 'undefined' && process.env?.MASTER_KEK) ? process.env.MASTER_KEK : undefined
  if (!raw) throw new Error('MASTER_KEK env var not set')
  const bytes = base64ToBuffer(raw)
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/** Retrieve or create the tenant KEK for a group. Cached in-process. */
const KEK_CACHE = new Map<string, CryptoKey>()

async function getTenantKEK(groupId: string): Promise<CryptoKey> {
  const cached = KEK_CACHE.get(groupId)
  if (cached) return cached

  const masterKEK = await getMasterKEK()
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  // Try to load existing KEK from TypeDB
  const rows = await readParsed(
    `match $k isa tenant-kek, has group-id "${esc(groupId)}", has kek-ciphertext $ct, has kek-iv $iv; select $ct, $iv;`,
  ).catch(() => [])

  if (rows.length > 0) {
    const ct = base64ToBuffer(rows[0].ct as string)
    const iv = base64ToBuffer(rows[0].iv as string)
    const rawKEK = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, masterKEK, ct)
    const kek = await crypto.subtle.importKey('raw', rawKEK, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    KEK_CACHE.set(groupId, kek)
    return kek
  }

  // Generate new random KEK for this group
  const rawKEK = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, masterKEK, rawKEK)

  await write(`insert $k isa tenant-kek,
    has group-id "${esc(groupId)}",
    has kek-iv "${bufferToBase64(iv)}",
    has kek-ciphertext "${bufferToBase64(new Uint8Array(ct))}";`)

  const kek = await crypto.subtle.importKey('raw', rawKEK, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  KEK_CACHE.set(groupId, kek)
  return kek
}

/** Encrypt data for a group. Returns "ENC:<iv_b64>:<ct_b64>" prefix string. */
export async function encryptForGroup(groupId: string, plaintext: string): Promise<string> {
  const kek = await getTenantKEK(groupId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, encoder.encode(plaintext))
  return `ENC:${bufferToBase64(iv)}:${bufferToBase64(new Uint8Array(ct))}`
}

/** Decrypt a "ENC:<iv>:<ct>" string. Throws if KEK has been shredded. */
export async function decryptForGroup(groupId: string, encrypted: string): Promise<string> {
  if (!encrypted.startsWith('ENC:')) throw new Error('Not an encrypted value')
  const [, ivB64, ctB64] = encrypted.split(':')
  const kek = await getTenantKEK(groupId)
  const iv = base64ToBuffer(ivB64)
  const ct = base64ToBuffer(ctB64)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, ct)
  return decoder.decode(plain)
}

/** Crypto-shred: delete tenant KEK from TypeDB. Ciphertext becomes permanently unreadable. */
export async function shredGroup(groupId: string): Promise<void> {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  KEK_CACHE.delete(groupId)
  await write(`match $k isa tenant-kek, has group-id "${esc(groupId)}"; delete $k isa tenant-kek;`).catch(() => {}) // Silent if no KEK exists (group never had private signals)
}

/** Compute SHA-256 Merkle root of an array of strings (sorted, then recursively halved). */
export async function computeMerkle(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return ''
  const sorted = [...leaves].sort()
  let hashes: Uint8Array[] = await Promise.all(
    sorted.map(async (l) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(l)))),
  )
  while (hashes.length > 1) {
    const next: Uint8Array[] = []
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i]
      const right = hashes[i + 1] ?? left // Odd leaf: duplicate
      const combined = new Uint8Array(left.length + right.length)
      combined.set(left)
      combined.set(right, left.length)
      next.push(new Uint8Array(await crypto.subtle.digest('SHA-256', combined)))
    }
    hashes = next
  }
  return bufferToBase64(hashes[0])
}
