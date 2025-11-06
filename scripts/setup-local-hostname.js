#!/usr/bin/env node

/**
 * Script to add getsltr.com to local hosts file
 * This allows accessing the app via http://getsltr.com:3001 locally
 * 
 * Usage: node scripts/setup-local-hostname.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

const HOSTS_FILE = '/etc/hosts';
const HOSTNAME = 'getsltr.com';
const IP = '127.0.0.1';

console.log('🔧 Setting up local hostname mapping for getsltr.com...\n');

// Check if we're on macOS/Linux
if (os.platform() !== 'darwin' && os.platform() !== 'linux') {
  console.error('❌ This script only works on macOS and Linux');
  process.exit(1);
}

// Read current hosts file
let hostsContent = '';
try {
  hostsContent = fs.readFileSync(HOSTS_FILE, 'utf8');
} catch (error) {
  console.error('❌ Could not read hosts file. This script requires sudo privileges.');
  console.error('   Please run: sudo node scripts/setup-local-hostname.js');
  process.exit(1);
}

// Check if entry already exists
if (hostsContent.includes(HOSTNAME)) {
  console.log(`✅ Entry for ${HOSTNAME} already exists in ${HOSTS_FILE}\n`);
  console.log('Current entry:');
  const lines = hostsContent.split('\n');
  lines.forEach(line => {
    if (line.includes(HOSTNAME)) {
      console.log(`  ${line}`);
    }
  });
  console.log('\n✅ Setup complete!');
  console.log('\nYou can access the app at:');
  console.log('  - http://getsltr.com:3001');
  console.log('  - http://localhost:3001\n');
  process.exit(0);
}

// Add the entry
console.log(`📝 Adding ${IP} ${HOSTNAME} to ${HOSTS_FILE}...\n`);
console.log('This requires sudo privileges. You may be prompted for your password.\n');

try {
  // Try to add the entry using sudo
  const entry = `\n# SLTR Local Development\n${IP} ${HOSTNAME}\n`;
  execSync(`echo "${entry}" | sudo tee -a ${HOSTS_FILE} > /dev/null`, {
    stdio: 'inherit'
  });
  
  console.log(`✅ Successfully added ${HOSTNAME} to hosts file!\n`);
  console.log('You can now access the app at:');
  console.log('  - http://getsltr.com:3001');
  console.log('  - http://localhost:3001\n');
  console.log('🎉 Setup complete!\n');
  
} catch (error) {
  console.error('❌ Failed to add entry automatically.');
  console.error('\nPlease run manually:');
  console.error(`   sudo bash -c 'echo "${IP} ${HOSTNAME}" >> ${HOSTS_FILE}'`);
  console.error('\nOr edit /etc/hosts manually and add:');
  console.error(`   ${IP} ${HOSTNAME}`);
  process.exit(1);
}

