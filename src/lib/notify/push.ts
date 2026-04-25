/**
 * Web Push via VAPID — manual VAPID JWT, no SDK dependency.
 *
 * Required env:
 *   VAPID_PUBLIC_KEY   — base64url-encoded P-256 public key
 *   VAPID_PRIVATE_KEY  — base64url-encoded P-256 private key
 *   VAPID_EMAIL        — mailto: contact for the push service
 */

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, unknown>
}

/** Encode a string as Uint8Array<ArrayBuffer> for use with SubtleCrypto. */
function encodeStr(s: string): Uint8Array<ArrayBuffer> {
  const raw = new TextEncoder().encode(s)
  const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer
  return new Uint8Array(buf)
}

/** Build a VAPID Authorization header using the Web Crypto API. */
async function buildVapidAuth(endpoint: string): Promise<string> {
  const publicKey = (typeof process !== 'undefined' && process.env?.VAPID_PUBLIC_KEY) ? process.env.VAPID_PUBLIC_KEY : undefined
  const privateKey = (typeof process !== 'undefined' && process.env?.VAPID_PRIVATE_KEY) ? process.env.VAPID_PRIVATE_KEY : undefined
  const email = (typeof process !== 'undefined' && process.env?.VAPID_EMAIL) ? process.env.VAPID_EMAIL : undefined

  if (!publicKey || !privateKey || !email) {
    throw new Error('VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL must be set')
  }

  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60 // 12 hours

  // Build unsigned JWT header + payload (base64url, no padding)
  const header = base64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const payload = base64url(
    JSON.stringify({
      aud: audience,
      exp: expiry,
      sub: email.startsWith('mailto:') ? email : `mailto:${email}`,
    }),
  )

  const unsignedToken = `${header}.${payload}`

  // Import private key (PKCS8 base64url → CryptoKey)
  const pkcs8 = base64urlToBuffer(privateKey)
  const cryptoKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'sign',
  ])

  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, encodeStr(unsignedToken))

  const token = `${unsignedToken}.${bufferToBase64url(signature)}`
  return `vapid t=${token},k=${publicKey}`
}

/** Encrypt push payload using the Web Push encryption spec (RFC 8291). */
async function encryptPayload(
  subscription: PushSubscription,
  payloadStr: string,
): Promise<{ ciphertext: ArrayBuffer; salt: Uint8Array; serverPublicKey: ArrayBuffer }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Generate ephemeral server key pair (P-256)
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey',
    'deriveBits',
  ])

  // Import client public key (p256dh)
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    base64urlToBuffer(subscription.keys.p256dh),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )

  // ECDH shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256,
  )

  // Auth secret
  const authSecret = base64urlToBuffer(subscription.keys.auth)

  // Export server public key
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)

  // HKDF to derive content encryption key and nonce
  // TypeScript 6 requires Uint8Array<ArrayBuffer> for subtle crypto — use explicit ArrayBuffer slice.
  const toFixed = (ab: ArrayBuffer): Uint8Array<ArrayBuffer> => new Uint8Array(ab.slice(0))
  const saltFixed = toFixed(salt.buffer as ArrayBuffer)
  const authSecretFixed = toFixed(authSecret)
  const sharedSecretFixed = toFixed(sharedSecret)
  const serverPublicKeyFixed = toFixed(serverPublicKeyRaw)
  const clientPublicKeyFixed = toFixed(base64urlToBuffer(subscription.keys.p256dh))
  const emptyBuf = toFixed(new ArrayBuffer(0))

  const ikm = await hkdf(
    sharedSecretFixed,
    authSecretFixed,
    buildInfo('Content-Encoding: auth\0', emptyBuf, emptyBuf),
    32,
  )

  const contentEncryptionKey = await hkdf(
    ikm,
    saltFixed,
    buildInfo('Content-Encoding: aesgcm\0', clientPublicKeyFixed, serverPublicKeyFixed),
    16,
  )

  const nonce = await hkdf(
    ikm,
    saltFixed,
    buildInfo('Content-Encoding: nonce\0', clientPublicKeyFixed, serverPublicKeyFixed),
    12,
  )

  const aesKey = await crypto.subtle.importKey('raw', contentEncryptionKey, { name: 'AES-GCM' }, false, ['encrypt'])

  // Pad payload with 2-byte zero prefix (padding length = 0)
  const plaintextRaw = encodeStr(payloadStr)
  const paddedBuf = new ArrayBuffer(plaintextRaw.length + 2)
  const padded = new Uint8Array(paddedBuf)
  padded.set(plaintextRaw, 2) // first 2 bytes = 0 (padding length)

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded)

  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw }
}

function buildInfo(
  encoding: string,
  clientPublicKey: Uint8Array<ArrayBuffer>,
  serverPublicKey: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  const encRaw = encodeStr(encoding)
  const totalLen = encRaw.length + 2 + clientPublicKey.length + 2 + serverPublicKey.length
  const resultBuf = new ArrayBuffer(totalLen)
  const result = new Uint8Array(resultBuf)
  let offset = 0
  result.set(encRaw, offset)
  offset += encRaw.length
  result[offset++] = clientPublicKey.length >> 8
  result[offset++] = clientPublicKey.length & 0xff
  result.set(clientPublicKey, offset)
  offset += clientPublicKey.length
  result[offset++] = serverPublicKey.length >> 8
  result[offset++] = serverPublicKey.length & 0xff
  result.set(serverPublicKey, offset)
  return result
}

async function hkdf(
  ikm: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  length: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, baseKey, length * 8)
  return new Uint8Array(bits)
}

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlToBuffer(b64: string): ArrayBuffer {
  const padded = b64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const buffer = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i)
  return buffer.buffer
}

function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Send a Web Push notification to a browser subscription.
 *
 * Uses manual VAPID JWT + AES-GCM payload encryption — no SDK required.
 * Throws if the push service returns a non-2xx status.
 */
export async function sendPush(subscription: PushSubscription, payload: PushPayload): Promise<void> {
  const publicKey = (typeof process !== 'undefined' && process.env?.VAPID_PUBLIC_KEY) ? process.env.VAPID_PUBLIC_KEY : undefined
  if (!publicKey) throw new Error('VAPID_PUBLIC_KEY is not set')

  const payloadStr = JSON.stringify(payload)
  const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription, payloadStr)
  const vapidAuth = await buildVapidAuth(subscription.endpoint)

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuth,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      Encryption: `salt=${bufferToBase64url(salt.buffer as ArrayBuffer)}`,
      'Crypto-Key': `dh=${bufferToBase64url(serverPublicKey)};p256ecdsa=${publicKey}`,
      TTL: '86400',
    },
    body: ciphertext,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Push failed: ${response.status} ${response.statusText} — ${text}`)
  }
}
