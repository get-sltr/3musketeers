#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log('🔄 Connecting to Supabase database...\n');
console.log(`📦 Project: ${projectRef}`);

// You'll need to get the database password from Supabase dashboard
// Settings → Database → Connection Info → Password
console.log('\n⚠️  DATABASE PASSWORD REQUIRED');
console.log('═'.repeat(80));
console.log('To get your database password:');
console.log('1. Go to: https://supabase.com/dashboard/project/bnzyzkmixfmylviaojbj/settings/database');
console.log('2. Scroll to "Connection Info"');
console.log('3. Click "Reset database password" if you don\'t have it');
console.log('4. Copy the password');
console.log('5. Set it as env variable: export SUPABASE_DB_PASSWORD="your-password"');
console.log('6. Run this script again');
console.log('═'.repeat(80));

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.log('\n💡 Alternatively, you can run the migration manually:');
  console.log('   1. Open: https://supabase.com/dashboard/project/bnzyzkmixfmylviaojbj/sql/new');
  console.log('   2. Copy SQL from: supabase/migrations/20251111_optimize_rls_policies.sql');
  console.log('   3. Paste and click RUN\n');
  process.exit(0);
}

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const client = new pg.Client({ connectionString });

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251111_optimize_rls_policies.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing RLS optimization migration...');
    console.log('   This will fix 259 performance warnings\n');

    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Improvements applied:');
    console.log('   ✓ Optimized auth.uid() calls with (select auth.uid())');
    console.log('   ✓ Consolidated duplicate permissive policies');
    console.log('   ✓ Dropped duplicate indexes');
    console.log('\n🎉 All 259 performance warnings should now be resolved!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Run manually in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/bnzyzkmixfmylviaojbj/sql/new');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
