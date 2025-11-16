// Quick script to check blocks table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkBlocks() {
  console.log('🔍 Checking blocks table...\n')
  
  // Get all blocks
  const { data: blocks, error } = await supabase
    .from('blocks')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching blocks:', error)
    return
  }
  
  console.log(`Found ${blocks?.length || 0} blocks in database:`)
  console.table(blocks)
  
  // Check what columns exist
  if (blocks && blocks.length > 0) {
    console.log('\n📋 Columns in blocks table:')
    console.log(Object.keys(blocks[0]))
  }
}

checkBlocks()
