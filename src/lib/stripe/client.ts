import Stripe from 'stripe'

/**
 * Centralized Stripe client with lazy initialization.
 *
 * This module provides a single source of truth for Stripe client initialization,
 * ensuring consistent configuration across all API routes and server actions.
 *
 * The lazy initialization pattern prevents the client from being created at build time,
 * which would fail if STRIPE_SECRET_KEY is not available during the build process.
 */

const STRIPE_API_VERSION = '2025-10-29.clover' as const

let _stripe: Stripe | null = null

/**
 * Returns a lazily-initialized Stripe client.
 * Throws an error if STRIPE_SECRET_KEY is not configured.
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
 * Returns a lazily-initialized Stripe client, or null if not configured.
 * Use this variant when you want to handle missing configuration gracefully.
 *
 * @returns {Stripe | null} The Stripe client instance, or null if not configured
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
