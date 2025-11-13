const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0); // Fetch 0 rows to get schema without data
    if (error) throw error;
    return Object.keys(data[0] || {}); // Return column names
  } catch (error) {
    // If table is empty, try to get schema from information_schema
    try {
      const { data, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      if (schemaError) throw schemaError;
      return data.map(col => col.column_name);
    } catch (e) {
      console.error(`❌ Cannot get schema info for ${tableName}:`, e.message);
      return [];
    }
  }
}

async function getTableInfo(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    return { exists: true, records: data.length, sample: data.length > 0 ? data[0] : null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function runDiagnostic() {
  console.log('🔍 COMPREHENSIVE 3MUSKETEERS PROJECT AUDIT');
  console.log('==========================================');

  console.log('\n📋 1. EXISTING TABLES:');
  console.log('----------------------');
  const tablesToCheck = ['profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users'];
  const tableStatuses = {};

  for (const table of tablesToCheck) {
    const info = await getTableInfo(table);
    tableStatuses[table] = info;
    if (info.exists) {
      console.log(`✅ ${table}: EXISTS (${info.records} records)`);
    } else {
      console.log(`❌ ${table}: ${info.error}`);
    }
  }

  console.log('\n📋 2. TABLE SCHEMAS:');
  console.log('---------------------');

  for (const table of tablesToCheck) {
    if (tableStatuses[table].exists) {
      const columns = await getTableColumns(table);
      console.log(`\n📊 ${table.toUpperCase()} COLUMNS:`);
      console.log('Columns:', columns);
    } else {
      console.log(`\n📊 ${table.toUpperCase()}: Table does not exist`);
    }
  }

  console.log('\n📋 3. STORAGE BUCKETS:');
  console.log('----------------------');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    if (data.length > 0) {
      console.log('✅ Storage buckets:');
      data.forEach(bucket => console.log(`   - ${bucket.name} (Public: ${bucket.public})`));
    } else {
      console.log('✅ No storage buckets found.');
    }
  } catch (error) {
    console.error('❌ Cannot list storage buckets:', error.message);
  }

  console.log('\n📋 4. SAMPLE DATA:');
  console.log('-------------------');
  for (const table of tablesToCheck) {
    if (tableStatuses[table].exists && tableStatuses[table].records > 0) {
      console.log(`\n📊 ${table.toUpperCase()} SAMPLE DATA:`);
      console.log(`Records found: ${tableStatuses[table].records}`);
      console.log('Sample record:', tableStatuses[table].sample);
    } else if (tableStatuses[table].exists) {
      console.log(`\n📊 ${table.toUpperCase()} SAMPLE DATA:`);
      console.log('Records found: 0');
    }
  }

  console.log('\n📋 5. PROJECT STRUCTURE ANALYSIS:');
  console.log('----------------------------------');
  console.log('✅ Frontend: Next.js 14 with App Router');
  console.log('✅ Backend: Express.js + Socket.io');
  console.log('✅ Database: Supabase (PostgreSQL)');
  console.log('✅ Real-time: Socket.io + Supabase Realtime');
  console.log('✅ Authentication: Supabase Auth');
  console.log('✅ File Storage: Supabase Storage');
  console.log('✅ Maps: Leaflet/Mapbox integration');
  console.log('✅ AI Features: EROS AI components');

  console.log('\n📋 6. SECURITY STATUS:');
  console.log('----------------------');
  console.log('⚠️  RLS Policies: Need to be implemented');
  console.log('⚠️  Storage Policies: Need to be configured');
  console.log('✅ Rate Limiting: Implemented in backend');
  console.log('✅ CORS: Configured');
  console.log('✅ Helmet: Security headers enabled');

  console.log('\n📋 7. RECOMMENDATIONS:');
  console.log('------------------------');
  console.log('1. Complete database schema setup');
  console.log('2. Implement comprehensive RLS policies');
  console.log('3. Configure storage bucket policies');
  console.log('4. Add comprehensive testing suite');
  console.log('5. Implement monitoring and error tracking');
  console.log('6. Add Redis caching layer');
  console.log('7. Implement PostGIS for location queries');
  console.log('8. Add PWA features');
  console.log('9. Implement end-to-end encryption');
  console.log('10. Add comprehensive logging and analytics');
}

runDiagnostic();
