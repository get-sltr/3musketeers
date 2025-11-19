/**
 * SLTR Upgrade Modal - Reusable Paywall Component
 * Matches SLTR design: Dark theme with lime-400 accents
 */

'use client'

import { useRouter } from 'next/navigation'
import { Feature } from '@/lib/privileges/types'
import { FEATURE_NAMES } from '@/lib/privileges/config'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: Feature
  title?: string
  message?: string
}

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  title,
  message,
}: UpgradeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const featureName = feature ? FEATURE_NAMES[feature] : 'this feature'
  const displayTitle = title || (
    <>
      Upgrade to sltr<span className="text-lime-400" style={{ verticalAlign: 'super', fontSize: '0.7em', position: 'relative', top: '-0.3em' }}>∝</span>
    </>
  )
  const displayMessage =
    message || `${featureName} is available exclusively for sltr∝ members.`

  const handleUpgrade = () => {
    onClose()
    router.push('/sltr-plus')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black border border-lime-400/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>sltr</span>
              <span
                className="text-lime-400"
                style={{
                  verticalAlign: 'super',
                  fontSize: '0.7em',
                  position: 'relative',
                  top: '-0.3em',
                }}
              >
                ∝
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">{displayTitle}</h3>
            <p className="text-white/60 text-sm">{displayMessage}</p>
          </div>

          {/* Features Preview */}
          <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-4 space-y-2">
            <p className="text-lime-400 text-sm font-semibold mb-2">
              sltr∝ includes:
            </p>
            <div className="space-y-1 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                <span>Unlimited Profile Views</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                <span>Video Calls</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                <span>Groups & Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                <span>Travel Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                <span>Unlimited DTFN</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lime-400">✓</span>
                <span>Ad-Free Experience</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center py-4">
            <div className="text-5xl font-black text-lime-400 mb-1">$4.99</div>
            <div className="text-white/60 text-sm">per month</div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-4 rounded-2xl bg-lime-400 text-black font-bold text-lg hover:scale-[1.02] transition-all duration-300"
              style={{ boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)' }}
            >
              Upgrade to sltr∝
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-white/5 text-white/60 font-semibold hover:bg-white/10 transition"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-center text-white/40 text-xs">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  )
}
