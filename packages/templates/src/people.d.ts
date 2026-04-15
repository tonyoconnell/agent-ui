import { type Preset } from "./presets.js";
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
export declare function buildCSuite(): Executive[];
