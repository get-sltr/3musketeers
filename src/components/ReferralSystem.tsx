'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ReferralSystemProps {
  userId: string
}

export default function ReferralSystem({ userId }: ReferralSystemProps) {
  const [referralCode, setReferralCode] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [isFounder, setIsFounder] = useState(false)
  const [referrals, setReferrals] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadReferralData()
  }, [userId])

  const loadReferralData = async () => {
    try {
      // Get user's referral code
      const { data: userData } = await supabase
        .from('profiles')
        .select('referral_code, is_founder')
        .eq('id', userId)
        .single()

      if (userData) {
        setReferralCode(userData.referral_code || generateReferralCode())
        setIsFounder(userData.is_founder || false)
      }

      // Get referral count
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)

      if (referralData) {
        setReferralCount(referralData.length)
        setReferrals(referralData)
      }
    } catch (error) {
      console.error('Error loading referral data:', error)
    }
  }

  const generateReferralCode = () => {
    return `SLTR${Math.random().toString(36).substr(2, 8).toUpperCase()}`
  }

  const handleShareReferral = async () => {
    const referralLink = `https://getsltr.com/signup?ref=${referralCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SLTR - The Future of Social Connection',
          text: 'Get lifetime free access to SLTR with my founder link!',
          url: referralLink
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(referralLink)
        alert('Referral link copied to clipboard!')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  const getReferralRewards = () => {
    if (isFounder) {
      return [
        { milestone: 5, reward: 'EROS Premium Features' },
        { milestone: 10, reward: 'Exclusive Founder Badge' },
        { milestone: 25, reward: 'Priority Support' },
        { milestone: 50, reward: 'Custom Profile Themes' },
        { milestone: 100, reward: "Founder's Circle Access" }
      ]
    } else {
      return [
        { milestone: 3, reward: '1 Month Premium Free' },
        { milestone: 10, reward: '3 Months Premium Free' },
        { milestone: 25, reward: '6 Months Premium Free' },
        { milestone: 50, reward: '1 Year Premium Free' },
        { milestone: 100, reward: 'Lifetime Premium' }
      ]
    }
  }

  return (
    <div className="glass-bubble p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🔥</div>
        <div>
          <h3 className="text-white text-xl font-bold">
            {isFounder ? 'Founder Referral System' : 'Referral Program'}
          </h3>
          <p className="text-white/60 text-sm">
            {isFounder ? 'Share your founder link for lifetime access' : 'Earn rewards by referring friends'}
          </p>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{referralCount}</div>
          <div className="text-white/70 text-sm">Referrals</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {isFounder ? '∞' : '0'}
          </div>
          <div className="text-white/70 text-sm">
            {isFounder ? 'Lifetime Access' : 'Premium Days'}
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="text-white font-semibold mb-2 block">Your Referral Link:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={`https://getsltr.com/signup?ref=${referralCode}`}
            readOnly
            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm"
          />
          <button
            onClick={handleShareReferral}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
          >
            📤 Share
          </button>
        </div>
      </div>

      {/* Rewards */}
      <div className="mb-6">
        <h4 className="text-white font-semibold mb-3">Referral Rewards:</h4>
        <div className="space-y-2">
          {getReferralRewards().map((reward, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  referralCount >= reward.milestone 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/10 text-white/60'
                }`}>
                  {reward.milestone}
                </div>
                <span className="text-white/90 text-sm">{reward.reward}</span>
              </div>
              {referralCount >= reward.milestone && (
                <div className="text-green-400 text-sm">✅</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Referrals */}
      {referrals.length > 0 && (
        <div>
          <h4 className="text-white font-semibold mb-3">Recent Referrals:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {referrals.slice(0, 5).map((referral, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {referral.referred_user_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {referral.referred_user_name || 'Anonymous'}
                  </div>
                  <div className="text-white/60 text-xs">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-green-400 text-sm">✅</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Founder Badge */}
      {isFounder && (
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👑</span>
            <span className="text-orange-400 font-bold">Founder's Circle</span>
          </div>
          <p className="text-white/90 text-sm">
            You're part of the exclusive founder's circle! Share your link to give others lifetime access.
          </p>
        </div>
      )}
    </div>
  )
}
