'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PlanDuration = '1week' | '1month' | '3months' | '6months'

interface Plan {
  id: PlanDuration
  duration: string
  price: number
  perMonth: number
  discount?: number
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: '1week',
    duration: '1 Week',
    price: 8.99,
    perMonth: 8.99
  },
  {
    id: '1month',
    duration: '1 Month',
    price: 12.99,
    perMonth: 12.99,
    discount: 64
  },
  {
    id: '3months',
    duration: '3 Months',
    price: 27.27,
    perMonth: 9.09,
    discount: 70,
    popular: true
  },
  {
    id: '6months',
    duration: '6 Months',
    price: 49.49,
    perMonth: 8.25,
    discount: 85
  }
]

const features = [
  { icon: '🔓', text: 'Unlimited Profile Views' },
  { icon: '👁️', text: 'See Who Viewed Your Profile' },
  { icon: '💬', text: 'Unlimited Messaging' },
  { icon: '🚫', text: 'Ad-Free Experience' },
  { icon: '⚡', text: 'Priority DTFN Badge' },
  { icon: '📌', text: 'Pin Favorite Users' },
  { icon: '✓', text: 'Read Receipts' },
  { icon: '👥', text: 'Advanced Filters' },
  { icon: '🗺️', text: 'Extended Map Range' },
  { icon: '✈️', text: 'Travel Mode' },
  { icon: '🔒', text: 'Enhanced Privacy Controls' },
  { icon: '📍', text: 'Location Spoofing' },
  { icon: '🎭', text: 'Incognito Browsing' },
  { icon: '📸', text: 'Private Photo Albums' },
  { icon: '🏆', text: 'Profile Boost' }
]

export default function SLTRPlusPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanDuration>('3months')

  const handleContinue = () => {
    router.push(`/checkout/${selectedPlan}`)
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/app" className="text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-black">
            <span className="text-white">SLTR</span>
            <span className="text-lime-400 text-3xl align-super">⁺</span>
          </h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Plans */}
        <div className="space-y-3 mb-8">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'border-lime-400 bg-lime-400/10'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              } ${plan.popular ? 'ring-2 ring-lime-400/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === plan.id
                      ? 'border-lime-400 bg-lime-400'
                      : 'border-white/40'
                  }`}>
                    {selectedPlan === plan.id && (
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-white text-lg font-semibold">{plan.duration}</span>
                  {plan.discount && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold">
                      {plan.discount}% Off
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white text-xl font-bold">${plan.price}</div>
                  {plan.perMonth !== plan.price && (
                    <div className="text-white/60 text-sm">${plan.perMonth.toFixed(2)}/mo</div>
                  )}
                </div>
              </div>
            </button>
          ))}
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
          SLTR<span className="text-lime-400">⁺</span> Subscription. Cancel any time.
        </p>
      </div>
    </div>
  )
}
