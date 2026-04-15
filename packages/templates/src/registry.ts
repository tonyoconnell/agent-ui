import { listPresets, type Preset } from "./presets.js";

export interface TemplateVariable {
  name: string;
  description: string;
  default?: string;
}

export interface AgentTemplate {
  id: string;
  preset: Preset;
  variables: TemplateVariable[];
}

export function registry(): AgentTemplate[] {
  return listPresets().map((preset) => ({
    id: preset.name,
    preset,
    variables: [
      { name: "name", description: "Agent instance name", default: preset.name },
      { name: "group", description: "Group / team the agent joins", default: preset.role },
      { name: "model", description: "LLM model override", default: "anthropic/claude-haiku-4-5" },
    ],
  }));
}
