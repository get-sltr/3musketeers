import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover'
})
  : null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Price IDs - these should be created in Stripe Dashboard
const PRICE_IDS = {
  founder: process.env.STRIPE_FOUNDER_PRICE_ID || 'price_founder', // One-time $199
  member: process.env.STRIPE_MEMBER_PRICE_ID || 'price_member', // Monthly $12.99
}

const FOUNDER_LIMIT = 2000

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get founder count
    if (action === 'founder-count') {
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
      const { count } = await supabase
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
        { error: 'Price ID not configured. Please set STRIPE_FOUNDER_PRICE_ID and STRIPE_MEMBER_PRICE_ID in environment variables.' },
        { status: 500 }
      )
    }

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