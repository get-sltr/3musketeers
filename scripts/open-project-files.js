#!/usr/bin/env node

/**
 * Open Essential Project Files Script
 * Automatically opens DAILY_LOG.md, CURSOR_BUILD_GUIDE.md, and cursor rules
 * Run with: npm run open:files or node scripts/open-project-files.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.join(__dirname, '..');

const files = [
  path.join(PROJECT_ROOT, 'DAILY_LOG.md'),
  path.join(PROJECT_ROOT, 'CURSOR_BUILD_GUIDE.md'),
  path.join(PROJECT_ROOT, 'src/app/.cursorrules')
];

console.log('📂 Opening essential project files...');

// Check if files exist
files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  Warning: ${path.basename(file)} not found`);
  }
});

// Try to open with cursor first, then code
const editor = process.env.EDITOR || (process.platform === 'darwin' ? 'cursor' : 'code');

const command = process.platform === 'darwin' 
  ? `open -a "${editor}" ${files.map(f => `"${f}"`).join(' ')}`
  : `${editor} ${files.map(f => `"${f}"`).join(' ')}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error opening files: ${error.message}`);
    console.log('\n📝 Please open these files manually:');
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
    process.exit(1);
  }
  console.log('✅ Files opened in Cursor!');
});

