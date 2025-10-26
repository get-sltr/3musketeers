const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMessaging() {
  console.log('🧪 Testing messaging system...')
  
  try {
    // Check if we can create a conversation
    console.log('📋 Testing conversation creation...')
    
    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(5)
    
    if (profileError) {
      console.log('❌ Error getting profiles:', profileError.message)
      return
    }
    
    console.log(`✅ Found ${profiles.length} profiles:`)
    profiles.forEach(profile => {
      console.log(`  - ${profile.display_name} (${profile.id})`)
    })
    
    if (profiles.length >= 2) {
      // Try to create a conversation between first two profiles
      const user1 = profiles[0].id
      const user2 = profiles[1].id
      
      console.log(`\n📋 Creating conversation between ${profiles[0].display_name} and ${profiles[1].display_name}...`)
      
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user1,
          user2_id: user2
        })
        .select()
        .single()
      
      if (convError) {
        console.log('❌ Error creating conversation:', convError.message)
      } else {
        console.log('✅ Conversation created:', conversation.id)
        
        // Try to send a message
        console.log('\n📋 Testing message sending...')
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user1,
            receiver_id: user2,
            content: 'Test message from database'
          })
          .select()
          .single()
        
        if (msgError) {
          console.log('❌ Error sending message:', msgError.message)
        } else {
          console.log('✅ Message sent:', message.content)
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message)
  }
}

testMessaging()
