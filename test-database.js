// Test script to check database columns
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database columns...')
  
  try {
    // Test if photos column exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, photos, kinks, tags, party_friendly, dtfn, position, about')
      .limit(1)
    
    if (error) {
      console.error('❌ Database error:', error.message)
      if (error.message.includes('photos')) {
        console.log('🚨 The "photos" column does not exist!')
        console.log('📋 You need to run this SQL in Supabase Dashboard:')
        console.log('')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT \'[]\'::jsonb;')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kinks JSONB DEFAULT \'[]\'::jsonb;')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT \'[]\'::jsonb;')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS party_friendly BOOLEAN DEFAULT false;')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dtfn BOOLEAN DEFAULT false;')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about TEXT;')
        console.log('')
        console.log('🌐 Go to: https://supabase.com/dashboard/project/bnzyzkmixfmylviaojbj/sql')
      }
    } else {
      console.log('✅ Database columns exist!')
      console.log('📊 Sample data:', data)
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message)
  }
}

testDatabase()
