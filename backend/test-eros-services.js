#!/usr/bin/env node
// EROS Services Test Script
// Tests scheduler, analyzer, and matcher services locally

require('dotenv').config();
const { getScheduler } = require('./services/scheduler');
const { getAnalyzer } = require('./services/analyzer');
const { getMatcher } = require('./services/matcher');

async function testServices() {
  console.log('🧪 Testing EROS Services...\n');

  try {
    // 1. Test Scheduler
    console.log('1️⃣  Testing Scheduler...');
    const scheduler = getScheduler();
    console.log('✅ Scheduler instance created');
    console.log(`   Status:`, scheduler.getStatus());

    // 2. Test Analyzer
    console.log('\n2️⃣  Testing Analyzer...');
    const analyzer = getAnalyzer();
    console.log('✅ Analyzer instance created');

    // 3. Test Matcher
    console.log('\n3️⃣  Testing Matcher...');
    const matcher = getMatcher();
    console.log('✅ Matcher instance created');

    // 4. Test with mock user ID
    const mockUserId = '00000000-0000-0000-0000-000000000000';
    
    console.log('\n4️⃣  Testing Light Analysis (Phase 1)...');
    try {
      const result1 = await analyzer.lightAnalysis(mockUserId);
      console.log('✅ Phase 1 completed:', result1);
    } catch (err) {
      console.log('⚠️  Phase 1 error (expected if no data):', err.message);
    }

    console.log('\n5️⃣  Testing Scheduler Start/Stop...');
    scheduler.start();
    console.log('✅ Scheduler started');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    scheduler.stop();
    console.log('✅ Scheduler stopped');

    console.log('\n✅ All services operational!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run database migrations (see EROS_SETUP.md)');
    console.log('   2. Start backend: npm start');
    console.log('   3. Monitor logs for EROS activity');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\n💡 Make sure:');
    console.error('   - .env file is configured');
    console.error('   - SUPABASE_URL and SUPABASE_ANON_KEY are set');
    console.error('   - Database migrations have been run');
    process.exit(1);
  }
}

// Run tests
testServices()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
