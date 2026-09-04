import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs-extra";
import path from "path";

const execAsync = promisify(exec);

const ONE_REPO_URL = "https://github.com/one-ie/one.git";

// Subtrees the CLI ever copies out of one-ie/one. Sparse-checkout fetches
// blobs for these directories only — keeps init under ~250KB instead of ~30MB.
// Cone mode auto-includes root-level files (CLAUDE.md, AGENTS.md, README.md, LICENSE).
const SPARSE_PATHS = [".claude", "one", "agents", "web"];

export interface EnsureRepoOptions {
  cacheDir: string;
  paths?: string[];
}

/**
 * Ensure `.one-repo/` is populated with a shallow, sparse, blobless clone
 * of one-ie/one. Cheap to run repeatedly — pulls if cache exists, otherwise
 * clones with --filter=blob:none --depth 1 --sparse.
 */
export async function ensureOneRepo(opts: EnsureRepoOptions): Promise<void> {
  const { cacheDir } = opts;
  const paths = opts.paths ?? SPARSE_PATHS;

  if (await fs.pathExists(path.join(cacheDir, ".git"))) {
    await execAsync(`git -C "${cacheDir}" pull --ff-only --depth 1`).catch(() => {});
    return;
  }

  await execAsync(
    `git clone --depth 1 --filter=blob:none --sparse ${ONE_REPO_URL} "${cacheDir}"`
  );
  await execAsync(
    `git -C "${cacheDir}" sparse-checkout set ${paths.map((p) => `"${p}"`).join(" ")}`
  );
}

export interface SetupWebOptions {
  basePath: string;
  webPath: string;
  envContent?: string;
  cacheDir?: string;
}

export interface SetupWebResult {
  alreadyExists?: boolean;
  copied?: boolean;
  cloned?: boolean;
}

/**
 * Set up `web/` from the one-ie/one monorepo (web/ subdirectory).
 * Reuses `.one-repo/` cache; populates it via sparse clone if missing.
 */
export async function setupWeb(opts: SetupWebOptions): Promise<SetupWebResult> {
  const { basePath, webPath, envContent } = opts;
  const cacheDir = opts.cacheDir ?? path.join(basePath, ".one-repo");

  if (await fs.pathExists(webPath)) {
    return { alreadyExists: true };
  }

  const usedCache = await fs.pathExists(path.join(cacheDir, "web"));
  await ensureOneRepo({ cacheDir });

  const webSource = path.join(cacheDir, "web");
  if (!(await fs.pathExists(webSource))) {
    throw new Error(
      `web/ subdirectory missing from ${ONE_REPO_URL} cache at ${cacheDir}`
    );
  }

  await fs.copy(webSource, webPath, {
    overwrite: true,
    filter: (src) =>
      !src.includes(`${path.sep}.git${path.sep}`) &&
      !src.endsWith(`${path.sep}.git`),
  });

  if (envContent) {
    await fs.writeFile(path.join(webPath, ".env.local"), envContent, "utf-8");
  }

  return usedCache ? { copied: true } : { cloned: true };
}
