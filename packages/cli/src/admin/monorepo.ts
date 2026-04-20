/**
 * Monorepo Detection
 *
 * Checks if we're running from the ONE monorepo root.
 * Admin commands are only available in the monorepo.
 */

import fs from "fs-extra";
import path from "path";
import { loadManifest } from "./manifest.js";

export interface MonorepoCheck {
  isMonorepo: boolean;
  missingMarkers: string[];
  rootPath: string;
}

/**
 * Check if current directory is the ONE monorepo
 */
export async function isMonorepo(
  basePath: string = process.cwd()
): Promise<MonorepoCheck> {
  const manifest = await loadManifest();
  const markers = manifest.monorepo_markers || [
    "CLAUDE.md",
    "scripts/release.yaml",
    ".claude/agents",
  ];

  const missingMarkers: string[] = [];

  for (const marker of markers) {
    const markerPath = path.join(basePath, marker);
    if (!(await fs.pathExists(markerPath))) {
      missingMarkers.push(marker);
    }
  }

  return {
    isMonorepo: missingMarkers.length === 0,
    missingMarkers,
    rootPath: basePath,
  };
}

/**
 * Get the monorepo root path
 * Walks up directories until it finds the markers
 */
export async function findMonorepoRoot(
  startPath: string = process.cwd()
): Promise<string | null> {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    const check = await isMonorepo(currentPath);
    if (check.isMonorepo) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Ensure we're in the monorepo or throw
 */
export async function requireMonorepo(): Promise<string> {
  const check = await isMonorepo();

  if (!check.isMonorepo) {
    throw new Error(
      `Not in ONE monorepo. Missing: ${check.missingMarkers.join(", ")}`
    );
  }

  return check.rootPath;
}
