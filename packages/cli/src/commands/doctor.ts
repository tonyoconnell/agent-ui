import chalk from "chalk";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { getBaseUrl, tryGetApiKey, maskKey } from "../lib/config.js";
import { apiRequest } from "../lib/http.js";

export const name = "doctor";
export const summary = "doctor — diagnose config, auth, and substrate reachability";

interface Check {
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export async function run(_argv: string[]): Promise<void> {
  const checks: Check[] = [];

  // 1. Config file
  const configPath = path.join(os.homedir(), ".config", "oneie", "config.json");
  if (fs.existsSync(configPath)) {
    const size = fs.statSync(configPath).size;
    checks.push({ label: "Config", status: "pass", detail: `${configPath} (${size} B)` });
  } else {
    checks.push({ label: "Config", status: "warn", detail: `not found at ${configPath}` });
  }

  // 2. API key
  const key = tryGetApiKey();
  if (key) {
    const src = process.env.ONEIE_API_KEY
      ? "ONEIE_API_KEY env"
      : process.env.ONE_API_KEY
        ? "ONE_API_KEY env"
        : "config file";
    checks.push({ label: "API Key", status: "pass", detail: `${maskKey(key)} (from ${src})` });
  } else {
    checks.push({ label: "API Key", status: "warn", detail: "not found — set ONEIE_API_KEY or run oneie auth" });
  }

  // 3. Substrate reachability
  const baseUrl = getBaseUrl();
  const t0 = Date.now();
  try {
    await apiRequest("/api/health");
    checks.push({ label: "Substrate", status: "pass", detail: `${baseUrl} (${Date.now() - t0}ms)` });
  } catch (err) {
    checks.push({ label: "Substrate", status: "fail", detail: `${baseUrl} — ${(err as Error).message}` });
  }

  // 4. TypeDB (via gateway health)
  const t1 = Date.now();
  try {
    const res = await apiRequest<{ world?: unknown }>("/api/health");
    const hasWorld = res && typeof res === "object" && "world" in res;
    checks.push({
      label: "TypeDB",
      status: hasWorld ? "pass" : "warn",
      detail: hasWorld ? `reachable via gateway (${Date.now() - t1}ms)` : "health returned but world missing",
    });
  } catch {
    checks.push({ label: "TypeDB", status: "fail", detail: "not reachable — gateway may be down" });
  }

  // Render grid
  const width = Math.max(...checks.map((c) => c.label.length));
  console.log(`\n${chalk.bold("ONEIE DIAGNOSTICS")}`);
  console.log("─".repeat(60));
  for (const c of checks) {
    const icon = c.status === "pass" ? chalk.green("✓") : c.status === "warn" ? chalk.yellow("⚠") : chalk.red("✗");
    const label = c.label.padEnd(width);
    const detail = c.status === "fail" ? chalk.red(c.detail) : chalk.gray(c.detail);
    console.log(`${icon} ${label}  ${detail}`);
  }
  console.log("─".repeat(60) + "\n");

  const failed = checks.filter((c) => c.status === "fail").length;
  if (failed > 0) process.exit(1);
}
