'use client'

import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  feature: string
  onClose: () => void
}

/**
 * Upgrade prompt shown when free users try to access Plus features
 */
export default function UpgradePrompt({ feature, onClose }: UpgradePromptProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl shadow-lime-400/10">
        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lime-400/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2">
          Upgrade to SLTR Pro
        </h2>

        {/* Feature Message */}
        <p className="text-white/70 mb-6">
          <span className="text-lime-400 font-semibold">{feature}</span> is a Pro feature.
          Upgrade to unlock unlimited access.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/pricing')}
          className="w-full py-3 px-6 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-bold rounded-xl hover:opacity-90 transition-all mb-3"
        >
          View Plans
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}

