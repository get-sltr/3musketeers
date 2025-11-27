'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTierConfig, TierType } from '@/config/tiers'
import { invalidateProfileCache } from '@/hooks/usePrivileges'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<TierType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sessionId = searchParams?.get('session_id')

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | null = null
    
    async function verifyPayment() {
      if (!sessionId) {
        router.push('/app')
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        // 🔓 INSTANT UNLOCK: Clear cached profile to ensure fresh tier data
        invalidateProfileCache(user.id)

        // Get user's profile to see their tier
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()

        if (profile?.subscription_tier) {
          setTier(profile.subscription_tier as TierType)
        }

        setLoading(false)

        // Auto-redirect to app after 5 seconds
        redirectTimer = setTimeout(() => {
          router.push('/app')
        }, 5000)

      } catch (err) {
        console.error('Error verifying payment:', err)
        setError('Unable to verify payment. Please check your email for confirmation.')
        setLoading(false)
      }
    }

    verifyPayment()
    
    // Cleanup: Clear redirect timer on unmount
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">Verifying payment...</p>
        </div>
      </div>
    )
  }

  const tierConfig = tier ? getTierConfig(tier) : null

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <style>
        {`
          .glass-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #00d4ff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .success-glow {
            box-shadow: 0 0 60px rgba(0, 212, 255, 0.4);
          }

          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }

          .confetti {
            animation: confetti 3s ease-in forwards;
            position: fixed;
            pointer-events: none;
            z-index: 1;
          }

          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .bounce-animation {
            animation: bounce 0.6s ease-in-out;
          }
        `}
      </style>

      {/* Confetti Elements */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="confetti text-4xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-50px`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        >
          {['🎉', '✨', '⭐', '🔥'][Math.floor(Math.random() * 4)]}
        </div>
      ))}

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl md:text-7xl font-black tracking-wider gradient-text mb-2"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            SLTR
          </h1>
          <p className="text-white/60 text-sm tracking-widest uppercase">
            RULES DON'T APPLY
          </p>
        </div>

        {/* Success Card */}
        <div className="glass-card success-glow rounded-3xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bounce-animation"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Welcome to <span style={{ color: tierConfig?.color || '#00d4ff' }}>{tierConfig?.displayName}!</span>
          </h2>

          <div className="text-6xl mb-6">{tierConfig?.badge || '✨'}</div>

          <p className="text-xl text-white/80 mb-8">
            Your payment was successful. You now have full access to all {tierConfig?.name} features!
          </p>

          {error && (
            <div className="glass-card bg-red-500/10 border-red-500/50 rounded-2xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* What's Next */}
          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold mb-4 gradient-text">What's next:</h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Complete your profile to get started</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Explore the map and discover nearby users</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Start connecting - unlimited messages await!</span>
              </li>
              {tier === 'founder' && (
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 font-bold">4.</span>
                  <span>Check your email for your Founder's channel invite</span>
                </li>
              )}
              {tier === 'blackcard' && (
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">4.</span>
                  <span>Check your email for your exclusive Black Card welcome</span>
                </li>
              )}
            </ul>
          </div>

          {/* CTA Button */}
          <Link
            href="/app"
            className="inline-block px-12 py-4 rounded-2xl text-white text-lg font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)'
            }}
          >
            Go to App
          </Link>

          <p className="text-white/40 text-sm mt-6">
            Redirecting automatically in 5 seconds...
          </p>
        </div>

        {/* Receipt Notice */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            📧 A receipt has been sent to your email
          </p>
        </div>
      </div>
    </div>
  )
}
