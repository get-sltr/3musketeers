const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Checking what tables exist...')
  
  try {
    // Try to query each table to see if it exists
    const tablesToCheck = ['profiles', 'conversations', 'messages', 'auth.users']
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: EXISTS`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }
    
    // Check profiles table structure
    console.log('\n📋 Profiles table structure:')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (!error && data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
      }
    } catch (err) {
      console.log('Error checking profiles:', err.message)
    }
    
  } catch (err) {
    console.error('❌ Check failed:', err.message)
  }
}

checkTables()
