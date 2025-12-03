import Stripe from 'stripe'

/**
 * Stripe API version used across the application.
 * Centralizing this ensures consistency when the API version needs to be updated.
 */
export const STRIPE_API_VERSION = '2025-10-29.clover' as const

/**
 * Lazy-initialized Stripe client instance.
 * Avoids creating the client at module load/build time.
 */
let _stripe: Stripe | null = null

/**
 * Returns the Stripe client instance, creating it lazily on first call.
 * Throws an error if STRIPE_SECRET_KEY is not configured.
 *
 * Use this for operations where Stripe is required and should fail fast.
 *
 * @throws {Error} If STRIPE_SECRET_KEY environment variable is not set
 * @returns {Stripe} The Stripe client instance
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  }
  return _stripe
}

/**
 * Returns the Stripe client instance or null if not configured.
 * Use this for operations where Stripe is optional and the caller
 * wants to handle the missing configuration gracefully.
 *
 * @returns {Stripe | null} The Stripe client instance or null if not configured
 */
export function getStripeOrNull(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return null
    }
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  }
  return _stripe
}
