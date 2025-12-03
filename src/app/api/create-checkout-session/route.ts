import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTierConfig, TierType } from '@/config/tiers'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  try {
    const { tier, userId } = await request.json()

    // Validate tier
    if (!tier || !['member', 'founder'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    // Get tier configuration
    const tierConfig = getTierConfig(tier as TierType)
    
    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: 'This tier is not available for checkout' },
        { status: 400 }
      )
    }

    // Get user from Supabase to verify they're logged in
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in first' },
        { status: 401 }
      )
    }

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', user.id)
      .single()

    // Determine success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://getsltr.com'
    const successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/checkout/${tier}?canceled=true`

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: profile?.email || user.email,
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: tierConfig.interval === 'month' ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        tier: tier,
        displayName: profile?.display_name || '',
      },
      subscription_data: tierConfig.interval === 'month' ? {
        metadata: {
          userId: user.id,
          tier: tier,
        },
      } : undefined,
    })

    // Update user's profile to pending_payment status
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error: any) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
