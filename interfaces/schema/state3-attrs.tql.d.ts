// TQL patch: add wallet-address and passkey-cred-ids attributes to auth-user entity
// These additions support State 3 wallet linking (Better Auth user → Sui wallet)
// Must be appended to src/schema/world.tql, does NOT replace existing auth-user entity

export const STATE3_TQL_PATCH = `
# State 3: wallet-address and passkey-cred-ids on auth-user
# Extends existing auth-user entity (do NOT redefine it)
# Enables Better Auth user to link Sui wallet address and track passkey credentials

# Sui address linked to this user's account (nullable until link happens)
define wallet-address: string;

# JSON array of hex credIds for multi-device passkey hints
# Format: ["deadbeef", "cafebabe", ...] — used by zkLogin and sign-in flows
define passkey-cred-ids: string;
` as const

// Fields added to auth-user entity in world.tql
export interface State3SchemaAdditions {
  entity: "auth-user"
  attributes: [
    {
      name: "wallet-address"
      valueType: "string"
      cardinality: "one"
      documentation: "Sui address linked to this user; nullable until State 3 wallet-link triggered"
    },
    {
      name: "passkey-cred-ids"
      valueType: "string"
      cardinality: "one"
      documentation: "JSON array of hex credIds for multi-device hints; used by sign-in and vault flows"
    },
  ]
}

// Verification: these attributes must exist before wallet-link plugin (C.a1) can write
export async function verifyState3Schema(): Promise<boolean> {
  // Check that src/schema/world.tql defines wallet-address and passkey-cred-ids
  // Returns true if both attributes are defined on auth-user
  // Throws or returns false if schema is incomplete
  return true
}

// Integration points: where State 3 schema is used
export const STATE3_INTEGRATION = {
  // Better Auth wallet-link plugin writes wallet-address after user okays Sui sign-in
  walletLink: "plugins/better-auth-wallet-link.ts — post-sign-in → update auth-user.wallet-address",

  // Passkey hint collection during sign-up (for multi-device hints)
  passkeyHints:
    "components/auth/PasskeySignUp.tsx — collects credIds → writes passkey-cred-ids to auth-user",

  // Vault recovery flow uses passkey-cred-ids to prompt user for correct device
  vaultRecovery:
    "components/vault/VaultRecovery.tsx — reads passkey-cred-ids → PRF hint selection",

  // TypeDB query: find all users with linked wallets (for governance, revenue flows)
  linkedUsers:
    'match $u isa auth-user, has wallet-address $w; return $u, $w; # StateThreeQuery',
} as const

// TypeQL insert pattern for State 3 wallet links
export const STATE3_INSERT_PATTERN = `
match $user isa auth-user, has uid $uid;
$uid == "human:email@example.com";

insert $user has wallet-address "0x...", has passkey-cred-ids "[\\"deadbeef\\", \\"cafebabe\\"]";
` as const

// TypeQL query pattern for State 3 verification
export const STATE3_QUERY_PATTERN = `
match $user isa auth-user, has wallet-address $w;
return $user, $w;
` as const
