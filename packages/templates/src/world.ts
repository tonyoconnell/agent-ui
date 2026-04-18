import { generate } from "./generator.js";
import type { GenerateResult } from "./generator.js";
import { getPreset } from "./presets.js";

export type ClusterName =
  | "csuite"
  | "marketing"
  | "support"
  | "edu"
  | "creative"
  | "edge"
  | "tech";

const CLUSTER_PRESETS: Record<ClusterName, string[]> = {
  csuite: ["ceo", "cto", "cfo", "coo", "cro"],
  marketing: ["writer", "social", "community", "analytics", "outreach", "ads", "strategy"],
  support: ["concierge", "classifier", "triage", "escalation"],
  edu: ["tutor", "researcher", "coach"],
  creative: ["creative-director", "copywriter"],
  edge: ["telegram-bot", "discord-bot", "notifier"],
  tech: ["data-analyst", "qa-engineer"],
};

export interface WorldSpec {
  preset: string;
  name?: string;
  group?: string;
}

export interface WorldResult {
  worldName: string;
  agents: GenerateResult[];
  deployInstructions: string;
}

export function buildWorld(
  name: string,
  presets: Array<string | WorldSpec>,
): WorldResult {
  const agents: GenerateResult[] = [];
  for (const p of presets) {
    const presetName = typeof p === "string" ? p : p.preset;
    const agentName = typeof p !== "string" && p.name ? p.name : presetName;
    const group = typeof p !== "string" && p.group ? p.group : name;
    const preset = getPreset(presetName);
    if (!preset) continue;
    agents.push(generate({ preset, name: agentName, group }));
  }
  return {
    worldName: name,
    agents,
    deployInstructions: [
      `# Deploy world: ${name}`,
      "",
      agents.map((a) => `oneie agent ${a.filename}`).join("\n"),
    ].join("\n"),
  };
}

export function buildTeam(cluster: ClusterName, size?: number): GenerateResult[] {
  const names = size ? CLUSTER_PRESETS[cluster].slice(0, size) : CLUSTER_PRESETS[cluster];
  return names
    .map((n) => {
      const preset = getPreset(n);
      if (!preset) return null;
      return generate({ preset, name: n, group: cluster });
    })
    .filter((r): r is GenerateResult => r !== null);
}
