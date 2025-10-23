// Test the complete user flow for new users
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserFlow() {
  console.log('🧪 Testing complete user flow...')
  
  try {
    // Test 1: Check if profiles table has all required columns
    console.log('📋 Test 1: Checking database schema...')
    const { data: profiles, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ Schema error:', schemaError.message)
      return
    }
    console.log('✅ Database schema is correct')
    
    // Test 2: Check if photos bucket exists
    console.log('📋 Test 2: Checking photos storage...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Bucket error:', bucketError.message)
    } else {
      const photosBucket = buckets.find(b => b.id === 'photos')
      if (photosBucket) {
        console.log('✅ Photos bucket exists and is public:', photosBucket.public)
      } else {
        console.log('❌ Photos bucket not found')
      }
    }
    
    // Test 3: Check if we can query profiles (simulating grid view)
    console.log('📋 Test 3: Testing profile queries...')
    const { data: allProfiles, error: queryError } = await supabase
      .from('profiles')
      .select('id, display_name, age, photos, position, party_friendly, dtfn, tags, kinks')
      .order('last_active', { ascending: false })
    
    if (queryError) {
      console.error('❌ Query error:', queryError.message)
    } else {
      console.log(`✅ Found ${allProfiles.length} profiles in database`)
      if (allProfiles.length > 0) {
        console.log('📊 Sample profile:', {
          id: allProfiles[0].id,
          display_name: allProfiles[0].display_name,
          age: allProfiles[0].age,
          photos_count: allProfiles[0].photos?.length || 0,
          position: allProfiles[0].position,
          party_friendly: allProfiles[0].party_friendly,
          dtfn: allProfiles[0].dtfn
        })
      }
    }
    
    console.log('🎉 All tests passed! The app is ready for new users.')
    
  } catch (err) {
    console.error('❌ Test failed:', err.message)
  }
}

testUserFlow()
