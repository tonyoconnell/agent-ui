import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function syncAgentDefinitions() {
  // Package root is one level up from dist/
  const packageRoot = path.join(__dirname, "..");
  const sourceDir = path.join(packageRoot, "one/things/agents");
  const targetDir = path.join(process.cwd(), ".claude/agents");

  // Create target directory
  await fs.mkdir(targetDir, { recursive: true });

  // Find all agent files
  const agentFiles = await glob("*.md", { cwd: sourceDir });

  // Copy each agent file
  for (const file of agentFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    await fs.copyFile(sourcePath, targetPath);
  }

  console.log(`✓ Synced ${agentFiles.length} agent definitions`);

  return {
    agentsSynced: agentFiles.length,
    agents: agentFiles.map((f) => path.basename(f, ".md")),
  };
}
