'use client'

import Link from 'next/link'
import { memo } from 'react'

// Static data moved outside component for better performance
const FEATURES = [
  {
    title: 'Nearby Guys',
    description: 'See who\'s around you right now. Real distance, real time.',
    icon: '📍'
  },
  {
    title: 'Instant Messages',
    description: 'Chat immediately. No waiting, no games.',
    icon: '⚡'
  },
  {
    title: 'Filter What Matters',
    description: 'Find exactly what you\'re looking for. Be specific.',
    icon: '🎯'
  },
  {
    title: 'Save Favorites',
    description: 'Keep the ones you like. Come back anytime.',
    icon: '❤️'
  },
  {
    title: 'Stay Safe',
    description: 'Block, report, control who sees you.',
    icon: '🔒'
  },
  {
    title: 'Show Your Vibe',
    description: 'Let people know what you\'re into. Be real.',
    icon: '🔥'
  }
] as const

const STEPS = [
  {
    step: 1,
    title: "Create Profile",
    description: "Add photos, set your position, what you're into. Takes 2 minutes.",
    icon: "👤"
  },
  {
    step: 2,
    title: "Browse Nearby",
    description: "See who's around. Filter by what matters. Check their vibe.",
    icon: "🔍"
  },
  {
    step: 3,
    title: "Connect",
    description: "Send a message. Make plans. Meet up. That's it.",
    icon: "💬"
  }
] as const

// Memoized components for better performance
const FeatureCard = memo(({ feature }: { feature: typeof FEATURES[number] }) => (
  <div className="bg-black/50 p-8 border border-gray-800 hover:border-gray-600 transition-colors">
    <div className="text-4xl mb-4">{feature.icon}</div>
    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
    <p className="text-gray-300 text-lg">{feature.description}</p>
  </div>
))
FeatureCard.displayName = 'FeatureCard'

const StepItem = memo(({ item }: { item: typeof STEPS[number] }) => (
  <div className="flex items-center gap-8">
    <div className="bg-white text-black w-16 h-16 flex items-center justify-center text-2xl font-bold">
      {item.step}
    </div>
    <div className="flex-1">
      <h3 className="text-3xl font-bold text-white mb-2">{item.title}</h3>
      <p className="text-gray-300 text-xl">{item.description}</p>
    </div>
    <div className="text-4xl">{item.icon}</div>
  </div>
))
StepItem.displayName = 'StepItem'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black relative">
      {/* Dark purple gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-black" />
      
      {/* Animated gradient orbs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-white text-3xl font-black tracking-wider">
            SLTR
          </div>
          <div className="flex gap-4">
            <Link 
              href="/login"
              className="px-6 py-2 text-white/80 hover:text-white transition-colors text-lg"
            >
              Login
            </Link>
            <Link 
              href="/signup"
              className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors text-lg rounded"
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern 3D Glassmorphic Design */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-7xl mx-auto">
          <div className="relative">
            {/* Gradient glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 opacity-30 blur-3xl rounded-3xl" />
            
            {/* Main glass card */}
            <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-600/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Glass reflection effect */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              
              {/* Content Container */}
              <div className="relative z-10 px-8 py-16 md:px-16 md:py-24">
                <div className="text-center max-w-4xl mx-auto">
                  {/* Main headline */}
                  <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
                    SLTR
                  </h1>
                  
                  {/* Tagline */}
                  <p className="text-3xl md:text-4xl lg:text-5xl text-white mb-8 font-semibold">
                    Rules Don&apos;t Apply
                  </p>

                  {/* Subheading */}
                  <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Meet real guys nearby. No games, just authentic connections.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Link
                      href="/signup"
                      className="group relative px-10 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white font-bold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden"
                    >
                      <span className="relative z-10">Get Started</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                    <Link
                      href="/app"
                      className="px-10 py-4 border-2 border-white/60 text-white font-bold text-lg rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
                    >
                      Download App
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-16">
            Why SLTR?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-16">
            Get Started
          </h2>
          <div className="space-y-12">
            {STEPS.map((item, index) => (
              <StepItem key={index} item={item} />
            ))}
          </div>
          <div className="text-center mt-16">
            <Link
              href="/signup"
              className="inline-block px-12 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-colors rounded"
            >
              START NOW
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help</Link></li>
                <li><Link href="/safety" className="hover:text-white transition-colors">Safety</Link></li>
                <li><Link href="/report" className="hover:text-white transition-colors">Report</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Follow</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="X (Twitter)">𝕏</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">📷</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">📘</a>
              </div>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-8">
            <p>© 2025 SLTR. All rights reserved.</p>
            <p className="mt-1">18+ only. Be safe, be real.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
