import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parseArgs, requireArg, flagString } from "../lib/args.js";

export const name = "config";
export const summary = "config — manage named connection profiles";

const PROFILES_DIR = path.join(os.homedir(), ".config", "oneie", "profiles");

interface Profile {
  baseUrl?: string;
  apiKey?: string;
}

function profilePath(name: string): string {
  return path.join(PROFILES_DIR, `${name}.json`);
}

function ensureDir(): void {
  if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

function readProfile(name: string): Profile {
  const p = profilePath(name);
  if (!fs.existsSync(p)) throw new Error(`profile "${name}" not found`);
  return JSON.parse(fs.readFileSync(p, "utf8")) as Profile;
}

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const sub = args.positional[0];

  if (!sub || sub === "list") {
    ensureDir();
    const files = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith(".json"));
    const profiles = files.map((f) => {
      const n = f.replace(/\.json$/, "");
      try {
        const p = readProfile(n);
        return { name: n, baseUrl: p.baseUrl, hasKey: !!p.apiKey };
      } catch {
        return { name: n, error: "unreadable" };
      }
    });
    console.log(JSON.stringify(profiles, null, 2));
    return;
  }

  if (sub === "add") {
    const profileName = requireArg(args, 1, "profile name");
    const url = flagString(args, "url");
    const key = flagString(args, "key");
    ensureDir();
    const profile: Profile = {};
    if (url) profile.baseUrl = url;
    if (key) profile.apiKey = key;
    fs.writeFileSync(profilePath(profileName), JSON.stringify(profile, null, 2));
    console.log(JSON.stringify({ ok: true, profile: profileName, path: profilePath(profileName) }, null, 2));
    return;
  }

  if (sub === "use") {
    const profileName = requireArg(args, 1, "profile name");
    readProfile(profileName); // throws if not found
    const configPath = path.join(os.homedir(), ".config", "oneie", "config.json");
    let cfg: Record<string, unknown> = {};
    if (fs.existsSync(configPath)) {
      cfg = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
    }
    cfg.activeProfile = profileName;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    console.log(JSON.stringify({ ok: true, activeProfile: profileName }, null, 2));
    return;
  }

  if (sub === "rm") {
    const profileName = requireArg(args, 1, "profile name");
    const p = profilePath(profileName);
    if (!fs.existsSync(p)) throw new Error(`profile "${profileName}" not found`);
    fs.unlinkSync(p);
    console.log(JSON.stringify({ ok: true, removed: profileName }, null, 2));
    return;
  }

  throw new Error(`unknown config subcommand "${sub}" — use: add, list, use, rm`);
}
