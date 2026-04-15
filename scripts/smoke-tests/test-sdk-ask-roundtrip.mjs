#!/usr/bin/env node
// Sanity-check the SDK URL resolution + storage signature without requiring a live server.
// Real ask() roundtrip requires a running /api/ask endpoint + populated TypeDB;
// that's a live integration test, not a smoke test. This one just proves wiring.
import { strict as assert } from "node:assert";

const sdk = await import("../../packages/sdk/dist/index.js");

// URL resolution
const prod = sdk.PROD_API_URL;
const dev = sdk.DEV_API_URL;
assert.equal(typeof prod, "string");
assert.equal(typeof dev, "string");
assert.ok(sdk.getApiUrl().length > 0);

// Storage signatures
assert.equal(typeof sdk.storage.listStorage, "function");
assert.equal(typeof sdk.storage.getStorage, "function");
assert.equal(typeof sdk.storage.putStorage, "function");
assert.equal(typeof sdk.storage.deleteStorage, "function");

// Handoff
assert.equal(typeof sdk.validateEthAddress, "function");
assert.equal(typeof sdk.generateDeployLink, "function");
const link = sdk.generateDeployLink("agent-42", "https://one.ie");
assert.ok(link.includes("agent-42"));
assert.throws(() => sdk.validateEthAddress("not-eth"));
sdk.validateEthAddress("0x" + "1".repeat(40));

// Launch handoff
assert.equal(typeof sdk.launchToken, "function");

console.log("✓ SDK surface: URL resolution + storage + handoff + launch wired");
