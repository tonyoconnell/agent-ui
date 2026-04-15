export interface Preset {
    name: string;
    role: string;
    description: string;
    skills: string[];
    tags: string[];
    defaultPrice?: number;
}
export declare const PRESETS: Record<string, Preset>;
export declare function getPreset(name: string): Preset | undefined;
export declare function listPresets(): Preset[];
