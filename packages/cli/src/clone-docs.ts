import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

interface DocRepo {
  name: string;
  repo: string;
  branch?: string;
}

const DOC_REPOS: DocRepo[] = [
  {
    name: "astro",
    repo: "https://github.com/withastro/docs.git",
    branch: "main",
  },
  {
    name: "convex",
    repo: "https://github.com/get-convex/convex-docs.git",
    branch: "main",
  },
  {
    name: "effect",
    repo: "https://github.com/Effect-TS/website.git",
    branch: "main",
  },
  {
    name: "react",
    repo: "https://github.com/reactjs/react.dev.git",
    branch: "main",
  },
  {
    name: "tailwind",
    repo: "https://github.com/tailwindlabs/tailwindcss.com.git",
    branch: "main",
  },
];

export async function cloneThirdPartyDocs() {
  const docsDir = path.join(process.cwd(), "docs");

  // Create docs directory
  await fs.mkdir(docsDir, { recursive: true });

  const results = [];

  for (const doc of DOC_REPOS) {
    const targetDir = path.join(docsDir, doc.name);

    // Check if already exists
    if (await fs.stat(targetDir).catch(() => null)) {
      console.log(`⚠️  ${doc.name} docs already exist, skipping`);
      results.push({ name: doc.name, skipped: true });
      continue;
    }

    // Clone repository
    const cloneCmd = doc.branch
      ? `git clone --depth 1 --branch ${doc.branch} ${doc.repo} ${doc.name}`
      : `git clone --depth 1 ${doc.repo} ${doc.name}`;

    try {
      await execAsync(cloneCmd, { cwd: docsDir });
      console.log(`✓ ${doc.name} docs → /docs/${doc.name}`);
      results.push({ name: doc.name, cloned: true });
    } catch (error: any) {
      console.error(`✗ Failed to clone ${doc.name}: ${error.message}`);
      results.push({ name: doc.name, error: error.message });
    }
  }

  return results;
}
