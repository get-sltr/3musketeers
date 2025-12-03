import Stripe from 'stripe'

/**
 * Stripe API version used across the application.
 * Keep this constant to ensure consistent API behavior.
 */

/**
 * Lazy-initialized Stripe client singleton.
 * Avoids creating the client at build/import time when env vars may not be available.
 */
let _stripe: Stripe | null = null

/**
 * Get the Stripe client instance.
 * Uses lazy initialization to avoid issues during build time.
 *
 * @throws {Error} If STRIPE_SECRET_KEY is not configured
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
 * Get the Stripe client instance, returning null if not configured.
 * Useful for optional Stripe features or graceful degradation.
 *
 * @returns {Stripe | null} The Stripe client instance, or null if not configured
 */
export function getStripeOptional(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return null
    }
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  }
  return _stripe
}
