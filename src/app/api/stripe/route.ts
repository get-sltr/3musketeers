import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { withCSRFProtection } from '@/lib/csrf-server'

// ============================================
// LAZY INITIALIZATION - DO NOT CREATE CLIENTS AT MODULE LOAD TIME
// Clients are created only when first used at RUNTIME
// ============================================

let _stripe: Stripe | null = null
let _supabase: SupabaseClient | null = null

function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (key) {
      _stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })
    }
  }
  return _stripe
}

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }

    _supabase = createClient(url, key)
  }
  return _supabase
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
      const { count } = await getSupabase()
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
    console.error('Stripe API Error:', error)
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// TODO: Security review - userId and email should come from authenticated session, not request body
// An attacker who knows a user's ID could potentially manipulate their Stripe data
async function postHandler(request: NextRequest) {
  try {
    const { priceType, userId, email } = await request.json()

    if (!priceType || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate price type
    if (!['founder', 'member'].includes(priceType)) {
      return NextResponse.json(
        { error: 'Invalid price type' },
        { status: 400 }
      )
    }

    // Check if user has a profile (optional)
    const { data: user } = await getSupabase()
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

    if (!priceId || !priceId.startsWith('price_')) {
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
    console.error('Stripe Checkout Error:', error)
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(postHandler)
