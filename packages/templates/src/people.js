import { getPreset } from "./presets.js";
export function buildCSuite() {
    const roles = ["ceo", "cto", "cfo", "coo", "cro"];
    const out = [];
    for (const role of roles) {
        const preset = getPreset(role);
        if (preset)
            out.push({ role, preset });
    }
    return out;
}
//# sourceMappingURL=people.js.map