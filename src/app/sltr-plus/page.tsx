'use client'

import Link from 'next/link'

export default function SLTRPlusPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
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
          
          .plus-glow {
            box-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-16">
        {/* Background Gradient */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-magenta-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-6 md:mb-8">
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-black tracking-wider mb-2 md:mb-4"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="gradient-text">SLTR+</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm md:text-base tracking-widest uppercase">
              UNLOCK THE FULL EXPERIENCE
            </p>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full glass-card mb-6 md:mb-8">
            <span className="text-2xl sm:text-3xl">⭐</span>
            <span className="text-cyan-400 font-bold text-sm sm:text-lg">
              PREMIUM MEMBERSHIP
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-6 leading-tight">
            Experience SLTR <span className="gradient-text">Unlimited</span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 md:mb-12 max-w-3xl mx-auto">
            Unlock all features, priority matching, and exclusive access.
            <br className="hidden sm:block" />
            <span className="text-cyan-400 font-bold">
              Cancel anytime. No commitment.
            </span>
          </p>

          {/* Pricing */}
          <div className="mb-8 md:mb-12">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black gradient-text mb-1 sm:mb-2">
              $12.99
              <span className="text-2xl sm:text-3xl text-white/60">/mo</span>
            </div>
            <div className="text-white/60 text-sm sm:text-lg">
              Billed monthly • Cancel anytime
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/signup?tier=member"
            className="inline-block px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold transition-all duration-200 hover:scale-105 plus-glow"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
            }}
          >
            Get SLTR+
          </Link>

          <p className="text-white/40 text-xs sm:text-sm mt-4 sm:mt-6">
            Currently free during beta • Lock in early access
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-black to-cyan-950/10">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-10 md:mb-16">
            Free vs SLTR+
          </h3>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Free Tier */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <div className="text-2xl sm:text-3xl mb-3 md:mb-4">🔥</div>
              <h4 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Free</h4>
              <ul className="space-y-3 sm:space-y-4 text-white/70 text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-white/40 mt-0.5">○</span>
                  <span>Basic profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white/40 mt-0.5">○</span>
                  <span>Limited messages</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white/40 mt-0.5">○</span>
                  <span>Grid view only</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white/40 mt-0.5">○</span>
                  <span>Standard support</span>
                </li>
              </ul>
            </div>

            {/* SLTR+ */}
            <div className="glass-card rounded-3xl p-6 md:p-8 ring-2 ring-cyan-500/50 plus-glow">
              <div className="text-2xl sm:text-3xl mb-3 md:mb-4">⭐</div>
              <h4 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 gradient-text">
                SLTR+
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-white text-sm sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>Unlimited messages</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>Map view unlocked</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>See who viewed your profile</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>Priority in discovery</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>Video calls</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>DTFN status</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>Plus badge on profile</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>
                    <strong>Priority support</strong>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Breakdown */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-10 md:mb-16">
            What You Get with SLTR+
          </h3>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">💬</div>
              <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 gradient-text">
                Unlimited Messaging
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Connect with anyone at any time. No limits on conversations or connections.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">🗺️</div>
              <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 gradient-text">
                Map View
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                See everyone nearby on the interactive map. Perfect for spontaneous meetups.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">👁️</div>
              <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 gradient-text">
                Profile Views
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                See who is checking you out. Know who is interested before you message.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">🎯</div>
              <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 gradient-text">
                Priority Discovery
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Show up first in searches and feeds. Get more visibility and connections.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">📹</div>
              <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 gradient-text">
                Video Calls
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Connect face to face before meeting up. Verify who you are talking to.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">🔥</div>
              <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3 gradient-text">
                DTFN Status
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Let others know you are ready to connect right now. No games, just vibes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-black to-magenta-950/10">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-10 md:mb-16">
            Questions?
          </h3>

          <div className="space-y-5 md:space-y-6">
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Can I cancel anytime?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Yes. Cancel whenever you want. No questions asked and no fees.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                What happens if I cancel?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                You keep SLTR+ until the end of your billing period, then revert to the free
                tier.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Is this different from Founder&apos;s Circle?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Yes. SLTR+ is a monthly subscription with unlimited features. Founder&apos;s Circle is a
                one-time $199 lifetime membership with exclusive perks and event access.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Can I upgrade or downgrade?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                You can upgrade from free to SLTR+ anytime. If you want to go back to free, just cancel
                your subscription.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                What payment methods do you accept?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                We accept all major credit and debit cards. Payments are processed securely through Stripe.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h4 className="text-lg md:text-xl font-bold mb-2 gradient-text">
                Is my payment information safe?
              </h4>
              <p className="text-white/70 text-sm md:text-base">
                Absolutely. We use Stripe for all payments, which is PCI-DSS compliant. Your card details
                are never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 text-center border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-6">
            Ready to Unlock Everything?
          </h3>
          <p className="text-white/70 text-base md:text-lg mb-8">
            Start your free trial today. Cancel anytime, no strings attached.
          </p>
          <Link
            href="/signup?tier=member"
            className="inline-block px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold transition-all duration-200 hover:scale-105 plus-glow"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
            }}
          >
            Get SLTR+ Now
          </Link>
        </div>
      </section>
    </div>
  )
}
