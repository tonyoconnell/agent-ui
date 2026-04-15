import { type Preset } from "./presets.js";
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
export declare function registry(): AgentTemplate[];
