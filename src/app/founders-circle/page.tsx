'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TOTAL_FOUNDERS = 2000

export default function FoundersCirclePage() {
  const [founderCount, setFounderCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function getFounderCount() {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_tier', 'founder')

        if (error) {
          console.error('Error fetching founder count:', error)
          setError('Unable to load live count right now.')
          return
        }

        if (count !== null) {
          setFounderCount(count)
          setError(null)
        }
      } catch (err) {
        console.error('Unexpected error fetching founder count:', err)
        setError('Unable to load live count right now.')
      } finally {
        setLoading(false)
      }
    }

    getFounderCount()

    const interval = setInterval(getFounderCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const safeCount = Math.max(0, Math.min(founderCount, TOTAL_FOUNDERS))
  const spotsRemaining = Math.max(0, TOTAL_FOUNDERS - safeCount)
  const percentageClaimed =
    (safeCount / TOTAL_FOUNDERS) * 100

  return (
    <div className="min-h-screen bg-black text-white">
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
          
          .founder-glow {
            box-shadow: 0 0 40px rgba(255, 107, 53, 0.3);
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-16">
        {/* Background Gradient */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-fuchsia-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-6 md:mb-8">
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-black tracking-wider mb-2 md:mb-4"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="gradient-text">SLTR</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm md:text-base tracking-widest uppercase">
              RULES DON&apos;T APPLY
            </p>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full glass-card mb-6 md:mb-8">
            <span className="text-2xl sm:text-3xl">👑</span>
            <span className="text-amber-400 font-bold text-sm sm:text-lg">
              FOUNDER&apos;S CIRCLE
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-6 leading-tight">
            Join the Elite{' '}
            <span className="gradient-text">{TOTAL_FOUNDERS.toLocaleString()}</span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 md:mb-8 max-w-3xl mx-auto">
            One payment. Lifetime access. Exclusive perks.
            <br className="hidden sm:block" />
            <span className="text-amber-400 font-bold">
              Only {TOTAL_FOUNDERS.toLocaleString()} spots available. Ever.
            </span>
          </p>

          {/* Counter */}
          <div className="glass-card founder-glow rounded-3xl p-6 sm:p-8 mb-8 md:mb-12 max-w-2xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-40 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-white/10 rounded-full animate-pulse" />
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-orange-400 to-amber-300 animate-pulse" />
                </div>
                <div className="h-5 w-48 bg-white/10 rounded-full animate-pulse" />
                <p className="text-xs text-white/40 mt-2">
                  Loading live founder count...
                </p>
              </div>
            ) : (
              <>
                <div className="text-4xl sm:text-5xl md:text-6xl font-black gradient-text mb-2 sm:mb-4">
                  {safeCount.toLocaleString()} / {TOTAL_FOUNDERS.toLocaleString()}
                </div>
                <div className="text-white/70 text-sm sm:text-base mb-2">
                  Founders claimed
                </div>

                {/* Progress Bar */}
                <div
                  className="w-full bg-white/10 rounded-full h-4 overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_FOUNDERS}
                  aria-valuenow={safeCount}
                  aria-label="Founder's Circle spots claimed"
                >
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${percentageClaimed}%`,
                      background: 'linear-gradient(90deg, #FF6B35, #FFB347)',
                    }}
                  />
                </div>

                <div className="mt-3 sm:mt-4 text-amber-400 font-bold text-lg sm:text-2xl">
                  {spotsRemaining > 0
                    ? `${spotsRemaining.toLocaleString()} spots remaining`
                    : 'SOLD OUT'}
                </div>

                <p className="text-xs text-white/40 mt-2">
                  Live counter • updates every 30 seconds
                </p>

                {error && (
                  <p className="text-xs text-red-300 mt-2">
                    {error} Showing latest saved count.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Pricing */}
          <div className="mb-8 md:mb-12">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black gradient-text mb-1 sm:mb-2">
              $199
            </div>
            <div className="text-white/60 text-sm sm:text-lg">
              One-time payment • Lifetime access • No monthly fees
            </div>
          </div>

          {/* CTA */}
          {spotsRemaining > 0 ? (
            <Link
              href="/signup?tier=founder"
              className="inline-block px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold transition-all duration-200 hover:scale-105 founder-glow"
              style={{
                background: 'linear-gradient(135deg, #FF6B35, #FFB347)',
              }}
            >
              Claim Your Founder Spot
            </Link>
          ) : (
            <div className="inline-block px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold bg-gray-800">
              Sold Out
            </div>
          )}

          <p className="text-white/40 text-xs sm:text-sm mt-4 sm:mt-6">
            Once these {TOTAL_FOUNDERS.toLocaleString()} spots are gone, Founder's Circle
            closes forever.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-10 md:mb-16">
            What Founders Get
          </h3>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Event Access */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">🎉</div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 gradient-text">
                Exclusive Event Access
              </h4>
              <ul className="space-y-3 text-white/80 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Private invitations to all SLTR launch parties</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Free VIP entry to SLTR-hosted events worldwide</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Priority access and VIP sections</span>
                </li>
              </ul>
            </div>

            {/* VIP Status */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">👑</div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 gradient-text">
                VIP Status
              </h4>
              <ul className="space-y-3 text-white/80 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Exclusive Founder&apos;s badge on your profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Priority in discovery (show up first)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Dedicated support with faster response</span>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">💬</div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 gradient-text">
                Exclusive Community
              </h4>
              <ul className="space-y-3 text-white/80 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Private Founder&apos;s channel in SLTR Groups</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Network with {TOTAL_FOUNDERS.toLocaleString()} elite founders</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Direct line to the SLTR team</span>
                </li>
              </ul>
            </div>

            {/* Lifetime Access */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">⚡</div>
              <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 gradient-text">
                Lifetime Access
              </h4>
              <ul className="space-y-3 text-white/80 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>All features forever – $199 one-time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Early access to new features before public</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span>Never pay monthly fees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Scarcity Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-black to-orange-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 md:mb-8">
            This is a{' '}
            <span className="gradient-text">Once-in-a-Lifetime</span> Opportunity
          </h3>
          <p className="text-base sm:text-xl text-white/70 mb-6 md:mb-8 leading-relaxed">
            Only{' '}
            <span className="text-amber-400 font-bold">
              {TOTAL_FOUNDERS.toLocaleString()} people
            </span>{' '}
            will ever have Founder status. Once these spots are claimed, Founder&apos;s
            Circle closes forever. This is not just early access – it is permanent VIP
            status in the SLTR community.
          </p>
          <div className="glass-card rounded-2xl p-6 md:p-8 inline-block">
            <p className="text-lg md:text-2xl font-bold text-amber-400">
              When they&apos;re gone, they&apos;re gone.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-10 md:mb-16">
            Questions?
          </h3>

          <div className="space-y-5 md:space-y-6">
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                What exactly is Founder&apos;s Circle?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                An exclusive, lifetime membership limited to {TOTAL_FOUNDERS.toLocaleString()}{' '}
                people. You get VIP treatment, exclusive event access, priority
                support, and all future features forever for a single $199 payment.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                What happens after {TOTAL_FOUNDERS.toLocaleString()} spots are claimed?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Founder&apos;s Circle closes forever. No one else will ever be able to
                join. You&apos;ll be part of an elite group that can never be
                replicated.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Is this really lifetime access?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Yes. One payment of $199, and you never pay again. All features, all
                updates, all events – forever.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Can I upgrade from free to Founder&apos;s Circle later?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Yes, but only while spots remain. Once we hit{' '}
                {TOTAL_FOUNDERS.toLocaleString()} founders, it is closed permanently.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Is there a refund policy?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Founder&apos;s Circle is a one-time lifetime investment. Review all terms
                before purchase. Contact our support team with any questions before
                committing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 text-center border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-6">
            Ready to Join?
          </h3>
          <p className="text-white/70 text-base md:text-lg mb-8">
            Claim your spot before they're gone forever.
          </p>
          {spotsRemaining > 0 ? (
            <Link
              href="/signup?tier=founder"
              className="inline-block px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold transition-all duration-200 hover:scale-105 founder-glow"
              style={{
                background: 'linear-gradient(135deg, #FF6B35, #FFB347)',
              }}
            >
              Claim Your Founder Spot Now
            </Link>
          ) : (
            <div className="inline-block px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold bg-gray-800">
              Sold Out
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
