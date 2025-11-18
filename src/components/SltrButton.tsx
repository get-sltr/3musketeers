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
      <button
        disabled
        className={`
          bg-black text-white rounded-lg font-semibold 
          border border-white/20
          flex items-center gap-1.5 justify-center
          opacity-50 cursor-wait
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
      >
        <span className="text-white">sltr</span>
        <span className="text-lime-400">∝</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`
        bg-black text-white rounded-lg font-semibold 
        border border-white/20
        hover:border-lime-400/50 hover:shadow-lg hover:shadow-lime-400/20
        transition-all duration-300
        flex items-center gap-1.5 justify-center
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      <span className="text-white">sltr</span>
      <span className="text-lime-400">∝</span>
    </button>
  )
}
