const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check what tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) {
      console.error('❌ Error checking tables:', error.message)
      return
    }
    
    console.log('📋 Tables in your database:')
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })
    
    // Check if conversations table exists
    const hasConversations = tables.some(t => t.table_name === 'conversations')
    const hasMessages = tables.some(t => t.table_name === 'messages')
    
    console.log('\n📊 Messaging tables status:')
    console.log(`  - conversations: ${hasConversations ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`  - messages: ${hasMessages ? '✅ EXISTS' : '❌ MISSING'}`)
    
    if (!hasConversations || !hasMessages) {
      console.log('\n🚨 You need to create the messaging tables!')
      console.log('📋 Run this SQL in Supabase Dashboard:')
      console.log('')
      console.log('-- Create conversations table')
      console.log('CREATE TABLE IF NOT EXISTS conversations (')
      console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
      console.log('  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,')
      console.log('  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,')
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),')
      console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
      console.log(');')
      console.log('')
      console.log('-- Create messages table')
      console.log('CREATE TABLE IF NOT EXISTS messages (')
      console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
      console.log('  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,')
      console.log('  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,')
      console.log('  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,')
      console.log('  content TEXT NOT NULL,')
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
      console.log(');')
    }
    
  } catch (err) {
    console.error('❌ Schema check failed:', err.message)
  }
}

checkSchema()
