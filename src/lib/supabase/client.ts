import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Check if we have real Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
    console.error('❌ Supabase credentials not configured!')
    console.error('Please set up your Supabase project and add credentials to .env.local')
    console.error('Go to: https://supabase.com to create a free project')
    
    // Return a mock client that will show errors
    return createBrowserClient('https://demo.supabase.co', 'demo-key')
  }
  
  // Only log in development to reduce console spam
  // Check both NODE_ENV and if we're running on localhost
  const isDev = process.env.NODE_ENV === 'development' || 
                (typeof window !== 'undefined' && 
                 (window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1'))
  
  if (isDev) {
    console.log('✅ Supabase configured:', supabaseUrl)
  }
  return createBrowserClient(supabaseUrl, supabaseKey)
}
