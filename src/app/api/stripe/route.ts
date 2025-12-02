import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
      _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' })
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
// Stripe price IDs are in format: price_1XXXXXXXXXXXXXXXXXXXXXX (28+ chars)
function getPriceIds() {
  return {
    founder: process.env.STRIPE_FOUNDER_PRICE_ID || '',
    member: process.env.STRIPE_MEMBER_PRICE_ID || process.env.STRIPE_PRICE_MEMBER || '',
  }
}

const FOUNDER_LIMIT = 2000

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
  } catch (error: any) {
    console.error('Stripe API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Request failed' },
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

    const PRICE_IDS = getPriceIds()
    const priceId = PRICE_IDS[priceType as keyof typeof PRICE_IDS]

    // Stripe price IDs should be at least 20 characters (e.g., price_1XXXXXXXXX...)
    if (!priceId || priceId.length < 20) {
      console.error(`Price ID not configured for ${priceType}. Available: founder=${PRICE_IDS.founder?.slice(0,10)}..., member=${PRICE_IDS.member?.slice(0,10)}...`)
      return NextResponse.json(
        { error: 'Payment system is being configured. Please try again shortly or contact support.' },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    if (!stripe) {
      console.error('Stripe secret key is not configured')
      return NextResponse.json(
        { error: 'Payment processing is currently unavailable. Please try again later.' },
        { status: 503 }
      )
    }

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
      success_url: `${request.headers.get('origin') || 'https://getsltr.com'}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin') || 'https://getsltr.com'}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}