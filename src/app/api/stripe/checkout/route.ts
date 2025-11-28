import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-29.clover',
  })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  try {
    const { tier } = await req.json()
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile (optional - will fallback to auth email)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', user.id)
      .single()

    // Define tier pricing
    const tierConfig: Record<string, { priceId: string; amount: number; name: string }> = {
      member: {
        priceId: process.env.STRIPE_PRICE_MEMBER!,
        amount: 1299, // $12.99
        name: 'Premium Member'
      },
      founder: {
        priceId: process.env.STRIPE_PRICE_FOUNDER!,
        amount: 19900, // $199
        name: "Founder's Circle"
      },
      blackcard: {
        priceId: process.env.STRIPE_PRICE_BLACKCARD!,
        amount: 99900, // $999
        name: 'Black Card'
      }
    }

    const config = tierConfig[tier]
    if (!config) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: profile?.email || user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      mode: tier === 'member' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?payment=cancelled`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
