#!/usr/bin/env node
/**
 * Auth hardening smoke test.
 *
 * Deliberately forces session replacement on TypeDB Cloud by signing in
 * multiple times from outside, then verifies both the CF gateway AND the
 * local Astro dev server (via Better Auth adapter) recover via 401-retry.
 *
 * Requires:
 *   - Local dev server at http://localhost:4321
 *   - TYPEDB_URL/USERNAME/PASSWORD in .env
 *
 * Steps:
 *   1. Read creds from .env
 *   2. Baseline: prove both paths work (gateway + local signal)
 *   3. Force 3× direct signins (simulates session replacement)
 *   4. Verify: both paths STILL work — proves 401-retry self-heal
 *   5. Soak: 10 signals back-to-back, no failures
 */

import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const GATEWAY = "https://api.one.ie";
const LOCAL = "http://localhost:4321";

function readEnv() {
  const raw = readFileSync(".env", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function directSignin(env) {
  const res = await fetch(`${env.TYPEDB_URL}/v1/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: env.TYPEDB_USERNAME, password: env.TYPEDB_PASSWORD }),
  });
  if (!res.ok) throw new Error(`signin ${res.status}`);
  const { token } = await res.json();
  return token;
}

async function gatewayQuery() {
  const res = await fetch(`${GATEWAY}/typedb/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "match $u isa unit; select $u; limit 1;",
      transactionType: "read",
    }),
  });
  return { status: res.status, ok: res.ok, body: await res.text() };
}

async function localSignal() {
  const res = await fetch(`${LOCAL}/api/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: "test-auth-hardening",
      receiver: "copy-toolkit",
      data: "auth-smoke",
      task: "test",
    }),
  });
  return { status: res.status, ok: res.ok, body: await res.text() };
}

const env = readEnv();
assert.ok(env.TYPEDB_URL, "TYPEDB_URL missing from .env");
assert.ok(env.TYPEDB_USERNAME, "TYPEDB_USERNAME missing from .env");
assert.ok(env.TYPEDB_PASSWORD, "TYPEDB_PASSWORD missing from .env");

console.log("=== 1. Baseline ===");
const g0 = await gatewayQuery();
console.log(`  gateway/typedb/query  status=${g0.status}  ok=${g0.ok}`);
assert.ok(g0.ok, `baseline gateway must be green (got ${g0.status})`);

const l0 = await localSignal();
console.log(`  local/api/signal      status=${l0.status}  ok=${l0.ok}`);
assert.ok(l0.ok, `baseline local signal must be green (got ${l0.status} — is dev server running?)`);

console.log();
console.log("=== 2. Force session replacement (3× direct signin) ===");
for (let i = 1; i <= 3; i++) {
  const tok = await directSignin(env);
  console.log(`  signin #${i}  got JWT len=${tok.length}`);
}

console.log();
console.log("=== 3. Self-heal via 401-retry ===");
const g1 = await gatewayQuery();
console.log(`  gateway/typedb/query  status=${g1.status}  ok=${g1.ok}`);
assert.ok(g1.ok, `gateway MUST recover from 401 via retry (got ${g1.status})`);

const l1 = await localSignal();
console.log(`  local/api/signal      status=${l1.status}  ok=${l1.ok}`);
assert.ok(l1.ok, `local signal MUST recover from 401 via retry (got ${l1.status})`);

console.log();
console.log("=== 4. Soak: 10 consecutive signals ===");
let ok = 0, fail = 0;
const started = Date.now();
for (let i = 0; i < 10; i++) {
  const r = await localSignal();
  if (r.ok) ok++; else fail++;
}
const elapsed = Date.now() - started;
console.log(`  ${ok}/10 green  ${fail}/10 failed  elapsed=${elapsed}ms  avg=${Math.round(elapsed / 10)}ms`);
assert.equal(fail, 0, `soak test must have 0 failures (had ${fail})`);

console.log();
console.log("✓ Auth hardening smoke: all paths self-heal under session replacement");
