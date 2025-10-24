'use client'

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'fullscreen'
  className?: string
  lines?: number
}

export default function LoadingSkeleton({ 
  variant = 'text', 
  className = '',
  lines = 1 
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]"
  
  const variants = {
    text: "h-4 rounded",
    card: "h-32 rounded-xl",
    avatar: "w-12 h-12 rounded-full",
    button: "h-10 rounded-lg",
    fullscreen: "min-h-screen flex items-center justify-center"
  }

  if (variant === 'fullscreen') {
    return (
      <div className={`${baseClasses} ${variants.fullscreen} ${className}`}>
        <div className="text-center">
          <div className={`${baseClasses} w-16 h-16 rounded-full mx-auto mb-4`}></div>
          <div className={`${baseClasses} h-4 w-32 mx-auto rounded`}></div>
        </div>
      </div>
    )
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variants.text} ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} />
  )
}

// Shimmer animation component
export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-800/50 p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] w-12 h-12 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-4 w-3/4 rounded"></div>
          <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-3 w-1/2 rounded"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-3 w-full rounded"></div>
        <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-3 w-5/6 rounded"></div>
      </div>
    </div>
  )
}

// Map loading skeleton
export function MapLoadingSkeleton() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-900 rounded-2xl">
      <div className="text-center">
        <div className="animate-pulse bg-gradient-to-r from-cyan-500/20 via-cyan-400/30 to-cyan-500/20 bg-[length:200%_100%] w-16 h-16 rounded-full mx-auto mb-4"></div>
        <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-4 w-32 mx-auto rounded"></div>
        <p className="text-white/60 text-sm mt-2">Loading map...</p>
      </div>
    </div>
  )
}

// Messages loading skeleton
export function MessagesLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] w-10 h-10 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-4 w-1/4 rounded"></div>
            <div className="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] h-3 w-3/4 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
