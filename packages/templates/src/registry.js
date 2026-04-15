import { listPresets } from "./presets.js";
export function registry() {
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
//# sourceMappingURL=registry.js.map