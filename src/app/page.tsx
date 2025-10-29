'use client'

import Link from 'next/link'
import { memo } from 'react'

// Static data
const FEATURES = [
  {
    title: 'Instant',
    description: 'Real-time connections. Zero lag.',
    icon: '⚡'
  },
  {
    title: 'Precise',
    description: 'Find exactly who you\'re looking for.',
    icon: '🎯'
  },
  {
    title: 'Raw',
    description: 'No filters. No fake profiles.',
    icon: '🔥'
  },
  {
    title: 'Fast',
    description: 'Stop swiping. Start living.',
    icon: '🚀'
  }
] as const

const FeatureCard = memo(({ feature }: { feature: typeof FEATURES[number] }) => (
  <div className="group p-10 bg-black/20 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:bg-black/30 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-magenta-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    <div className="relative z-10">
      <div className="text-5xl mb-6">{feature.icon}</div>
      <h3 className="text-2xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">{feature.title}</h3>
      <p className="text-gray-400 text-lg">{feature.description}</p>
    </div>
  </div>
))
FeatureCard.displayName = 'FeatureCard'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* Neon Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-neonPulse" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] bg-magenta-500/20 rounded-full blur-[120px] animate-neonPulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)',
        animation: 'scan 8s linear infinite'
      }} />

      {/* Navigation */}
      <nav className="relative z-50 p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-500 text-4xl font-black tracking-wider">
            SLTR
          </div>
          <div className="flex gap-4 items-center">
            <Link 
              href="/login"
              className="px-8 py-3 text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-semibold border border-cyan-500/30 hover:border-cyan-500/60 backdrop-blur-sm"
            >
              Log In
            </Link>
            <Link 
              href="/signup"
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-magenta-500 text-black font-bold hover:scale-105 transition-transform text-lg shadow-[0_0_30px_rgba(0,255,255,0.5)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-5xl mx-auto text-center">
          {/* Logo */}
          <h1 className="text-[clamp(90px,16vw,200px)] font-black leading-[0.9] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-magenta-500 drop-shadow-[0_0_40px_rgba(0,255,255,0.5)] animate-logoGlow" style={{ letterSpacing: '-6px' }}>
            SLTR
          </h1>
          
          {/* Tagline */}
          <p className="text-[clamp(26px,4.5vw,48px)] font-black mb-8 text-cyan-400 uppercase tracking-[6px]" style={{
            textShadow: '0 0 10px rgba(0,255,255,0.8), 0 0 20px rgba(0,255,255,0.6), 0 0 30px rgba(0,255,255,0.4)'
          }}>
            NO RULES APPLY
          </p>

          {/* Subtitle */}
          <p className="text-[clamp(16px,2.5vw,22px)] text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The future of connection. No games. No limits. Just real energy.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="px-16 py-6 bg-gradient-to-r from-cyan-500 to-magenta-500 text-black font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,0,255,0.3)]"
            >
              GET STARTED
            </Link>
            <Link
              href="/login"
              className="px-16 py-6 border-2 border-cyan-500 text-cyan-400 font-bold text-xl hover:bg-cyan-500/10 transition-all shadow-[0_0_30px_rgba(0,255,255,0.3)]"
            >
              LOG IN
            </Link>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link 
              href="/forgot-password"
              className="text-gray-500 hover:text-cyan-400 transition-colors text-sm"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 bg-black/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-16 uppercase tracking-wider">
            Why SLTR
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-cyan-500/20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">© 2025 SLTR. All rights reserved.</p>
          <p className="text-gray-600 text-xs mt-2">18+ only. Be safe, be real.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        @keyframes neonPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }

        @keyframes logoGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }

        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }
      `}</style>
    </div>
  )
}
