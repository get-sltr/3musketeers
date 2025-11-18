'use client'

import { useRouter } from 'next/navigation'

interface SltrButtonProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export default function SltrButton({
  size = 'md', 
  className = '',
  fullWidth = false 
}: UpgradeButtonProps) {
  const router = useRouter()

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      onClick={() => router.push('/pricing')}
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
