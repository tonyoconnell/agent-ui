/**
 * Tier 0 type vocabulary for wallet-v2 session & identity primitives
 * Branded types for safety, minimal core shapes
 */

// Session and identity primitives
export type Sid = string & { readonly _brand: "Sid" } // chat session id
export type Cursor = string & { readonly _brand: "Cursor" } // resumable chat cursor
export type Uid = string & { readonly _brand: "Uid" } // actor uid (e.g. "human:alice")

// Better Auth user shape (minimal, extend as needed)
export interface BetterAuthUser {
  id: string
  email: string | null
  name: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

// TypeDB unit shape (substrate actor)
export interface Unit {
  uid: Uid
  name: string
  model?: string
  tags: string[]
  wallet?: string // Sui address if assigned
}

// TypeDB membership shape
export interface Membership {
  groupId: string
  memberId: Uid
  role: "chairman" | "board" | "ceo" | "operator" | "agent" | "auditor"
}
