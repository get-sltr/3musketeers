#!/usr/bin/env node

/**
 * Restore Backup Script
 * Restores project from last backup
 * Run with: npm run restore:last
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.backups');

function getLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ No backups found!');
    process.exit(1);
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('backup-'))
    .map(name => ({
      name,
      path: path.join(BACKUP_DIR, name),
      time: fs.statSync(path.join(BACKUP_DIR, name)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length === 0) {
    console.error('❌ No backups found!');
    process.exit(1);
  }

  return backups[0];
}

function restoreDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    try {
      if (entry.isDirectory()) {
        restoreDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Restored: ${destPath}`);
      }
    } catch (error) {
      console.error(`⚠️  Error restoring ${srcPath}: ${error.message}`);
    }
  }
}

function main() {
  console.log('🔄 Restoring from backup...\n');

  const backup = getLatestBackup();
  console.log(`📁 Restoring from: ${backup.name}`);
  console.log(`📅 Backup date: ${backup.time.toISOString()}\n`);

  // Restore critical directories
  const dirsToRestore = ['src', 'backend', 'scripts', 'public', '.vscode', '.cursor', 'lib'];

  for (const dir of dirsToRestore) {
    const src = path.join(backup.path, dir);
    const dest = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(src)) {
      console.log(`📦 Restoring ${dir}...`);
      restoreDirectory(src, dest);
    }
  }

  // Restore root files
  const rootBackup = path.join(backup.path, 'root');
  if (fs.existsSync(rootBackup)) {
    const files = fs.readdirSync(rootBackup);
    for (const file of files) {
      const src = path.join(rootBackup, file);
      const dest = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Restored: ${file}`);
      }
    }
  }

  console.log('\n✅ Restoration completed!');
  console.log('⚠️  Please run: npm run validate:post');
  console.log('⚠️  Then test: npm run dev');
}

main();

