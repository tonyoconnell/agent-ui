import fs from "fs/promises";
import path from "path";

/**
 * Options for file resolution
 */
export interface FileResolverOptions {
  installationName: string;
  groupId?: string; // Group ID for hierarchical resolution
  fallbackToGlobal?: boolean; // Default: true
  basePath?: string; // Base path for resolution (defaults to cwd)
}

/**
 * Result of file resolution
 */
export interface ResolvedFile {
  path: string;
  source: "group" | "installation" | "global";
  exists: boolean;
}

/**
 * Validates path for security (no .., no symlinks outside allowed dirs)
 * @param filePath Path to validate
 * @param basePath Base path for validation
 * @returns True if valid, throws otherwise
 */
export async function validateSecurePath(
  filePath: string,
  basePath: string
): Promise<void> {
  // Reject path traversal
  if (filePath.includes("..")) {
    throw new Error(`Path traversal not allowed: ${filePath}`);
  }

  // Resolve real path (follows symlinks)
  let realPath: string;
  try {
    realPath = await fs.realpath(filePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File doesn't exist yet - that's ok
      realPath = path.resolve(filePath);
    } else {
      throw error;
    }
  }

  // Verify symlink stays within allowed directories
  const resolvedBase = path.resolve(basePath);
  const oneBase = path.resolve(basePath, "one");

  const isWithinInstallation = realPath.startsWith(resolvedBase);
  const isWithinOne = realPath.startsWith(oneBase);

  if (!isWithinInstallation && !isWithinOne) {
    throw new Error(
      `Symlink points outside allowed directories: ${realPath}`
    );
  }
}

/**
 * Checks if file exists
 * @param filePath Path to check
 * @returns True if exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets group path by walking up the hierarchy
 * @param groupId Group ID
 * @param convexClient Optional Convex client for database queries
 * @returns Group path (e.g., "engineering/frontend")
 *
 * Note: This is a placeholder. In production, this should query Convex
 * to get the actual group hierarchy from the database.
 */
export async function getGroupPath(
  groupId: string,
  convexClient?: any
): Promise<string> {
  // TODO: Implement actual Convex query when backend is ready
  // For now, return the groupId as-is (flat structure)
  //
  // In production:
  // const group = await convexClient.query("groups:get", { id: groupId });
  // const segments = [group.slug];
  // let currentParentId = group.parentGroupId;
  // while (currentParentId) {
  //   const parent = await convexClient.query("groups:get", { id: currentParentId });
  //   segments.unshift(parent.slug);
  //   currentParentId = parent.parentGroupId;
  // }
  // return segments.join("/");

  return groupId; // Fallback: flat structure
}

/**
 * Resolves a file hierarchically across group → installation → global
 * @param relativePath Relative path to file (e.g., "sprint-guide.md")
 * @param options File resolution options
 * @returns Resolved file with path and source
 */
export async function resolveFile(
  relativePath: string,
  options: FileResolverOptions
): Promise<ResolvedFile> {
  const {
    installationName,
    groupId,
    fallbackToGlobal = true,
    basePath = process.cwd(),
  } = options;

  // Validate relative path
  if (relativePath.includes("..")) {
    throw new Error(`Path traversal not allowed: ${relativePath}`);
  }

  const resolvedBase = path.resolve(basePath);

  // 1. If groupId provided, check group-specific paths (walk up hierarchy)
  if (groupId) {
    const groupPath = await getGroupPath(groupId);
    const groupFile = path.join(
      resolvedBase,
      installationName,
      "groups",
      groupPath,
      relativePath
    );

    if (await fileExists(groupFile)) {
      await validateSecurePath(groupFile, resolvedBase);
      return {
        path: groupFile,
        source: "group",
        exists: true,
      };
    }

    // TODO: Walk up parent groups when backend supports it
    // For now, we only check the direct group path
  }

  // 2. Check installation root
  const installationFile = path.join(
    resolvedBase,
    installationName,
    relativePath
  );

  if (await fileExists(installationFile)) {
    await validateSecurePath(installationFile, resolvedBase);
    return {
      path: installationFile,
      source: "installation",
      exists: true,
    };
  }

  // 3. Check global /one/ (if fallbackToGlobal)
  if (fallbackToGlobal) {
    const globalFile = path.join(resolvedBase, "one", relativePath);

    if (await fileExists(globalFile)) {
      await validateSecurePath(globalFile, resolvedBase);
      return {
        path: globalFile,
        source: "global",
        exists: true,
      };
    }
  }

  // 4. Not found - return installation path as default (doesn't exist)
  return {
    path: installationFile,
    source: "installation",
    exists: false,
  };
}

/**
 * Resolves multiple files at once
 * @param relativePaths Array of relative paths
 * @param options File resolution options
 * @returns Array of resolved files
 */
export async function resolveFiles(
  relativePaths: string[],
  options: FileResolverOptions
): Promise<ResolvedFile[]> {
  return Promise.all(
    relativePaths.map((relativePath) => resolveFile(relativePath, options))
  );
}

/**
 * Loads file content with hierarchical resolution
 * @param relativePath Relative path to file
 * @param options File resolution options
 * @returns File content as string, or null if not found
 */
export async function loadFile(
  relativePath: string,
  options: FileResolverOptions
): Promise<string | null> {
  const resolved = await resolveFile(relativePath, options);

  if (!resolved.exists) {
    return null;
  }

  try {
    return await fs.readFile(resolved.path, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${resolved.path}:`, error);
    return null;
  }
}

/**
 * Cache for file resolution (optional performance optimization)
 */
export class FileResolverCache {
  private cache = new Map<string, ResolvedFile>();

  /**
   * Gets cached result or resolves file
   * @param relativePath Relative path to file
   * @param options File resolution options
   * @returns Resolved file
   */
  async resolve(
    relativePath: string,
    options: FileResolverOptions
  ): Promise<ResolvedFile> {
    const cacheKey = this.getCacheKey(relativePath, options);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const resolved = await resolveFile(relativePath, options);
    this.cache.set(cacheKey, resolved);

    return resolved;
  }

  /**
   * Clears cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generates cache key
   */
  private getCacheKey(
    relativePath: string,
    options: FileResolverOptions
  ): string {
    return `${options.installationName}:${options.groupId || "root"}:${relativePath}`;
  }
}
