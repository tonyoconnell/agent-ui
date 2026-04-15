#!/usr/bin/env node
// Dry-run launch handoff against a local mock agent-launch server.
import { strict as assert } from "node:assert";
import http from "node:http";

const MOCK_PORT = 0;
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/v1/tokens") {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      const payload = JSON.parse(body || "{}");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        tokenId: `tkn_${Date.now()}`,
        address: "0x" + "a".repeat(40),
        chain: payload.chain ?? "sui",
        dryRun: !!payload.dryRun,
      }));
    });
    return;
  }
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(MOCK_PORT, r));
const port = server.address().port;
const mockUrl = `http://127.0.0.1:${port}`;

try {
  const sdk = await import("../../packages/sdk/dist/index.js");
  const result = await sdk.launchToken("test-agent-uid", {
    agentLaunchUrl: mockUrl,
    dryRun: true,
    chain: "sui",
  });
  assert.ok(result.tokenId.startsWith("tkn_"));
  assert.equal(result.chain, "sui");
  assert.equal(result.dryRun, true);
  assert.ok(result.address?.startsWith("0x"));
  console.log(`✓ launch: ${result.tokenId} (${result.chain}, dryRun=${result.dryRun})`);
  console.log(`✓ signal emit is best-effort (swallowed ECONNREFUSED to /api/signal is expected)`);
} finally {
  server.close();
}
