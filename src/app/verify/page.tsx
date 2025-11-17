'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createVerificationSession } from '@/lib/actions/verificationActions'
import MobileLayout from '@/components/MobileLayout'
import BottomNav from '@/components/BottomNav'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

export default function VerifyPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
    }
    checkAuth()
  }, [router])

  // Create verification session when page loads
  useEffect(() => {
    if (!isAuthenticated) return

    async function createSession() {
      try {
        setStatus('loading')
        const { secret } = await createVerificationSession()
        setClientSecret(secret)
        setStatus('idle')
      } catch (err: any) {
        console.error('Error creating verification session:', err)
        setError(err.message || 'Failed to create verification session')
        setStatus('failed')
      }
    }

    createSession()
  }, [isAuthenticated])

  // Handle verification button click
  const handleVerify = async () => {
    if (!clientSecret) {
      setError('Verification session not ready. Please refresh the page.')
      return
    }

    // Check if Stripe is loaded
    if (!window.Stripe) {
      setError('Verification service is still loading. Please wait a moment and try again.')
        setStatus('failed')
        return
    }

    setStatus('loading')
    setError(null)

    try {
      // Get Stripe publishable key from environment
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured')
      }

      const stripe = (window as any).Stripe(publishableKey)
      const identity = (stripe as any).identity

      // Open Stripe's verification UI
      const { error: verificationError } = await identity.verifyIdentity(clientSecret)

      if (verificationError) {
        setStatus('failed')
        setError(verificationError.message || 'Verification failed. Please try again.')
      } else {
        // Verification submitted successfully
        setStatus('success')
        // Note: Actual verification status will come via webhook
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setStatus('failed')
      setError(err.message || 'An unexpected error occurred. Please try again.')
    }
  }

  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <Script
        src="https://js.stripe.com/v3"
        strategy="beforeInteractive"
      />
      <div className="min-h-screen bg-[#0a0a0f] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <h1 className="text-white text-2xl font-bold">Verify Your Profile</h1>
            <p className="text-white/60 text-sm">Get the verified badge to show you're real</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="glass-bubble p-6 space-y-6">
            {/* Info Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">✅</div>
                <div>
                  <h2 className="text-white font-semibold text-lg mb-1">Why Verify?</h2>
                  <p className="text-white/70 text-sm">
                    Verification helps other users know you're a real person. Verified profiles get:
                  </p>
                </div>
              </div>

              <ul className="space-y-2 ml-12">
                <li className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-cyan-400">✓</span>
                  <span>Verified badge on your profile</span>
                </li>
                <li className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-cyan-400">✓</span>
                  <span>Higher visibility in search results</span>
                </li>
                <li className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="text-cyan-400">✓</span>
                  <span>Increased trust from other users</span>
                </li>
              </ul>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4">
                <p className="text-green-400 text-sm font-semibold mb-2">Verification Submitted!</p>
                <p className="text-green-300/80 text-sm">
                  We'll review your verification and notify you when it's confirmed. This usually takes a few minutes.
                </p>
              </div>
            )}

            {/* Verification Button */}
            <button
              onClick={handleVerify}
              disabled={!clientSecret || status === 'loading' || status === 'success'}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white text-lg"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </span>
              ) : status === 'success' ? (
                'Verification Submitted ✓'
              ) : (
                'Start Verification'
              )}
            </button>

            {/* Privacy Note */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/50 text-xs text-center">
                Your information is securely processed by Stripe Identity. We never store your ID documents.
              </p>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </MobileLayout>
  )
}


