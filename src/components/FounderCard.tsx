'use client'

import { useState } from 'react'

interface FounderCardProps {
  onShare: (link: string) => void
}

export default function FounderCard({ onShare }: FounderCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const founderLink = 'https://getsltr.com/founder?ref=founder'
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(founderLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleShare = () => {
    onShare(founderLink)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`relative w-96 h-64 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-orange-500/20 rounded-2xl border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                SLTR
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Founder Card</h2>
                <p className="text-white/70 text-sm">Exclusive Access</p>
              </div>
            </div>

            {/* Founder Badge */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold text-center">
              🔥 FOUNDER'S CIRCLE
            </div>

            {/* Incentive */}
            <div className="bg-white/10 border border-cyan-500/30 rounded-xl p-4">
              <h3 className="text-cyan-400 font-bold text-lg mb-2 flex items-center gap-2">
                🔥 Lifetime Membership
              </h3>
              <p className="text-white/90 text-sm">
                Join the founder's circle and get <strong>FREE lifetime access</strong> to all premium features, Blaze AI, and exclusive benefits!
              </p>
            </div>

            {/* QR Section */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl">
                📱
              </div>
              <div>
                <h4 className="text-white font-semibold">Scan to Join</h4>
                <p className="text-white/60 text-xs">Use this link for lifetime access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-red-500/20 rounded-2xl border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Your Founder Link</h2>
              <p className="text-white/70 text-sm">Share this to give lifetime access</p>
            </div>

            {/* Link Display */}
            <div className="bg-white/10 border border-purple-500/30 rounded-xl p-4">
              <div className="text-white/90 text-sm font-mono break-all mb-3">
                {founderLink}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyLink()
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-sm"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-sm"
                >
                  📤 Share
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Founder Benefits:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                <div className="flex items-center gap-1">
                  <span>🔥</span>
                  <span>Lifetime Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🤖</span>
                  <span>Blaze AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💎</span>
                  <span>Premium</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⚡</span>
                  <span>Priority</span>
                </div>
              </div>
            </div>

            {/* Flip Hint */}
            <div className="text-center text-white/50 text-xs">
              Tap to flip back
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {/* Close modal */}}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
