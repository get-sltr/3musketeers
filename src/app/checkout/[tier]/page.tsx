'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { csrfFetch } from '@/lib/csrf-client'
import { getTierConfig, TierType, formatPrice } from '@/config/tiers'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage({
  params 
}: { 
  params: Promise<{ tier: string }> 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [tier, setTier] = useState<string | null>(null)
  const canceled = searchParams?.get('canceled') === 'true'

  useEffect(() => {
    async function initializePage() {
      const { tier: tierParam } = await params
      
      // Validate tier
      if (!['member', 'founder'].includes(tierParam)) {
        router.push('/signup')
        return
      }

      setTier(tierParam)

      // Check if user is logged in
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Not logged in - redirect to signup with tier parameter
        router.push(`/signup?tier=${tierParam}`)
      } else {
        setUser(user)
      }
    }

    initializePage()
  }, [params, router])

  const handleCheckout = async () => {
    if (!tier || !user) return

    setLoading(true)
    setError(null)

    try {
      // Create checkout session
      const response = await csrfFetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (!data.url) {
        throw new Error('No checkout URL returned')
      }

      // Redirect to the checkout URL
      window.location.href = data.url

    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  if (!user || !tier) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const tierConfig = getTierConfig(tier as TierType)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <Link
          href={tier === 'founder' ? '/founders-circle' : '/sltr-plus'}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl md:text-5xl font-black tracking-wider gradient-text mb-2"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            SLTR
          </h1>
          <p className="text-white/60 text-sm tracking-widest uppercase">
            RULES DON'T APPLY
          </p>
        </div>

        {/* Canceled Message */}
        {canceled && (
          <div className="glass-card border-orange-500/50 rounded-2xl p-4 mb-6">
            <p className="text-orange-400 text-center">
              Payment was canceled. You can try again below.
            </p>
          </div>
        )}

        {/* Main Checkout Card */}
        <div className="glass-card rounded-3xl p-8 md:p-12">
          {/* Tier Badge */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-4xl">{tierConfig.badge}</span>
            <h2 className="text-2xl md:text-3xl font-black gradient-text">
              {tierConfig.displayName}
            </h2>
          </div>

          {/* Price */}
          <div className="text-center mb-8">
            <div className="text-5xl md:text-6xl font-black gradient-text mb-2">
              ${tierConfig.price}
              {tierConfig.interval === 'month' && <span className="text-3xl text-white/60">/mo</span>}
            </div>
            <p className="text-white/60">
              {tierConfig.interval === 'month' ? 'Billed monthly • Cancel anytime' : 'One-time payment • Lifetime access'}
            </p>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">What's included:</h3>
            <ul className="space-y-3">
              {tierConfig.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">✓</span>
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card bg-red-500/10 border-red-500/50 rounded-2xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: loading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #00d4ff, #ff00ff)'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Continue to Payment`
            )}
          </button>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-xs">
              🔒 Secure payment powered by Stripe
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-white/40 text-xs mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-white">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-white">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
