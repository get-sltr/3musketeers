#!/usr/bin/env node
// EROS Health Check - Verify all services are properly connected
// Run: node backend/test-eros-health.js

require('dotenv').config();

console.log('🔍 EROS Backend Health Check\n');
console.log('=' .repeat(50));

// 1. Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  PORT: ${process.env.PORT || 3001}`);

// 2. Check service files exist
const fs = require('fs');
const path = require('path');

console.log('\n📁 Service Files:');
const serviceFiles = [
  'services/analyzer.js',
  'services/matcher.js',
  'services/scheduler.js',
  'server.js'
];

serviceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${file}: ${exists ? '✅ Found' : '❌ Missing'}`);
});

// 3. Test service imports
console.log('\n🔌 Service Imports:');
try {
  const { getScheduler } = require('./services/scheduler');
  console.log('  scheduler.js: ✅ Loaded');
  
  const { getMatcher } = require('./services/matcher');
  console.log('  matcher.js: ✅ Loaded');
  
  const { getAnalyzer } = require('./services/analyzer');
  console.log('  analyzer.js: ✅ Loaded');
} catch (error) {
  console.log(`  ❌ Import Error: ${error.message}`);
}

// 4. Test service initialization
console.log('\n🚀 Service Initialization:');
try {
  const { getScheduler } = require('./services/scheduler');
  const { getMatcher } = require('./services/matcher');
  const { getAnalyzer } = require('./services/analyzer');
  
  // Initialize with empty config (will use env vars)
  const scheduler = getScheduler({});
  console.log('  Scheduler: ✅ Initialized');
  
  const matcher = getMatcher({});
  console.log('  Matcher: ✅ Initialized');
  
  const analyzer = getAnalyzer({});
  console.log('  Analyzer: ✅ Initialized');
  
} catch (error) {
  console.log(`  ❌ Initialization Error: ${error.message}`);
}

// 5. Check model consistency
console.log('\n🤖 Claude Model Check:');
const modelFiles = [
  'server.js',
  'services/analyzer.js'
];

modelFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const haiku = content.includes('claude-3-haiku-20240307');
  const sonnet = content.includes('claude-3-5-sonnet');
  
  if (haiku) {
    console.log(`  ${file}: ✅ Using claude-3-haiku-20240307`);
  } else if (sonnet) {
    console.log(`  ${file}: ⚠️  Using Sonnet (should be Haiku)`);
  } else {
    console.log(`  ${file}: ❓ Model not detected`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('\n✅ Health check complete!');
console.log('\nTo start EROS backend:');
console.log('  cd backend && npm start');
console.log('\nTo test in dev mode:');
console.log('  cd backend && npm run dev');
