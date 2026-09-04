// Fixture: orphan export that should be found by S1
// This export is not imported anywhere in src/
//
// IMPORTANT: This file lives in __fixtures__/, NOT in src/.
// S1 scopes to src/ only, so it will NOT find this symbol.
// That is the expected behaviour — use this file to verify scope:
//
//   If S1 reports _orphanTestHelper → scope is wrong (scanning outside src/)
//   If S1 does not report it        → scope is correct ✓
export function _orphanTestHelper() {
  return 'this should be flagged by compress S1 only if it were in src/'
}
