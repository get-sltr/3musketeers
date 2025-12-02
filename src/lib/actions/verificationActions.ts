'use server'

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// LAZY INITIALIZATION - avoid creating client at build time
let _stripe: Stripe | null = null
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' })
  }
  return _stripe
}

/**
 * Creates a Stripe Identity verification session
 * This is called from the client to start the verification process
 */
export async function createVerificationSession() {
  const stripe = getStripe()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Call Stripe's API to create a session
  const verificationSession = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: {
      user_id: user.id, // This is how you link it back to your user
    },
  })

  return { secret: verificationSession.client_secret }
}

/**
 * Handles the webhook from Stripe when verification is complete
 * This should be called from your webhook endpoint
 */
export async function handleVerificationWebhook(
  sessionId: string,
  status: 'verified' | 'unverified' | 'requires_input'
) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()

    // Get the verification session from Stripe to get user metadata
    const session = await stripe.identity.verificationSessions.retrieve(sessionId)
    const userId = session.metadata?.user_id

    if (!userId) {
      throw new Error('User ID not found in verification session')
    }

    // Update user's verification status in database
    const { error } = await supabase
      .from('profiles')
      .update({
        verified: status === 'verified',
        verification_status: status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating verification status:', error)
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error handling verification webhook:', error)
    throw new Error(error.message || 'Failed to handle verification webhook')
  }
}

