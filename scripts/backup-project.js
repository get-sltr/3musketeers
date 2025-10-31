#!/usr/bin/env node

/**
 * Full Project Backup Script
 * Creates timestamped backup of entire project before changes
 * Run with: npm run backup:full
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_PATH = path.join(BACKUP_DIR, `backup-${timestamp}`);

// Files/directories to exclude from backup
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.backups',
  '.git',
  'dist',
  'build',
  '*.log',
  '.DS_Store',
  '.env.local',
  '.env',
  '*.backup'
];

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Skipping ${src} (doesn't exist)`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        return srcPath.includes(pattern.replace('*', ''));
      }
      return entry.name === pattern || srcPath.includes(pattern);
    })) {
      continue;
    }

    try {
      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (error) {
      console.error(`⚠️  Error copying ${srcPath}: ${error.message}`);
    }
  }
}

function createManifest() {
  const manifest = {
    timestamp: new Date().toISOString(),
    backupPath: BACKUP_PATH,
    gitCommit: getGitCommit(),
    files: countFiles(BACKUP_PATH)
  };

  const manifestPath = path.join(BACKUP_PATH, 'backup-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest;
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function countFiles(dir) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(fullPath);
      } else {
        count++;
      }
    }
  } catch {
    // Ignore errors
  }
  return count;
}

function main() {
  console.log('🔄 Creating full project backup...');
  console.log(`📁 Backup location: ${BACKUP_PATH}`);

  ensureBackupDir();

  // Backup critical directories
  const criticalDirs = [
    'src',
    'backend',
    'scripts',
    'public',
    '.vscode',
    '.cursor',
    'lib'
  ];

  // Copy critical directories
  for (const dir of criticalDirs) {
    const src = path.join(PROJECT_ROOT, dir);
    const dest = path.join(BACKUP_PATH, dir);
    if (fs.existsSync(src)) {
      console.log(`📦 Backing up ${dir}...`);
      copyDirectory(src, dest);
    }
  }

  // Backup critical files in root
  const criticalFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'next.config.js',
    'tailwind.config.ts',
    'postcss.config.mjs',
    'vercel.json',
    'railway.json',
    'README.md'
  ];

  const rootDest = path.join(BACKUP_PATH, 'root');
  fs.mkdirSync(rootDest, { recursive: true });

  for (const file of criticalFiles) {
    const src = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(src)) {
      console.log(`📄 Backing up ${file}...`);
      fs.copyFileSync(src, path.join(rootDest, file));
    }
  }

  const manifest = createManifest();

  console.log('\n✅ Backup completed!');
  console.log(`📊 Files backed up: ${manifest.files}`);
  console.log(`🔖 Git commit: ${manifest.gitCommit}`);
  console.log(`📁 Location: ${BACKUP_PATH}`);
  console.log('\n💡 To restore: npm run restore:last');
}

main();

