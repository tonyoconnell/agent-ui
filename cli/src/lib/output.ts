import { stringify as yamlStringify } from "yaml";

export type OutputFormat = "json" | "yaml" | "table";

export function getOutputFormat(): OutputFormat {
  const f = process.env.ONEIE_OUTPUT;
  if (f === "yaml" || f === "table") return f;
  return "json";
}

export function formatOutput(data: unknown, format?: OutputFormat): string {
  const fmt = format ?? getOutputFormat();
  if (fmt === "yaml") return yamlStringify(data);
  if (fmt === "table") return toTable(data);
  return JSON.stringify(data, null, 2);
}

function toTable(data: unknown): string {
  if (!Array.isArray(data) || data.length === 0) {
    return JSON.stringify(data, null, 2);
  }
  const rows = data as Record<string, unknown>[];
  const keys = Object.keys(rows[0]);
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length))
  );
  const pad = (vals: string[]) => vals.map((v, i) => v.padEnd(widths[i])).join("  ");
  const header = pad(keys);
  const divider = pad(widths.map((w) => "-".repeat(w)));
  const body = rows.map((r) => pad(keys.map((k) => String(r[k] ?? ""))));
  return [header, divider, ...body].join("\n");
}
