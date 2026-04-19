/**
 * Agent Environment Detection
 *
 * Detects if the CLI is running in an AI agent environment (Claude Code, Cursor, etc.)
 * or non-interactive environment (CI/CD, non-TTY)
 */

/**
 * Checks if running in an AI agent or non-interactive environment
 */
export function isAgentEnvironment(): boolean {
  return (
    // Claude Code environment
    !!process.env.CLAUDE_CODE ||
    !!process.env.CLAUDE_USER_NAME ||
    !!process.env.CLAUDE_ORG_NAME ||

    // GitHub Copilot
    !!process.env.GITHUB_COPILOT ||

    // Cursor AI
    !!process.env.CURSOR_AI ||

    // Windsurf (Codeium)
    !!process.env.CODEIUM_API_KEY ||

    // Generic AI agent marker
    !!process.env.AI_AGENT ||

    // Non-TTY (no interactive terminal)
    !process.stdin.isTTY ||

    // CI/CD environments
    !!process.env.CI ||
    !!process.env.GITHUB_ACTIONS ||
    !!process.env.GITLAB_CI ||
    !!process.env.CIRCLECI ||
    !!process.env.TRAVIS ||
    !!process.env.JENKINS_HOME
  );
}

/**
 * Gets the type of agent environment detected
 */
export function getAgentType(): string {
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_USER_NAME) {
    return "Claude Code";
  }
  if (process.env.GITHUB_COPILOT) {
    return "GitHub Copilot";
  }
  if (process.env.CURSOR_AI) {
    return "Cursor";
  }
  if (process.env.CODEIUM_API_KEY) {
    return "Windsurf";
  }
  if (process.env.CI) {
    return "CI/CD";
  }
  if (process.env.GITHUB_ACTIONS) {
    return "GitHub Actions";
  }
  if (process.env.GITLAB_CI) {
    return "GitLab CI";
  }
  if (process.env.CIRCLECI) {
    return "CircleCI";
  }
  if (!process.stdin.isTTY) {
    return "Non-interactive";
  }
  return "Unknown agent";
}

/**
 * Shows helpful message when interactive command is run in agent environment
 */
export function showAgentModeMessage(): void {
  console.log("⚠️  Agent environment detected!\n");
  console.log(
    "You're running the interactive version in an AI agent environment."
  );
  console.log("This command requires human input and will hang.\n");
  console.log("Did you mean to run:");
  console.log("  npx oneie agent\n");
  console.log("The 'agent' command is designed for AI agents:");
  console.log("  ✓ Zero interaction required");
  console.log("  ✓ Auto-detects context from git, files, and environment");
  console.log("  ✓ Completes in 5-10 seconds");
  console.log("  ✓ Safe for automated workflows\n");
  console.log("Run this instead:");
  console.log("  npx oneie agent\n");
  console.log("Or if you're human and want interactive setup:");
  console.log("  npx oneie --interactive\n");
  console.log("Aborting to prevent hang...");
}
