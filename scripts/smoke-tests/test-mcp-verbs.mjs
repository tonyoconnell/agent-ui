#!/usr/bin/env node
// Boot MCP router, assert all 12 substrate + 3 discovery tools register.
import { strict as assert } from "node:assert";

const mcp = await import("../../packages/mcp/dist/index.js");
const router = mcp.createOneRouter();

const expectedSubstrate = ["signal", "ask", "mark", "warn", "fade", "select", "recall", "reveal", "forget", "frontier", "know", "highways"];
const expectedDiscovery = ["scaffold_agent", "list_agents", "get_agent"];

for (const name of expectedSubstrate) {
  const tool = router.tools.get(name);
  assert.ok(tool, `missing substrate tool: ${name}`);
  assert.equal(typeof tool.handler, "function");
  assert.ok(tool.inputSchema, `${name} missing inputSchema`);
}
for (const name of expectedDiscovery) {
  assert.ok(router.tools.get(name), `missing discovery tool: ${name}`);
}

// Discovery doesn't need network — call list_agents and get_agent.
const presets = await router.call("list_agents", {});
assert.ok(Array.isArray(presets), "list_agents must return array");
assert.ok(presets.length >= 16, `expected >=16 presets, got ${presets.length}`);
const ceo = await router.call("get_agent", { name: "ceo" });
assert.ok(ceo && ceo.name === "ceo");

// scaffold_agent renders a markdown file.
const scaffold = await router.call("scaffold_agent", { preset: "ceo", name: "exec-01" });
assert.ok(scaffold.markdown.includes("name: exec-01"));
assert.equal(scaffold.filename, "exec-01.md");

console.log(`✓ MCP: ${router.tools.size} tools registered (${expectedSubstrate.length} substrate + ${expectedDiscovery.length} discovery)`);
console.log(`✓ discovery: list_agents returned ${presets.length} presets`);
console.log(`✓ discovery: scaffold_agent rendered ${scaffold.filename}`);
