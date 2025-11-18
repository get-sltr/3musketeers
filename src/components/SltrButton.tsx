'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SltrButtonProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export default function SltrButton({
  size = 'md', 
  className = '',
  fullWidth = false 
}: SltrButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Not logged in - button will go to pricing page
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      // User is subscribed if they have 'member', 'founder', or 'blackcard' tier
      if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (isSubscribed) {
      // Already subscribed - go to app/grid
      router.push('/app')
    } else {
      // Not subscribed - go to pricing page
      router.push('/pricing')
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <p className="text-white/80 text-sm text-center font-medium" style={{
          textShadow: '0 0 15px rgba(204, 255, 0, 0.5)'
        }}>
          Your experience increases in proportion to your membership.
        </p>
        <button
          disabled
          className="w-full px-6 py-4 bg-black text-white font-bold text-lg rounded-full border-2 border-white/30 opacity-50 cursor-wait flex items-center justify-center"
        >
          <span className="font-black tracking-[0.3em]">sltr</span>
          <span className="text-lime-400 text-xl font-bold relative -top-2 ml-0.5">∝</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-white/80 text-sm text-center font-medium" style={{
        textShadow: '0 0 15px rgba(204, 255, 0, 0.5)'
      }}>
        Your experience increases in proportion to your membership.
      </p>
      <button
        onClick={handleClick}
        className="w-full px-6 py-4 bg-black hover:bg-black text-white font-bold text-lg rounded-full border-2 border-lime-400/30 hover:border-lime-400 hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all duration-300 flex items-center justify-center"
      >
        <span className="font-black tracking-[0.3em]">sltr</span>
        <span className="text-lime-400 text-xl font-bold relative -top-2 ml-0.5">∝</span>
      </button>
    </div>
  )
}
