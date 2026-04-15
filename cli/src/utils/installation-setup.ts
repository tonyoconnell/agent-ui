import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates installation name (lowercase, hyphens only)
 * @param name Installation identifier
 * @returns True if valid, false otherwise
 */
export function validateInstallationName(name: string): boolean {
  const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return pattern.test(name);
}

/**
 * Validates path for security (no .., no absolute paths outside allowed dirs)
 * @param filePath Path to validate
 * @returns True if safe, false otherwise
 */
export function validatePath(filePath: string): boolean {
  // Reject path traversal attempts
  if (filePath.includes("..")) {
    return false;
  }

  // Reject absolute paths (we want relative paths only)
  if (path.isAbsolute(filePath)) {
    return false;
  }

  return true;
}

/**
 * Creates the installation folder structure
 * @param installationName Installation identifier (e.g., "acme")
 * @param basePath Optional base path (defaults to cwd)
 * @returns Path to created installation folder
 */
export async function createInstallationFolder(
  installationName: string,
  basePath: string = process.cwd()
): Promise<string> {
  // Validate installation name
  if (!validateInstallationName(installationName)) {
    throw new Error(
      `Invalid installation name: "${installationName}". ` +
        "Must be lowercase letters, numbers, and hyphens only."
    );
  }

  // Resolve installation path
  const installationPath = path.resolve(basePath, installationName);

  // Check if installation folder already exists
  try {
    await fs.access(installationPath);
    throw new Error(
      `Installation folder already exists: ${installationPath}`
    );
  } catch (error: any) {
    // Good - folder doesn't exist, we can create it
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  // Create installation folder
  await fs.mkdir(installationPath, { recursive: true });

  return installationPath;
}

/**
 * Mirrors the ontology structure (6 dimensions) in installation folder
 * @param installationPath Path to installation folder
 */
export async function mirrorOntologyStructure(
  installationPath: string
): Promise<void> {
  const ontologyDirs = [
    "groups",
    "people",
    "things",
    "connections",
    "events",
    "knowledge",
  ];

  for (const dir of ontologyDirs) {
    const dirPath = path.join(installationPath, dir);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Creates README.md in installation folder
 * @param installationPath Path to installation folder
 * @param organizationName Display name of organization
 * @param installationIdentifier Installation identifier (slug)
 */
export async function createReadme(
  installationPath: string,
  organizationName: string,
  installationIdentifier: string
): Promise<void> {
  // Read template
  const templatePath = path.resolve(
    __dirname,
    "../../templates/installation-readme.md"
  );

  let template: string;
  try {
    template = await fs.readFile(templatePath, "utf-8");
  } catch (error) {
    // Fallback to inline template if file doesn't exist
    template = getDefaultReadmeTemplate();
  }

  // Replace placeholders
  const content = template
    .replace(/\{\{organizationName\}\}/g, organizationName)
    .replace(/\{\{installationIdentifier\}\}/g, installationIdentifier)
    .replace(/\{\{date\}\}/g, new Date().toISOString().split("T")[0]);

  // Write README
  const readmePath = path.join(installationPath, "README.md");
  await fs.writeFile(readmePath, content, "utf-8");
}

/**
 * Updates .env.local with INSTALLATION_NAME (legacy, deprecated)
 * @param installationName Installation identifier
 * @param basePath Optional base path (defaults to cwd)
 */
export async function updateEnvFile(
  installationName: string,
  basePath: string = process.cwd()
): Promise<void> {
  const envPath = path.join(basePath, ".env.local");

  let envContent = "";
  try {
    envContent = await fs.readFile(envPath, "utf-8");
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    // File doesn't exist, start with empty content
  }

  // Check if INSTALLATION_NAME already exists
  const installationNamePattern = /^INSTALLATION_NAME=.*$/m;

  if (installationNamePattern.test(envContent)) {
    // Replace existing value
    envContent = envContent.replace(
      installationNamePattern,
      `INSTALLATION_NAME=${installationName}`
    );
  } else {
    // Append new value
    if (envContent && !envContent.endsWith("\n")) {
      envContent += "\n";
    }
    envContent += `\n# Installation Configuration\nINSTALLATION_NAME=${installationName}\n`;
  }

  await fs.writeFile(envPath, envContent, "utf-8");
}

/**
 * Updates .env.local with organization-specific configuration
 * @param options Organization configuration
 * @param basePath Optional base path (defaults to cwd/web)
 */
export async function updateOrgEnvFile(
  options: {
    orgName: string;
    orgWebsite: string;
    orgFolder: string;
    backendEnabled?: boolean;
  },
  basePath: string = process.cwd()
): Promise<void> {
  // Look for web/.env.local first (preferred), fallback to root .env.local
  let envPath = path.join(basePath, "web", ".env.local");

  try {
    await fs.access(path.join(basePath, "web"));
  } catch {
    // web/ doesn't exist, use root
    envPath = path.join(basePath, ".env.local");
  }

  let envContent = "";
  try {
    envContent = await fs.readFile(envPath, "utf-8");
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    // File doesn't exist, start with empty content
  }

  // Helper to update or append env variable
  const updateEnvVar = (key: string, value: string) => {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(envContent)) {
      envContent = envContent.replace(pattern, `${key}=${value}`);
    } else {
      if (envContent && !envContent.endsWith("\n")) {
        envContent += "\n";
      }
      if (!envContent.includes("# Organization Configuration")) {
        envContent += `\n# Organization Configuration\n`;
      }
      envContent += `${key}=${value}\n`;
    }
  };

  // Update all org-specific variables
  updateEnvVar("ORG_NAME", options.orgName);
  updateEnvVar("ORG_WEBSITE", options.orgWebsite);
  updateEnvVar("ORG_FOLDER", options.orgFolder);
  updateEnvVar("ONE_BACKEND", options.backendEnabled !== false ? "on" : "off");

  // Add Convex placeholders to prevent "undefined deployment address" errors
  // Users can update these with their actual Convex deployment when ready
  if (!envContent.includes("PUBLIC_CONVEX_URL=")) {
    if (!envContent.includes("# Convex Backend")) {
      envContent += `\n# Convex Backend (placeholder - update with your deployment)\n`;
    }
    envContent += `PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud\n`;
    envContent += `CONVEX_DEPLOYMENT=dev:your-deployment\n`;
  }

  await fs.writeFile(envPath, envContent, "utf-8");
}

/**
 * Updates .gitignore to optionally exclude installation folder
 * @param installationName Installation identifier
 * @param exclude Whether to exclude the folder from git
 * @param basePath Optional base path (defaults to cwd)
 */
export async function updateGitignore(
  installationName: string,
  exclude: boolean,
  basePath: string = process.cwd()
): Promise<void> {
  if (!exclude) {
    return;
  }

  const gitignorePath = path.join(basePath, ".gitignore");

  let gitignoreContent = "";
  try {
    gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    // File doesn't exist, start with empty content
  }

  const ignorePattern = `/${installationName}/`;

  // Check if pattern already exists
  if (gitignoreContent.includes(ignorePattern)) {
    return;
  }

  // Append ignore pattern
  if (gitignoreContent && !gitignoreContent.endsWith("\n")) {
    gitignoreContent += "\n";
  }
  gitignoreContent += `\n# Installation folder (private docs)\n${ignorePattern}\n`;

  await fs.writeFile(gitignorePath, gitignoreContent, "utf-8");
}

/**
 * Rollback installation folder creation on failure
 * @param installationPath Path to installation folder
 */
export async function rollbackInstallation(
  installationPath: string
): Promise<void> {
  try {
    await fs.rm(installationPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors during rollback
    console.error(`Warning: Failed to rollback ${installationPath}:`, error);
  }
}

/**
 * Creates .onboarding.json handoff file for Claude Code
 * @param installationPath Path to installation folder
 * @param data Onboarding data (user, org, website)
 */
export async function createOnboardingFile(
  installationPath: string,
  data: {
    userName: string;
    userEmail: string;
    organizationName: string;
    organizationSlug: string;
    websiteUrl: string | null;
  }
): Promise<void> {
  const onboardingData = {
    version: "1.0.0",
    status: "pending_analysis",
    timestamp: Date.now(),

    user: {
      name: data.userName,
      email: data.userEmail,
    },

    organization: {
      name: data.organizationName,
      slug: data.organizationSlug,
    },

    website: {
      url: data.websiteUrl,
      analyzed: false,
      brandExtracted: false,
      ontologyGenerated: false,
    },

    features: {
      selected: [],
      recommended: [],
    },

    plan: {
      inferences: [],
      status: "not_started",
    },
  };

  const onboardingPath = path.join(installationPath, ".onboarding.json");
  await fs.writeFile(
    onboardingPath,
    JSON.stringify(onboardingData, null, 2),
    "utf-8"
  );
}

/**
 * Default README template (inline fallback)
 */
function getDefaultReadmeTemplate(): string {
  return `# {{organizationName}} Installation

**Installation Identifier:** \`{{installationIdentifier}}\`
**Created:** {{date}}

## Overview

This installation folder contains your organization-specific documentation and configuration that overrides the global ONE platform templates.

## Folder Structure

- \`groups/\` - Group-specific documentation (supports hierarchical nesting)
- \`people/\` - Role and governance documentation
- \`things/\` - Entity and specification documentation
- \`connections/\` - Relationship and workflow documentation
- \`events/\` - Event and deployment documentation
- \`knowledge/\` - AI training data and RAG content

## File Resolution Priority

Files in this installation folder take priority over global \`/one/\` templates:

1. Most specific group path (e.g., \`groups/engineering/frontend/sprint-guide.md\`)
2. Parent group paths (walk up hierarchy)
3. Installation root (e.g., \`things/vision.md\`)
4. Global fallback (e.g., \`/one/things/vision.md\`)

## Usage

### Add Group-Specific Documentation

\`\`\`bash
# Create group folder
mkdir -p groups/engineering

# Add documentation
echo "# Engineering Practices" > groups/engineering/practices.md
\`\`\`

### Add Installation-Wide Documentation

\`\`\`bash
# Override global vision
echo "# Our Vision" > things/vision.md
\`\`\`

## Environment Variables

This installation is configured in \`.env.local\`:

\`\`\`
INSTALLATION_NAME={{installationIdentifier}}
\`\`\`

## Security

- Never commit secrets or credentials to this folder
- Use \`.env.local\` for sensitive configuration
- This folder is for **documentation and configuration only**

## Learn More

- Platform Documentation: \`/one/\`
- 6-Dimension Ontology: \`/one/knowledge/ontology.md\`
- Development Workflow: \`/one/connections/workflow.md\`
`;
}
