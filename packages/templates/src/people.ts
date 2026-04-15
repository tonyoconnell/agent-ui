import { getPreset, type Preset } from "./presets.js";

export type CSuiteRole = "ceo" | "cto" | "cfo" | "coo" | "cro";

export interface Executive {
  role: CSuiteRole;
  preset: Preset;
}

export interface Department {
  name: string;
  lead: CSuiteRole;
  members: Preset[];
}

export function buildCSuite(): Executive[] {
  const roles: CSuiteRole[] = ["ceo", "cto", "cfo", "coo", "cro"];
  const out: Executive[] = [];
  for (const role of roles) {
    const preset = getPreset(role);
    if (preset) out.push({ role, preset });
  }
  return out;
}
