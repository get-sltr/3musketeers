'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => router.push('/login'), 800)
    }, 2500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center transition-opacity duration-800 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col items-center space-y-6">
        {/* Glass S Icon with rotating gradient */}
        <div className="relative">
          <div 
            className="w-30 h-30 rounded-3xl bg-white/5 border border-white/20 backdrop-blur-xl flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)'
            }}
          >
            <div 
              className="text-6xl font-black animate-spin"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'whirlpool 4s linear infinite'
              }}
            >
              S
            </div>
          </div>
          
          {/* Pulsing glow effect */}
          <div 
            className="absolute inset-0 rounded-3xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, rgba(255, 0, 255, 0.3) 50%, transparent 70%)',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}
          />
        </div>

        {/* SLTR Text with gradient */}
        <div className="text-center">
          <h1 
            className="text-7xl font-black tracking-wider animate-fade-in-scale"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '72px',
              fontWeight: '900',
              letterSpacing: '0.2em'
            }}
          >
            SLTR
          </h1>
          
          {/* Subtitle */}
          <p 
            className="text-white/60 text-base tracking-widest uppercase mt-4 animate-fade-in"
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.3em'
            }}
          >
            RULES DON'T APPLY
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes whirlpool {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes glow {
          0% {
            opacity: 0.5;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 1.2s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 1.5s ease-out 0.3s both;
        }
      `}</style>
    </div>
  )
}
