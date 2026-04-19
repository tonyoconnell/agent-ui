export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith("--")) {
      const key = tok.slice(2);
      const eq = key.indexOf("=");
      if (eq >= 0) {
        flags[key.slice(0, eq)] = key.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positional.push(tok);
    }
  }
  return { positional, flags };
}

export function requireArg(args: ParsedArgs, idx: number, label: string): string {
  const val = args.positional[idx];
  if (!val) throw new Error(`missing ${label} (positional arg ${idx})`);
  return val;
}

export function flagString(args: ParsedArgs, key: string, fallback?: string): string | undefined {
  const v = args.flags[key];
  if (typeof v === "string") return v;
  if (v === true) return String(v);
  return fallback;
}

export function flagNumber(args: ParsedArgs, key: string, fallback?: number): number | undefined {
  const v = args.flags[key];
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function flagBool(args: ParsedArgs, key: string): boolean {
  return args.flags[key] === true || args.flags[key] === "true";
}

export function hasDryRun(args: ParsedArgs): boolean {
  return flagBool(args, "dry-run");
}
