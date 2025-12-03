import Stripe from 'stripe'

/**
 * Centralized Stripe client with lazy initialization.
 * Avoids creating client at build time - only initializes when first used at runtime.
 */
let _stripe: Stripe | null = null

/**
 * Returns a lazily-initialized Stripe client instance.
 * @throws {Error} If STRIPE_SECRET_KEY is not configured
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    _stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })
  }
  return _stripe
}

/**
 * Returns a lazily-initialized Stripe client instance, or null if not configured.
 * Use this variant when you want to handle missing configuration gracefully.
 */
export function getStripeOrNull(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return null
    }
    _stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })
  }
  return _stripe
}
