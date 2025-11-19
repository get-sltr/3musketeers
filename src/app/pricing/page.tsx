'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

interface CheckoutButtonProps {
  priceType: 'founder' | 'member'
  className?: string
  disabled?: boolean
  children?: React.ReactNode
}

function CheckoutButton({ priceType, className, disabled, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const user = useUser()
  const supabase = createClient()

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing'
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          priceType,
          userId: user.id,
          email: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleCheckout}
        disabled={loading || disabled}
        className={className}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : (
          children || (priceType === 'founder' ? 'Join Founder\'s Circle - $199' : 'Subscribe - $12.99/mo')
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </>
  )
}

// Founder Count Component
function FounderCount() {
  const [count, setCount] = useState<{
    remaining: number
    taken: number
    available: boolean
  } | null>(null)

  useEffect(() => {
    fetch('/api/stripe?action=founder-count')
      .then(res => res.json())
      .then(data => setCount(data))
      .catch(console.error)
  }, [])

  if (!count) return null

  return (
    <div className="text-center mb-4">
      <div className="text-3xl font-bold text-yellow-500">{count.remaining}</div>
      <div className="text-sm text-gray-400">spots remaining</div>
      <div className="mt-2">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${(count.taken / 2000) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Main Pricing Page
export default function PricingPage() {
  const user = useUser()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-center mb-6"
          >
            <span className="text-white">sltr</span>
            <span className="text-lime-400" style={{ verticalAlign: 'super', fontSize: '1.2em', position: 'relative', top: '-0.5em' }}>∝</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-center text-gray-400 max-w-2xl mx-auto"
          >
            Explore features and services designed to enhance your experience
          </motion.p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-white/5 backdrop-blur rounded-3xl p-8 border border-white/10"
          >
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-400 mb-6">Get started with basic features</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-gray-400 ml-2">forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                '100 profile views/day',
                '50 messages/day',
                'Basic search & filters',
                'DTFN badge (4 activations)',
                'Basic map (10 mile radius)',
              ].map((feature) => (
                <li key={feature} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
              {[
                'No video calls',
                'No groups & channels',
                'No travel mode',
                'Contains ads',
              ].map((feature) => (
                <li key={feature} className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-gray-500">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="w-full py-3 bg-white/10 rounded-xl font-semibold text-gray-400">
              Current Plan
            </button>
          </motion.div>

          {/* SLTR⁺ Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-b from-lime-400/20 to-transparent rounded-3xl p-8 border-2 border-lime-400/50"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-lime-400 text-black rounded-full text-sm font-semibold">
              RECOMMENDED
            </div>
            
            <h3 className="text-2xl font-bold mb-2">
              <span className="text-white">sltr</span>
              <span className="text-lime-400" style={{ verticalAlign: 'super', fontSize: '1.2em', position: 'relative', top: '-0.3em' }}>∝</span>
            </h3>
            <p className="text-gray-400 mb-6">Everything you need to connect</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold text-lime-400">$4.99</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                '📹 Video Calls',
                '👥 Create Groups & Channels',
                '✈️ Travel Mode (worldwide)',
                '⚡ Unlimited DTFN',
                '👁️ See Who Viewed You',
                '💬 Unlimited Messaging',
                '🔓 Unlimited Profile Views',
                '🚫 Ad-Free Experience',
                '✓ Read Receipts',
                '🎯 Advanced Filters',
                '🗺️ Extended Map Range',
                '🔒 Enhanced Privacy Controls',
                '📍 Location Spoofing',
                '🎭 Incognito Mode',
                '📸 Private Photo Albums',
                '🏆 Profile Boost'
              ].map((feature) => (
                <li key={feature} className="flex items-start">
                  <svg className="w-5 h-5 text-lime-400 mr-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <CheckoutButton 
              priceType="member"
              className="w-full py-3 bg-lime-400 text-black rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Get sltr∝ - $4.99/mo
            </CheckoutButton>
            <p className="text-xs text-center text-gray-500 mt-2">Billed monthly. Cancel anytime, no commitments.</p>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <div className="mt-20 flex flex-wrap justify-center items-center gap-8 text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span>256-bit SSL Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <span>PCI-DSS Certified Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">↩️</span>
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span>Money-Back Guarantee</span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your Member subscription anytime from your profile settings. You\'ll keep access until the end of your billing period.'
              },
              {
                q: 'What happens if I miss out on Founder\'s Circle?',
                a: 'Once all 2000 spots are taken, Founder\'s Circle closes forever. It will never be offered again at any price.'
              },
              {
                q: 'Do I need a credit card for the free trial?',
                a: 'Yes, but you won\'t be charged until after your 7-day trial ends. Cancel anytime during the trial to avoid charges.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, and digital wallets through our PCI-DSS certified payment processors.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

