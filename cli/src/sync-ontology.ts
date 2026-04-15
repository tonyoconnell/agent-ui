import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FoldersConfig {
  claude_folders: string[];
  one_folders: string[];
  allowed_extensions: string[];
  exclude_patterns: string[];
}

export async function syncOntologyFiles() {
  // 1. Determine package root (one level up from dist/)
  const packageRoot = path.join(__dirname, "..");

  // 2. Read config
  const configPath = path.join(packageRoot, "folders.yaml");
  const configContent = await fs.readFile(configPath, "utf-8");
  const config: FoldersConfig = yaml.parse(configContent);

  // 3. Build glob pattern for all allowed extensions
  const patterns = config.allowed_extensions.map((ext) => `one/**/*${ext}`);

  // 4. Find all matching files
  const oneFiles: string[] = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: packageRoot,
      ignore: config.exclude_patterns,
    });
    oneFiles.push(...files);
  }

  // 5. Copy all files to user directory
  for (const file of oneFiles) {
    const sourcePath = path.join(packageRoot, file);
    const targetPath = path.join(process.cwd(), file);

    // Create directory if needed
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Copy file
    await fs.copyFile(sourcePath, targetPath);
  }

  console.log(`✓ Copied ${oneFiles.length} ontology files`);

  return {
    filesCopied: oneFiles.length,
  };
}
