#!/usr/bin/env node
// C3 smoke test: SubstrateClient from installed package → localhost:4321
// Run via: DOGFOOD_DIR=/tmp/dogfood-toolkit node scripts/smoke-tests/test-substrate-client-live.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";

const DOGFOOD_DIR = process.env.DOGFOOD_DIR ?? "/tmp/dogfood-toolkit";
const BASE_URL = process.env.ONE_BASE_URL ?? "http://localhost:4321";

const sdkIndexPath = path.join(DOGFOOD_DIR, "node_modules/@oneie/sdk/dist/index.js");
const sdkUrl = new URL(`file://${sdkIndexPath}`);

console.log("[test-substrate-client-live] importing from:", sdkIndexPath);

const sdk = await import(sdkUrl);

// 1. SubstrateClient is exported
if (typeof sdk.SubstrateClient !== "function") {
  throw new Error(`SubstrateClient is not a function — got ${typeof sdk.SubstrateClient}`);
}
console.log("✓ SubstrateClient exported from installed package");

// 2. Instantiate
const client = new sdk.SubstrateClient({ baseUrl: BASE_URL });
console.log("✓ SubstrateClient instantiated");

// 3. Verify all 12 methods present
const EXPECTED_METHODS = [
  "signal", "ask", "mark", "warn", "fade",
  "highways", "recall", "reveal", "forget",
  "frontier", "know", "select",
];
for (const method of EXPECTED_METHODS) {
  if (typeof client[method] !== "function") {
    throw new Error(`Missing method: ${method}`);
  }
}
console.log(`✓ All 12 methods present: ${EXPECTED_METHODS.join(", ")}`);

// 4. Call .ask() — should return a valid Outcome (dissolved or timeout are fine)
const T0 = Date.now();
const outcome = await client.ask("ping", undefined, 3000);
const latency = Date.now() - T0;

if (typeof outcome !== "object" || outcome === null) {
  throw new Error(`ask() returned non-object: ${JSON.stringify(outcome)}`);
}

// Must be one of the 4 Outcome branches
const hasResult = "result" in outcome;
const hasTimeout = "timeout" in outcome && outcome.timeout === true;
const hasDissolved = "dissolved" in outcome && outcome.dissolved === true;
const hasFailure = "failure" in outcome && outcome.failure === true;
if (!hasResult && !hasTimeout && !hasDissolved && !hasFailure) {
  throw new Error(`ask() Outcome has no discriminant: ${JSON.stringify(outcome)}`);
}
if (typeof outcome.latency !== "number") {
  throw new Error(`ask() Outcome missing latency field: ${JSON.stringify(outcome)}`);
}

const branch = hasResult ? "result" : hasTimeout ? "timeout" : hasDissolved ? "dissolved" : "failure";
console.log(`✓ ask("ping") → branch=${branch}  latency=${outcome.latency}ms  roundtrip=${latency}ms`);

// 5. Call .highways() — should return an object with highways array
const hw = await client.highways(5);
if (typeof hw !== "object" || hw === null || !Array.isArray(hw.highways)) {
  throw new Error(`highways() returned unexpected shape: ${JSON.stringify(hw)}`);
}
console.log(`✓ highways() → ${hw.highways.length} paths returned`);

// 6. SDK_VERSION exported
if (typeof sdk.SDK_VERSION !== "string" || sdk.SDK_VERSION !== "0.2.0") {
  throw new Error(`SDK_VERSION mismatch: got ${sdk.SDK_VERSION}`);
}
console.log(`✓ SDK_VERSION = ${sdk.SDK_VERSION}`);

console.log("\n[test-substrate-client-live] ALL CHECKS PASSED");
