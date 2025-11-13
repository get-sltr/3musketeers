const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMessagesTable() {
  console.log('🔍 Checking messages table structure...')
  
  try {
    // Check messages table structure
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Messages table error:', error.message)
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Messages table columns:', Object.keys(data[0]))
    } else {
      console.log('📋 Messages table exists but is empty')
    }
    
    // Check conversations table structure
    console.log('\n🔍 Checking conversations table structure...')
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)
    
    if (convError) {
      console.log('❌ Conversations table error:', convError.message)
      return
    }
    
    if (convData && convData.length > 0) {
      console.log('✅ Conversations table columns:', Object.keys(convData[0]))
    } else {
      console.log('📋 Conversations table exists but is empty')
    }
    
    // Check if there are any messages
    const { data: allMessages, error: msgError } = await supabase
      .from('messages')
      .select('*')
    
    if (!msgError) {
      console.log(`\n📊 Total messages in database: ${allMessages?.length || 0}`)
      if (allMessages && allMessages.length > 0) {
        console.log('Sample message:', allMessages[0])
      }
    }
    
  } catch (err) {
    console.error('❌ Check failed:', err.message)
  }
}

checkMessagesTable()
