#!/usr/bin/env node
/**
 * ONE Universal Access System - npx oneie
 * Simple folder copier based on bin/folders.yaml configuration
 * No external dependencies - pure Node.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OneInstaller {
  constructor() {
    this.sourceDir = path.resolve(__dirname, '../../');
    this.targetDir = process.cwd();
    this.configFile = path.join(__dirname, '../folders.yaml');
    this.fileExtensions = ['.md', '.yaml', '.yml', '.sh'];
  }

  async install() {
    console.log('🧪 ONE Test-Driven Vision CASCADE v1.7.0');
    console.log('📁 Installing Test-First 3 Levels architecture...\n');

    try {
      const config = this.loadConfiguration();
      await this.copyFolders(config);
      console.log('\n✅ Test-Driven ONE Framework installation complete!');
      console.log('\n🚀 Next steps:');
      console.log('   claude              # Open Claude Code');
      console.log('   /one --test-driven  # Launch Agent ONE with test-first validation\n');
      console.log('🧪 Revolutionary Test-First CASCADE: 95%+ validation coverage ready!');
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  }

  loadConfiguration() {
    try {
      const configContent = fs.readFileSync(this.configFile, 'utf8');
      return this.parseYaml(configContent);
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  parseYaml(yamlContent) {
    const lines = yamlContent.split('\n');
    const config = { claude_folders: [], one_platform_folders: [], one_user_folders: [], root_files: [] };
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;
      
      if (trimmed.endsWith(':')) {
        currentSection = trimmed.replace(':', '');
      } else if (trimmed.startsWith('- ') && currentSection) {
        const item = trimmed.replace('- ', '');
        if (config[currentSection]) {
          config[currentSection].push(item);
        }
      }
    }
    return config;
  }

  async copyFolders(config) {
    const allFolders = [
      ...config.claude_folders || [],
      ...config.one_platform_folders || [],
      ...config.one_user_folders || []
    ];

    const rootFiles = config.root_files || [];

    let totalFiles = 0;
    let copiedFiles = 0;

    // Count total files first (folders)
    for (const folder of allFolders) {
      const sourceFolder = path.join(this.sourceDir, folder);
      if (fs.existsSync(sourceFolder)) {
        totalFiles += this.countTargetFiles(sourceFolder);
      }
    }

    // Count root files
    for (const filePath of rootFiles) {
      const sourceFile = path.join(this.sourceDir, filePath);
      if (fs.existsSync(sourceFile) && this.isTargetFile(path.basename(filePath))) {
        totalFiles++;
      }
    }

    console.log(`📦 Found ${totalFiles} files to copy...\n`);

    // Copy folder files with progress
    for (const folder of allFolders) {
      const sourceFolder = path.join(this.sourceDir, folder);
      const targetFolder = path.join(this.targetDir, folder);

      if (fs.existsSync(sourceFolder)) {
        console.log(`📁 Copying ${folder}...`);
        copiedFiles += await this.copyFolderFiles(sourceFolder, targetFolder, totalFiles, copiedFiles);
      }
    }

    // Copy individual root files
    for (const filePath of rootFiles) {
      const sourceFile = path.join(this.sourceDir, filePath);
      const targetFile = path.join(this.targetDir, filePath);

      if (fs.existsSync(sourceFile) && this.isTargetFile(path.basename(filePath))) {
        await this.copyFile(sourceFile, targetFile);
        copiedFiles++;
        this.showProgress(copiedFiles, totalFiles, path.basename(filePath));
      }
    }
  }

  countTargetFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        count += this.countTargetFiles(fullPath);
      } else if (this.isTargetFile(item.name)) {
        count++;
      }
    }
    return count;
  }

  async copyFolderFiles(sourceDir, targetDir, totalFiles, startIndex) {
    let copiedCount = 0;
    const items = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(sourceDir, item.name);
      const targetPath = path.join(targetDir, item.name);

      if (item.isDirectory()) {
        copiedCount += await this.copyFolderFiles(sourcePath, targetPath, totalFiles, startIndex + copiedCount);
      } else if (this.isTargetFile(item.name)) {
        await this.copyFile(sourcePath, targetPath);
        copiedCount++;
        this.showProgress(startIndex + copiedCount, totalFiles, item.name);
      }
    }
    return copiedCount;
  }

  isTargetFile(filename) {
    return this.fileExtensions.some(ext => filename.endsWith(ext));
  }

  async copyFile(src, dest) {
    return new Promise((resolve, reject) => {
      const destDir = path.dirname(dest);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFile(src, dest, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  showProgress(current, total, filename) {
    const percentage = Math.round((current / total) * 100);
    const progressWidth = 30;
    const filled = Math.round((current / total) * progressWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(progressWidth - filled);
    
    process.stdout.write(`\r   [${bar}] ${percentage}% ${filename.slice(-30)}`);
    if (current === total) {
      process.stdout.write('\n');
    }
  }
}

// Run installer
new OneInstaller().install().catch(console.error);