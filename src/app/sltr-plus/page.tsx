'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'


const features = [
  { icon: '📹', text: 'Video Calls' },
  { icon: '👥', text: 'Create Groups & Channels' },
  { icon: '✈️', text: 'Travel Mode (worldwide)' },
  { icon: '⚡', text: 'Unlimited DTFN' },
  { icon: '👁️', text: 'See Who Viewed You' },
  { icon: '💬', text: 'Unlimited Messaging' },
  { icon: '🔓', text: 'Unlimited Profile Views' },
  { icon: '🚫', text: 'Ad-Free Experience' },
  { icon: '✓', text: 'Read Receipts' },
  { icon: '🎯', text: 'Advanced Filters' },
  { icon: '🗺️', text: 'Extended Map Range' },
  { icon: '🔒', text: 'Enhanced Privacy Controls' },
  { icon: '📍', text: 'Location Spoofing' },
  { icon: '🎭', text: 'Incognito Mode' },
  { icon: '📸', text: 'Private Photo Albums' },
  { icon: '🏆', text: 'Profile Boost' }
]

export default function SLTRPlusPage() {
  const router = useRouter()

  const handleContinue = () => {
    router.push('/checkout/member')
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="w-10" />
          <h1 className="text-2xl font-black">
            <span className="text-white">sltr</span>
            <span className="text-lime-400" style={{ verticalAlign: 'super', fontSize: '1.2em', position: 'relative', top: '-0.3em' }}>∝</span>
          </h1>
          <Link href="/app" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Simple Pricing */}
        <div className="mb-8 text-center">
          <div className="text-6xl font-black text-lime-400 mb-2">
            $4.99
          </div>
          <div className="text-xl text-white/60 mb-4">
            per month
          </div>
          <p className="text-white/50 text-sm">
            Simple. Transparent. Cancel anytime.
          </p>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-white text-xl font-bold mb-4">Here's everything you'll get...</h2>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/80">
                <span className="text-2xl">{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl bg-lime-400 text-black font-bold text-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
          style={{ boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)' }}
        >
          Continue
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p className="text-center text-white/40 text-sm mt-4">
          $4.99 billed monthly. Cancel anytime with no penalties.
        </p>
      </div>
    </div>
  )
}
