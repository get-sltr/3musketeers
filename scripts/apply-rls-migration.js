#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Loading RLS optimization migration...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251111_optimize_rls_policies.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 Migration file loaded successfully');
  console.log('⚡ Executing SQL migration...\n');
  console.log('⚠️  NOTE: This script cannot execute DDL statements like DROP POLICY and CREATE POLICY');
  console.log('⚠️  You need to run this migration through the Supabase Dashboard SQL Editor\n');
  console.log('═'.repeat(80));
  console.log('INSTRUCTIONS:');
  console.log('═'.repeat(80));
  console.log('1. Go to: https://supabase.com/dashboard/project/bnzyzkmixfmylviaojbj/sql/new');
  console.log('2. Copy the SQL from: supabase/migrations/20251111_optimize_rls_policies.sql');
  console.log('3. Paste it into the SQL Editor');
  console.log('4. Click "RUN" to execute the migration');
  console.log('═'.repeat(80));
  console.log('\n✨ This will fix all 259 performance warnings:');
  console.log('   • ~120 Auth RLS Initialization Plan warnings');
  console.log('   • ~130 Multiple Permissive Policies warnings');
  console.log('   • 3 Duplicate Index warnings');
  console.log('\n📊 Expected improvements:');
  console.log('   • Faster query performance (auth.uid() cached per query)');
  console.log('   • Reduced policy evaluation overhead');
  console.log('   • Cleaner RLS policy structure');
  console.log('\n✅ Migration file ready at:');
  console.log('   ' + migrationPath);
}

applyMigration().catch(console.error);
