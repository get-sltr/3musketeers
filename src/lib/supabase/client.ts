import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // SECURITY: Never use fallback credentials or mock clients
  // This prevents potential security vulnerabilities and makes configuration errors explicit
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment. ' +
      'Visit https://supabase.com to create a project.'
    )
  }

  // Validate that placeholder values haven't been left in place
  if (supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
    throw new Error(
      'Supabase credentials contain placeholder values. ' +
      'Please update your .env.local with real credentials from your Supabase project.'
    )
  }

  // Only log in development to reduce console spam in production
  // In production (getsltr.com), never log to reduce console noise
  const isProduction = typeof window !== 'undefined' &&
                       (window.location.hostname === 'getsltr.com' ||
                        window.location.hostname === 'www.getsltr.com')

  // Only log once per page load, not on every client creation
  // Skip logging entirely in production
  if (!isProduction && typeof window !== 'undefined' && !(window as any).__supabase_logged__) {
    const isDev = process.env.NODE_ENV === 'development' ||
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.includes('.vercel.app')

    if (isDev) {
      console.log('✅ Supabase configured:', supabaseUrl)
      ;(window as any).__supabase_logged__ = true
    }
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
