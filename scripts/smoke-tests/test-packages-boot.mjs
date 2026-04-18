#!/usr/bin/env node
// Cycle 2 smoke: all three @oneie/* packages load and expose expected surface.
import { strict as assert } from "node:assert";

const sdk = await import("../../packages/sdk/dist/index.js");
assert.equal(sdk.SDK_VERSION, "0.2.0");
assert.equal(typeof sdk.launchToken, "function");
assert.equal(typeof sdk.generateDeployLink, "function");
assert.equal(typeof sdk.validateEthAddress, "function");
assert.equal(typeof sdk.getApiUrl, "function");
assert.ok(sdk.storage && typeof sdk.storage.listStorage === "function");
assert.equal(typeof sdk.SubstrateClient, "function", "SubstrateClient must be exported");
assert.equal(typeof sdk.telemetryEmit, "function", "telemetryEmit must be exported");

const tpl = await import("../../packages/templates/dist/index.js");
assert.equal(tpl.TEMPLATES_VERSION, "0.2.0");
const presets = tpl.listPresets();
assert.equal(presets.length, 30, `expected 30 presets, got ${presets.length}`);
const csuite = ["ceo", "cto", "cfo", "coo", "cro"];
for (const r of csuite) assert.ok(tpl.getPreset(r), `missing preset: ${r}`);
// New presets
for (const r of ["tutor", "researcher", "concierge", "data-analyst"]) {
  assert.ok(tpl.getPreset(r), `missing new preset: ${r}`);
}
assert.equal(typeof tpl.buildTeam, "function", "buildTeam must be exported");
assert.equal(typeof tpl.buildWorld, "function", "buildWorld must be exported");
const marketingTeam = tpl.buildTeam("marketing", 5);
assert.equal(marketingTeam.length, 5, `buildTeam('marketing', 5) must return 5 agents`);

const mcp = await import("../../packages/mcp/dist/index.js");
assert.equal(mcp.MCP_VERSION, "0.1.0");
assert.equal(mcp.MCP_TOOLS.substrate.length, 12);
assert.equal(mcp.MCP_TOOLS.discovery.length, 3);
const router = mcp.createRouter();
assert.ok(router && typeof router.call === "function");

console.log(`✓ @oneie/sdk — 0.2.0 (SubstrateClient + telemetry)`);
console.log(`✓ @oneie/templates — 0.2.0 (${presets.length} presets, buildTeam, buildWorld)`);
console.log(`✓ @oneie/mcp — 0.1.0 (${mcp.MCP_TOOLS.substrate.length} substrate + ${mcp.MCP_TOOLS.discovery.length} discovery)`);
