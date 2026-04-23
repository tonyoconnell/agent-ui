import type { Ciphertext, IV, CredId } from "../types-crypto"

export interface ServerBackupPayload {
  credId: string          // hex-encoded credential ID
  iv: string              // base64
  ciphertext: string      // base64
  version: 1
}

// Write a server-held duplicate ciphertext (atomic with largeBlob write)
// POST /api/wallet/wrap — requires Better Auth session
export declare function uploadBackup(
  credId: CredId,
  iv: IV,
  ciphertext: Ciphertext
): Promise<void>

// Delete a server backup entry (for revoke)
// DELETE /api/wallet/wrap/:credId
export declare function deleteBackup(credId: CredId): Promise<void>
