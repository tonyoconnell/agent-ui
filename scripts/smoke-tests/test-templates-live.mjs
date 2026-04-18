#!/usr/bin/env node
// C3 smoke test: @oneie/templates from installed package
// Run via: DOGFOOD_DIR=/tmp/dogfood-toolkit node scripts/smoke-tests/test-templates-live.mjs

import fs from "node:fs";
import path from "node:path";

const DOGFOOD_DIR = process.env.DOGFOOD_DIR ?? "/tmp/dogfood-toolkit";
const GENERATED_DIR = path.join(DOGFOOD_DIR, "generated-world");

const templatesIndexPath = path.join(DOGFOOD_DIR, "node_modules/@oneie/templates/dist/index.js");
const templatesUrl = new URL(`file://${templatesIndexPath}`);

console.log("[test-templates-live] importing from:", templatesIndexPath);

const templates = await import(templatesUrl);

// 1. listPresets is exported
if (typeof templates.listPresets !== "function") {
  throw new Error(`listPresets is not a function — got ${typeof templates.listPresets}`);
}
console.log("✓ listPresets exported from installed package");

// 2. Exactly 30 presets
const presets = templates.listPresets();
if (!Array.isArray(presets)) {
  throw new Error(`listPresets() returned non-array: ${typeof presets}`);
}
if (presets.length !== 30) {
  throw new Error(`Expected 30 presets, got ${presets.length}. List: ${presets.map(p => p.name ?? p).join(", ")}`);
}
console.log(`✓ listPresets() → ${presets.length} presets`);

// 3. buildTeam is exported
if (typeof templates.buildTeam !== "function") {
  throw new Error(`buildTeam is not a function — got ${typeof templates.buildTeam}`);
}
console.log("✓ buildTeam exported from installed package");

// 4. buildTeam('marketing', 5) returns 5 items
const marketingTeam = templates.buildTeam("marketing", 5);
if (!Array.isArray(marketingTeam)) {
  throw new Error(`buildTeam returned non-array: ${typeof marketingTeam}`);
}
if (marketingTeam.length !== 5) {
  throw new Error(`Expected 5 marketing agents, got ${marketingTeam.length}`);
}
console.log(`✓ buildTeam('marketing', 5) → ${marketingTeam.length} agents`);

// 5. Each result has markdown content
for (const item of marketingTeam) {
  if (typeof item.markdown !== "string" || !item.markdown.includes("---")) {
    throw new Error(`buildTeam result missing markdown frontmatter: ${JSON.stringify(item).slice(0, 100)}`);
  }
}
console.log("✓ All 5 agents have valid markdown frontmatter");

// 6. Write generated world to /tmp/dogfood-toolkit/generated-world/
fs.mkdirSync(GENERATED_DIR, { recursive: true });
for (const item of marketingTeam) {
  const agentName = (item.name ?? item.agentName ?? `agent-${marketingTeam.indexOf(item)}`).toLowerCase().replace(/\s+/g, "-");
  const filePath = path.join(GENERATED_DIR, `${agentName}.md`);
  fs.writeFileSync(filePath, item.markdown, "utf8");
}
const written = fs.readdirSync(GENERATED_DIR).filter(f => f.endsWith(".md"));
if (written.length < 5) {
  throw new Error(`Expected ≥5 .md files in generated-world/, got ${written.length}`);
}
console.log(`✓ ${written.length} agent files written to ${GENERATED_DIR}`);
console.log("  Files:", written.join(", "));

// 7. buildWorld is exported
if (typeof templates.buildWorld !== "function") {
  throw new Error(`buildWorld is not a function — got ${typeof templates.buildWorld}`);
}
console.log("✓ buildWorld exported from installed package");

// 8. TEMPLATES_VERSION
if (typeof templates.TEMPLATES_VERSION !== "string" || templates.TEMPLATES_VERSION !== "0.2.0") {
  throw new Error(`TEMPLATES_VERSION mismatch: got ${templates.TEMPLATES_VERSION}`);
}
console.log(`✓ TEMPLATES_VERSION = ${templates.TEMPLATES_VERSION}`);

console.log("\n[test-templates-live] ALL CHECKS PASSED");
