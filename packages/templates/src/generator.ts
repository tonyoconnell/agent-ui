import type { Preset } from "./presets.js";

export interface GenerateOptions {
  name: string;
  preset: Preset;
  model?: string;
  systemPrompt?: string;
  group?: string;
}

export interface GenerateResult {
  markdown: string;
  filename: string;
}

const DEFAULT_MODEL = "anthropic/claude-haiku-4-5";

export function generate(opts: GenerateOptions): GenerateResult {
  const model = opts.model ?? DEFAULT_MODEL;
  const group = opts.group ?? opts.preset.role;
  const skills = opts.preset.skills
    .map((s) => `  - name: ${s}\n    price: ${opts.preset.defaultPrice ?? 0.02}\n    tags: [${opts.preset.tags.join(", ")}]`)
    .join("\n");
  const prompt = opts.systemPrompt ?? `You are the ${opts.preset.name}. ${opts.preset.description}.`;
  const markdown = `---
name: ${opts.name}
model: ${model}
group: ${group}
preset: ${opts.preset.name}
skills:
${skills}
---

${prompt}
`;
  return { markdown, filename: `${opts.name}.md` };
}
