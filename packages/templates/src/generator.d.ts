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
export declare function generate(opts: GenerateOptions): GenerateResult;
