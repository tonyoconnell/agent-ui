/**
 * tests/setup/index.ts — Re-exports all setup fixtures.
 */

export {
  DETERMINISTIC_SEED,
  createVirtualAuthenticator,
  setupWebAuthn,
  teardownWebAuthn,
  type VirtualAuthenticator,
} from './webauthn'
