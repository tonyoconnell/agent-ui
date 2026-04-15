const encoder = new TextEncoder()

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBuffer(b64: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
}

export async function deriveKEK(sessionToken: string, userId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(sessionToken), 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(`one-secrets-v1:${userId}`),
      info: encoder.encode('one-user-secrets'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptSecret(
  value: string,
  sessionToken: string,
  userId: string,
): Promise<{ iv: string; ciphertext: string }> {
  const kek = await deriveKEK(sessionToken, userId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, new Uint8Array(encoder.encode(value)))
  return { iv: bufferToBase64(iv), ciphertext: bufferToBase64(ciphertext) }
}

export async function decryptSecret(
  encrypted: { iv: string; ciphertext: string },
  sessionToken: string,
  userId: string,
): Promise<string> {
  const kek = await deriveKEK(sessionToken, userId)
  const iv = base64ToBuffer(encrypted.iv)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, base64ToBuffer(encrypted.ciphertext))
  return new TextDecoder().decode(plaintext)
}
