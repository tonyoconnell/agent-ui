#!/usr/bin/env node
// Guardrail: ensure no mint/token-launch code landed in packages/ or cli/src/commands/.
// Allowed: documentation, agent-launch URLs, `launch` verb (handoff to agent-launch).
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BANNED = [
  /\btokenize\b/i,
  /\bbonding[- ]?curve\b/i,
  /\bbuyToken\b/,
  /\bsellToken\b/,
  /\btokenHolders\b/,
  /\bERC[- ]?20\b/i,
  /from ["']@cosmjs\//,
  /from ["']ethers["']/,
  /import .* from ["']bech32["']/,
];

const ROOTS = ["packages/sdk/src", "packages/mcp/src", "packages/templates/src", "cli/src/commands"];

let hits = 0;
for (const root of ROOTS) {
  let files = [];
  try {
    files = execSync(`find ${root} -type f -name '*.ts'`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  } catch { continue; }
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const rx of BANNED) {
      if (rx.test(src)) {
        console.error(`✗ ${f} matches ${rx}`);
        hits++;
      }
    }
  }
}

if (hits === 0) {
  console.log("✓ no-mint-code: 0 banned terms in packages/ + cli/src/commands/");
  process.exit(0);
} else {
  console.error(`✗ no-mint-code: ${hits} banned hits`);
  process.exit(1);
}
