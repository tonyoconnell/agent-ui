/**
 * Manifest Loader
 *
 * Loads and parses package configuration from separate YAML files.
 * New structure: cli/packages/builds/*.yaml (one file per package)
 * Legacy fallback: cli/packages/manifest.yaml
 */

import fs from "fs-extra";
import path from "path";
import YAML from "yaml";

// Types for the manifest
export interface PackageConfig {
  name: string;
  description: string;
  version: string;
  type: "foundation" | "feature";
  price: string;
  requires?: string[];
  github?: {
    app: string;
    package?: string;
  };
  npm?: {
    access: "public" | "restricted";
  };
  include: string[];
  exclude?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  env?: {
    required?: string[];
    optional?: string[];
  };
}

export interface BundleConfig {
  name: string;
  description: string;
  price: string;
  savings?: string;
  includes: string[];
}

export interface SyncConfig {
  source: string;
  dest: string;
}

export interface ReleaseConfig {
  cli_path: string;
  app_path: string;
  version_file: string;
  npm_name: string;
  sync: SyncConfig[];
}

export interface SharedConfig {
  global_exclude: string[];
  shared: Record<string, string[]>;
}

export interface Manifest {
  version: string;
  monorepo_markers: string[];
  global_exclude: string[];
  shared: Record<string, string[]>;
  packages: Record<string, PackageConfig>;
  bundles: Record<string, BundleConfig>;
  release: ReleaseConfig;
}

let cachedManifest: Manifest | null = null;
let cachedPackages: Map<string, PackageConfig> | null = null;

/**
 * Get the builds directory path
 */
function getBuildsDir(basePath: string): string {
  return path.join(basePath, "cli/packages/builds");
}

/**
 * Load shared configuration from shared.yaml
 */
async function loadSharedConfig(basePath: string): Promise<SharedConfig> {
  const sharedPath = path.join(getBuildsDir(basePath), "shared.yaml");

  if (await fs.pathExists(sharedPath)) {
    const content = await fs.readFile(sharedPath, "utf-8");
    return YAML.parse(content) as SharedConfig;
  }

  // Default shared config if file doesn't exist
  return {
    global_exclude: [
      "**/.DS_Store",
      "**/node_modules/**",
      "**/.env",
      "**/.env.local",
      "**/dist/**",
    ],
    shared: {},
  };
}

/**
 * Load a single package from its YAML file
 */
async function loadPackageFromFile(
  packageName: string,
  basePath: string
): Promise<PackageConfig | null> {
  const packagePath = path.join(getBuildsDir(basePath), `${packageName}.yaml`);

  if (await fs.pathExists(packagePath)) {
    const content = await fs.readFile(packagePath, "utf-8");
    return YAML.parse(content) as PackageConfig;
  }

  return null;
}

/**
 * Load all packages from the builds directory
 */
async function loadAllPackagesFromFiles(
  basePath: string
): Promise<Record<string, PackageConfig>> {
  const buildsDir = getBuildsDir(basePath);
  const packages: Record<string, PackageConfig> = {};

  if (await fs.pathExists(buildsDir)) {
    const files = await fs.readdir(buildsDir);

    for (const file of files) {
      if (file.endsWith(".yaml") && file !== "shared.yaml") {
        const packageName = file.replace(".yaml", "");
        const packagePath = path.join(buildsDir, file);
        const content = await fs.readFile(packagePath, "utf-8");
        packages[packageName] = YAML.parse(content) as PackageConfig;
      }
    }
  }

  return packages;
}

/**
 * Load the manifest file (legacy or new format)
 */
export async function loadManifest(
  basePath: string = process.cwd()
): Promise<Manifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  // Try new format first (separate YAML files)
  const buildsDir = getBuildsDir(basePath);
  if (await fs.pathExists(buildsDir)) {
    const sharedConfig = await loadSharedConfig(basePath);
    const packages = await loadAllPackagesFromFiles(basePath);

    if (Object.keys(packages).length > 0) {
      cachedManifest = {
        version: "3.0.0",
        monorepo_markers: ["CLAUDE.md", "cli/release.yaml", ".claude/agents"],
        global_exclude: sharedConfig.global_exclude,
        shared: sharedConfig.shared,
        packages,
        bundles: {}, // Bundles are defined in manifest.yaml or separate file
        release: {
          cli_path: "cli/",
          app_path: "apps/one/",
          version_file: "cli/package.json",
          npm_name: "oneie",
          sync: [],
        },
      };

      // Try to load bundles and release config from legacy manifest
      const legacyPath = path.join(basePath, "cli/packages/manifest.yaml");
      if (await fs.pathExists(legacyPath)) {
        const legacyContent = await fs.readFile(legacyPath, "utf-8");
        const legacyManifest = YAML.parse(legacyContent) as Manifest;
        cachedManifest.bundles = legacyManifest.bundles || {};
        cachedManifest.release = legacyManifest.release || cachedManifest.release;
        cachedManifest.monorepo_markers = legacyManifest.monorepo_markers || cachedManifest.monorepo_markers;
      }

      return cachedManifest;
    }
  }

  // Fall back to legacy manifest.yaml
  const possiblePaths = [
    path.join(basePath, "cli/packages/manifest.yaml"),
    path.join(basePath, "packages/manifest.yaml"),
    path.join(path.dirname(new URL(import.meta.url).pathname), "../../packages/manifest.yaml"),
  ];

  for (const manifestPath of possiblePaths) {
    if (await fs.pathExists(manifestPath)) {
      const content = await fs.readFile(manifestPath, "utf-8");
      cachedManifest = YAML.parse(content) as Manifest;
      return cachedManifest;
    }
  }

  throw new Error(
    `Manifest not found. Tried:\n${possiblePaths.map((p) => `  - ${p}`).join("\n")}`
  );
}

/**
 * Clear the manifest cache (for testing)
 */
export function clearManifestCache(): void {
  cachedManifest = null;
}

/**
 * Get a specific package config
 */
export async function getPackage(
  packageName: string,
  basePath?: string
): Promise<PackageConfig | null> {
  const manifest = await loadManifest(basePath);
  return manifest.packages[packageName] || null;
}

/**
 * Get all package names
 */
export async function getPackageNames(basePath?: string): Promise<string[]> {
  const manifest = await loadManifest(basePath);
  return Object.keys(manifest.packages);
}

/**
 * Get shared files for a category
 */
export async function getSharedFiles(
  category?: string,
  basePath?: string
): Promise<string[]> {
  const manifest = await loadManifest(basePath);

  if (category) {
    return manifest.shared[category] || [];
  }

  // Return all shared files flattened
  return Object.values(manifest.shared).flat();
}

/**
 * Resolve package dependencies (including transitive)
 */
export async function resolvePackageDependencies(
  packageName: string,
  basePath?: string
): Promise<string[]> {
  const manifest = await loadManifest(basePath);
  const resolved = new Set<string>();
  const queue = [packageName];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (resolved.has(current)) continue;

    const pkg = manifest.packages[current];
    if (!pkg) continue;

    resolved.add(current);

    if (pkg.requires) {
      for (const dep of pkg.requires) {
        if (!resolved.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  // Remove the original package from dependencies
  resolved.delete(packageName);
  return Array.from(resolved);
}
