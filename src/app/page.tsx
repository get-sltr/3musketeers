'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // For localhost testing, always redirect to app
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost')
      
      if (isLocalhost) {
        router.replace('/app')
        return
      }
    }

    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // If user is logged in, redirect to app
      if (session) {
        router.replace('/app')
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Red Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-red-600 rounded-full blur-[100px] opacity-15 animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-red-800 rounded-full blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-red-600 rounded-full blur-[100px] opacity-15 animate-pulse -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '6s' }} />
      </div>

      {/* Scanlines Effect */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          )`
        }}
      />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <h1 
            className="text-[80px] md:text-[120px] lg:text-[180px] font-black mb-5 leading-none"
            style={{
              background: 'linear-gradient(180deg, #fff 0%, #ff0000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
              letterSpacing: '-8px',
              textShadow: '0 0 80px rgba(255, 0, 0, 0.5)'
            }}
          >
            SLTR
          </h1>
          
          {/* Tagline */}
          <p 
            className="text-2xl md:text-3xl lg:text-[42px] font-black uppercase mb-8 tracking-[4px]"
            style={{
              color: '#ff0000',
              textShadow: '0 0 30px rgba(255, 0, 0, 0.8)'
            }}
          >
            NO RULES APPLY
          </p>

          {/* Subtitle */}
          <p className="text-base md:text-lg lg:text-[22px] text-gray-400 mb-12 max-w-[600px] mx-auto leading-relaxed">
            Raw. Direct. Unapologetic. The hookup app that doesn&apos;t play games.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="px-12 py-5 text-lg font-bold uppercase tracking-[2px] bg-red-600 text-black hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:-translate-y-0.5"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-12 py-5 text-lg font-bold uppercase tracking-[2px] bg-transparent text-white border-2 border-gray-700 hover:border-red-600 hover:text-red-600 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:-translate-y-0.5"
            >
              Log In
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="p-8 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">🔥</div>
              <div className="text-lg font-bold mb-2 text-red-600 uppercase tracking-wide">No Filters</div>
              <div className="text-sm text-gray-400 leading-relaxed">Say what you want. Get what you need.</div>
            </div>

            <div className="p-8 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">⚡</div>
              <div className="text-lg font-bold mb-2 text-red-600 uppercase tracking-wide">Instant Connect</div>
              <div className="text-sm text-gray-400 leading-relaxed">Stop swiping. Start meeting.</div>
            </div>

            <div className="p-8 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-lg font-bold mb-2 text-red-600 uppercase tracking-wide">Real Proximity</div>
              <div className="text-sm text-gray-400 leading-relaxed">See who&apos;s actually nearby.</div>
            </div>

            <div className="p-8 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">🚫</div>
              <div className="text-lg font-bold mb-2 text-red-600 uppercase tracking-wide">Zero BS</div>
              <div className="text-sm text-gray-400 leading-relaxed">No fake profiles. No fake promises.</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.15; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.25; 
            transform: scale(1.1); 
          }
        }
      `}</style>
    </div>
  )
}
