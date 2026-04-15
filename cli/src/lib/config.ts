import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

export interface CliConfig {
  apiKey?: string;
  baseUrl?: string;
  agentLaunchUrl?: string;
}

const CONFIG_DIR = join(homedir(), ".config", "oneie");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export function readConfig(): CliConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as CliConfig;
  } catch {
    return {};
  }
}

export function writeConfig(partial: Partial<CliConfig>): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  const next = { ...readConfig(), ...partial };
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
}

export function getBaseUrl(): string {
  return process.env.ONEIE_API_URL ?? readConfig().baseUrl ?? "https://api.one.ie";
}

export function tryGetApiKey(): string | undefined {
  return process.env.ONEIE_API_KEY ?? process.env.ONE_API_KEY ?? readConfig().apiKey;
}

export function requireApiKey(): string {
  const key = tryGetApiKey();
  if (!key) throw new Error("ONEIE_API_KEY not set. Run `oneie auth` or set env var.");
  return key;
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
