import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover'
})
  : null

// Lazy initialization to avoid build-time errors when env vars aren't available
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(url, key)
}

// Price IDs - these should be created in Stripe Dashboard
const PRICE_IDS = {
  founder: process.env.STRIPE_FOUNDER_PRICE_ID || 'price_founder', // One-time $199
  member: process.env.STRIPE_MEMBER_PRICE_ID || 'price_member', // Monthly $12.99
}

const FOUNDER_LIMIT = 2000

// Allowed origins for success/cancel URLs to prevent open redirect
const ALLOWED_ORIGINS = [
  'https://getsltr.com',
  'https://www.getsltr.com',
  'https://sltr.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
]
// Minimum length of the random portion after 'price_' prefix
// Stripe price IDs typically have 14-24 characters after the prefix
const STRIPE_PRICE_ID_MIN_LENGTH = 8

/**
 * Validate that a price ID is properly configured
 * Must start with 'price_' and be a valid Stripe price ID format
 */
function isValidPriceId(priceId: string | undefined): boolean {
  if (!priceId) return false
  // Stripe price IDs start with 'price_' followed by alphanumeric characters
  const pattern = new RegExp(`^price_[a-zA-Z0-9]{${STRIPE_PRICE_ID_MIN_LENGTH},}$`)
  return pattern.test(priceId)
}

/**
 * Get a safe origin for redirect URLs
 * Returns an allowed origin or falls back to production
 */
function getSafeOrigin(requestOrigin: string | null): string {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin
  }
  // Default to production URL
  return 'https://getsltr.com'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get founder count
    if (action === 'founder-count') {
      const supabase = getSupabaseClient()
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('founder', true)

      const taken = count || 0
      const remaining = Math.max(0, FOUNDER_LIMIT - taken)

      return NextResponse.json({
        remaining,
        taken,
        available: remaining > 0
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    console.error('Stripe API Error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { priceType, userId, email } = await request.json()

    if (!priceType || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Check if user has a profile (optional)
    const supabase = getSupabase()
    const { data: user } = await supabase
      .from('profiles')
      .select('id, founder, subscription_status')
      .eq('id', userId)
      .single()

    // Check if founder and trying to buy founder again
    if (priceType === 'founder' && user?.founder) {
      return NextResponse.json(
        { error: 'You are already a founder' },
        { status: 400 }
      )
    }

    // Check founder availability
    if (priceType === 'founder') {
      const { count } = await getSupabase()
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('founder', true)

      if ((count || 0) >= FOUNDER_LIMIT) {
        return NextResponse.json(
          { error: 'Founder\'s Circle is sold out' },
          { status: 400 }
        )
      }
    }

    const priceId = PRICE_IDS[priceType as keyof typeof PRICE_IDS]
    
    // Validate price ID format (must be properly configured)
    if (!isValidPriceId(priceId)) {
      console.error(`Invalid price ID for ${priceType}: ${priceId}`)
      return NextResponse.json(
        { 
          error: 'Payment processing is temporarily unavailable. Price configuration error.',
          code: 'PRICE_NOT_CONFIGURED'
        },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    if (!stripe) {
      console.error('Stripe secret key is not configured')
      return NextResponse.json(
        { 
          error: 'Payment processing is currently unavailable. Please try again later.',
          code: 'STRIPE_NOT_CONFIGURED'
        },
        { status: 503 }
      )
    }

    // Get safe origin for redirect URLs (prevent open redirect)
    const requestOrigin = request.headers.get('origin')
    const safeOrigin = getSafeOrigin(requestOrigin)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: priceType === 'founder' ? 'payment' : 'subscription',
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        priceType,
      },
      success_url: `${safeOrigin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed'
    console.error('Stripe Checkout Error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}