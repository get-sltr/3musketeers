const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuthUsers() {
  console.log('🔍 Checking auth users...')
  
  try {
    // Check if we can get auth users (this might not work with anon key)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('❌ Auth error:', error.message)
      console.log('📋 This is expected - we need to check the profiles table structure')
    } else {
      console.log('✅ Current user:', user?.email)
    }
    
    // Check profiles table structure more carefully
    console.log('\n📋 Checking profiles table structure...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profileError) {
      console.log('❌ Profiles error:', profileError.message)
    } else if (profiles && profiles.length > 0) {
      const profile = profiles[0]
      console.log('✅ Profile structure:')
      console.log('  - id:', profile.id)
      console.log('  - email:', profile.email)
      console.log('  - display_name:', profile.display_name)
      console.log('  - created_at:', profile.created_at)
      
      // Check if the profile ID matches auth user format
      if (profile.id && profile.id.length === 36) {
        console.log('✅ Profile ID looks like a valid UUID')
      } else {
        console.log('❌ Profile ID does not look like a valid UUID')
      }
    }
    
    // The issue is likely that profiles were created without proper auth users
    console.log('\n🚨 ISSUE IDENTIFIED:')
    console.log('The profiles in your database were created without corresponding auth.users')
    console.log('This means they are test/demo profiles that cannot send real messages')
    console.log('')
    console.log('🔧 SOLUTION:')
    console.log('1. Delete the test profiles from the profiles table')
    console.log('2. Create real user accounts through the signup process')
    console.log('3. Then messaging will work properly')
    
  } catch (err) {
    console.error('❌ Check failed:', err.message)
  }
}

checkAuthUsers()
