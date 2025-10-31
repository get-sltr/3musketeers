#!/usr/bin/env node

/**
 * Daily Log Automation Script
 * Automatically creates/updates daily log entries
 * Run with: npm run log:new or node scripts/daily-log.js
 */

const fs = require('fs');
const path = require('path');

const DAILY_LOG_PATH = path.join(__dirname, '..', 'DAILY_LOG.md');

function getTodayDate() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return now.toLocaleDateString('en-US', options);
}

function getDateHeader() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function ensureTodayEntry() {
  if (!fs.existsSync(DAILY_LOG_PATH)) {
    console.error('❌ DAILY_LOG.md not found! Please create it first.');
    process.exit(1);
  }

  const content = fs.readFileSync(DAILY_LOG_PATH, 'utf8');
  const todayHeader = `### ${getDateHeader()}`;
  
  // Check if today's entry already exists
  if (content.includes(todayHeader)) {
    console.log('✅ Today\'s log entry already exists!');
    console.log('📝 Opening log file...');
    return false;
  }

  // Find the SESSION LOGS section and add today's entry
  const sessionLogsIndex = content.indexOf('## 📅 SESSION LOGS');
  
  if (sessionLogsIndex === -1) {
    console.error('❌ Could not find SESSION LOGS section in DAILY_LOG.md');
    process.exit(1);
  }

  // Find the end of the SESSION LOGS section (before the next ##)
  let insertIndex = content.indexOf('\n## ', sessionLogsIndex + 1);
  if (insertIndex === -1) {
    insertIndex = content.length;
  }

  const newEntry = `

${todayHeader}
**Session Start:** ${getTodayDate()}

**Completed:**
- [ ] 

**In Progress:**
- [ ] 

**Blocked/Issues:**
- [ ] 

**Notes:**
- 

---
`;

  const newContent = 
    content.slice(0, insertIndex) + 
    newEntry + 
    content.slice(insertIndex);

  fs.writeFileSync(DAILY_LOG_PATH, newContent, 'utf8');
  console.log('✅ Today\'s log entry created!');
  return true;
}

function updateLastModified() {
  const content = fs.readFileSync(DAILY_LOG_PATH, 'utf8');
  const now = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const updated = content.replace(
    /\*\*Last Updated:\*\*.*/,
    `**Last Updated:** ${now}`
  );
  
  fs.writeFileSync(DAILY_LOG_PATH, updated, 'utf8');
}

function showReminder() {
  console.log('\n📋 DAILY LOG REMINDER');
  console.log('═══════════════════════════════════════');
  console.log('Don\'t forget to update your daily log!');
  console.log('Run: npm run log:new');
  console.log('Or: node scripts/daily-log.js');
  console.log('═══════════════════════════════════════\n');
}

// Main execution
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'remind':
      showReminder();
      break;
    case 'update':
      updateLastModified();
      console.log('✅ Last modified timestamp updated!');
      break;
    default:
      ensureTodayEntry();
      updateLastModified();
      console.log('📝 Don\'t forget to fill in your completed tasks!');
      break;
  }
}

main();

