/**
 * Context Detection Utilities
 *
 * Intelligently detects user and organization context from multiple sources:
 * - Claude Code environment variables
 * - Git configuration
 * - package.json
 * - README.md
 * - Directory structure
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs-extra";
import * as path from "path";

const execAsync = promisify(exec);

export interface UserIdentity {
  name: string;
  email: string;
}

export interface DetectedContext {
  user: UserIdentity;
  organization: string;
  website?: string;
  projectName: string;
  projectPath: string;
}

/**
 * Helper to get CLI argument value
 */
function getCliArg(argName: string): string | undefined {
  const index = process.argv.indexOf(argName);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return undefined;
}

/**
 * Detects user identity from multiple sources
 * Priority: CLI flags → Claude context → git config → env vars → defaults
 */
export async function detectUserIdentity(): Promise<UserIdentity> {
  // 1. Check CLI flags (highest priority - explicit override)
  const nameFlag = getCliArg("--name");
  const emailFlag = getCliArg("--email");
  if (nameFlag || emailFlag) {
    return {
      name: nameFlag || "Developer",
      email: emailFlag || "dev@localhost",
    };
  }

  // 2. Check Claude context flags (from Claude Code)
  const claudeUser = getCliArg("--claude-user");
  const claudeEmail = getCliArg("--claude-email");
  if (claudeUser) {
    return {
      name: claudeUser,
      email: claudeEmail || "dev@localhost",
    };
  }

  // 3. Check Claude environment variables
  if (process.env.CLAUDE_USER_NAME) {
    return {
      name: process.env.CLAUDE_USER_NAME,
      email: process.env.CLAUDE_USER_EMAIL || "dev@localhost",
    };
  }

  // 4. Try git config
  try {
    const { stdout: gitName } = await execAsync("git config user.name");
    const { stdout: gitEmail } = await execAsync("git config user.email");
    if (gitName && gitEmail) {
      return {
        name: gitName.trim(),
        email: gitEmail.trim(),
      };
    }
  } catch {}

  // 5. Try standard environment variables
  if (process.env.GIT_AUTHOR_NAME && process.env.GIT_AUTHOR_EMAIL) {
    return {
      name: process.env.GIT_AUTHOR_NAME,
      email: process.env.GIT_AUTHOR_EMAIL,
    };
  }

  // 6. Fallback to defaults
  return {
    name: "Developer",
    email: "dev@localhost",
  };
}

/**
 * Detects organization name from multiple sources
 * Priority: CLI flag → Claude context → git remote → package.json → README → directory → default
 */
export async function detectOrganization(
  basePath: string = process.cwd()
): Promise<string> {
  // 1. Check CLI flag (explicit override)
  const orgFlag = getCliArg("--org");
  if (orgFlag) return orgFlag;

  // 2. Check Claude context
  const claudeOrg = getCliArg("--claude-org");
  if (claudeOrg) return claudeOrg;

  // 3. Check Claude environment variable
  if (process.env.CLAUDE_ORG_NAME) {
    return process.env.CLAUDE_ORG_NAME;
  }

  // 4. Try git remote URL
  try {
    const { stdout: remote } = await execAsync(
      "git config --get remote.origin.url"
    );
    const match = remote.match(/github\.com[:/]([^/]+)\//);
    if (match && match[1]) return match[1];
  } catch {}

  // 5. Try package.json
  const packagePath = path.join(basePath, "package.json");
  if (await fs.pathExists(packagePath)) {
    try {
      const pkg = await fs.readJson(packagePath);
      if (pkg.author?.name) return pkg.author.name;
      if (pkg.organization) return pkg.organization;
      if (typeof pkg.author === "string") {
        // Parse "Name <email>" format
        const match = pkg.author.match(/^([^<]+)/);
        if (match) return match[1].trim();
      }
    } catch {}
  }

  // 6. Try README.md
  const readmePath = path.join(basePath, "README.md");
  if (await fs.pathExists(readmePath)) {
    try {
      const readme = await fs.readFile(readmePath, "utf-8");
      const match = readme.match(/^#\s+(.+)$/m);
      if (match && match[1]) return match[1];
    } catch {}
  }

  // 7. Use parent directory name
  const parentDir = path.basename(path.resolve(basePath, ".."));
  if (parentDir && parentDir !== "/" && parentDir !== ".") {
    return parentDir;
  }

  // 8. Default
  return "Default Organization";
}

/**
 * Detects website URL from multiple sources
 * Priority: CLI flag → package.json → README → git remote
 */
export async function detectWebsite(
  basePath: string = process.cwd()
): Promise<string | undefined> {
  // 1. Check CLI flag
  const websiteFlag = getCliArg("--website");
  if (websiteFlag) return websiteFlag;

  // 2. Try package.json homepage
  const packagePath = path.join(basePath, "package.json");
  if (await fs.pathExists(packagePath)) {
    try {
      const pkg = await fs.readJson(packagePath);
      if (pkg.homepage) return pkg.homepage;
    } catch {}
  }

  // 3. Try README.md (look for URLs)
  const readmePath = path.join(basePath, "README.md");
  if (await fs.pathExists(readmePath)) {
    try {
      const readme = await fs.readFile(readmePath, "utf-8");
      // Look for URLs in markdown
      const urlMatch = readme.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) return urlMatch[0];
    } catch {}
  }

  // 4. Try converting git remote to website URL
  try {
    const { stdout: remote } = await execAsync(
      "git config --get remote.origin.url"
    );
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}`;
    }
  } catch {}

  return undefined;
}

/**
 * Detects project name from directory or package.json
 */
export async function detectProjectName(
  basePath: string = process.cwd()
): Promise<string> {
  // Try package.json name
  const packagePath = path.join(basePath, "package.json");
  if (await fs.pathExists(packagePath)) {
    try {
      const pkg = await fs.readJson(packagePath);
      if (pkg.name) return pkg.name;
    } catch {}
  }

  // Use current directory name
  return path.basename(basePath);
}

/**
 * Detects complete context for agent setup
 */
export async function detectContext(
  basePath: string = process.cwd()
): Promise<DetectedContext> {
  const [user, organization, website, projectName] = await Promise.all([
    detectUserIdentity(),
    detectOrganization(basePath),
    detectWebsite(basePath),
    detectProjectName(basePath),
  ]);

  return {
    user,
    organization,
    website,
    projectName,
    projectPath: basePath,
  };
}
