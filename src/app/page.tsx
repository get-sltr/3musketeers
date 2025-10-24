'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [showMainContent, setShowMainContent] = useState(false)

  const splashText = "When was the last time you did something for the first time?"

  useEffect(() => {
    setMounted(true)
    
    // Typewriter effect
    let index = 0
    const typeInterval = setInterval(() => {
      if (index < splashText.length) {
        setTypewriterText(splashText.slice(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
        // Show cursor blinking for 3 seconds
        setShowCursor(true)
        setTimeout(() => {
          setShowSplash(true)
          // Wait a bit more then show main content
          setTimeout(() => {
            setShowMainContent(true)
          }, 500)
        }, 3000)
      }
    }, 50) // Adjust speed here

    return () => clearInterval(typeInterval)
  }, [])

  return (
    <div className="min-h-screen bg-black relative">
      {/* Splash Screen */}
      {!showMainContent && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-2xl md:text-4xl font-light leading-relaxed max-w-4xl mx-auto">
              {typewriterText}
              {showCursor && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show after splash */}
      {showMainContent && (
        <div className="splash-reveal">
          {/* Dark, moody background */}
          <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>
          
          {/* Subtle texture overlay */}
          <div className="fixed inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

      {/* Navigation - Minimal and bold */}
      <nav className="relative z-50 p-6">
        <div className="flex justify-between items-center">
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
              className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors text-lg"
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Bold and direct */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto">
          
          {/* Main headline - Raw and direct */}
          <h1 className="text-8xl md:text-9xl font-black text-white mb-8 tracking-tight">
            SLTR
          </h1>
          
          {/* Tagline - Bold and clear */}
          <p className="text-4xl md:text-5xl text-white mb-6 font-bold">
            RULES DON'T APPLY
          </p>

          {/* Subheading - Direct and authentic */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Meet real guys nearby. No bullshit, no games. Just real connections when you want them.
          </p>

          {/* Stats - Simple and impactful */}
          <div className="flex justify-center gap-12 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">New</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Just Launched</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Always On</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">Real</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Connections</div>
            </div>
          </div>

          {/* CTA - Bold and simple */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/signup"
              className="px-12 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-colors"
            >
              JOIN NOW - IT'S FREE
            </Link>
            <Link
              href="/app"
              className="px-12 py-4 border-2 border-white text-white font-bold text-xl hover:bg-white hover:text-black transition-colors"
            >
              EXPLORE
            </Link>
          </div>
        </div>
      </section>

      {/* Features - Simple and direct */}
      <section className="relative z-10 py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-16">
            Why SLTR?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
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
            ].map((feature, index) => (
              <div key={index} className="bg-black/50 p-8 border border-gray-800 hover:border-gray-600 transition-colors">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Simple steps */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-16">
            Get Started
          </h2>

          <div className="space-y-12">
            {[
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
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-8">
                <div className="bg-white text-black w-16 h-16 flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-xl">{item.description}</p>
                </div>
                <div className="text-4xl">{item.icon}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/signup"
              className="inline-block px-12 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-colors"
            >
              START NOW
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
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
                <a href="#" className="text-gray-400 hover:text-white transition-colors">𝕏</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">📷</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">📘</a>
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
      )}

      {/* Custom styles for splash effect */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .splash-reveal {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}