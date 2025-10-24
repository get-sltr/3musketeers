'use client'

import { motion } from 'framer-motion'

interface GradientBackgroundProps {
  children: React.ReactNode
  variant?: 'default' | 'dark' | 'vignette' | 'radial'
  className?: string
}

export default function GradientBackground({ 
  children, 
  variant = 'default',
  className = ''
}: GradientBackgroundProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
      case 'dark':
        return 'bg-gradient-to-br from-black via-gray-900 to-black'
      case 'vignette':
        return 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
      case 'radial':
        return 'bg-radial-gradient from-cyan-500/10 via-transparent to-purple-500/10'
      default:
        return 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
    }
  }

  return (
    <div className={`relative min-h-screen ${getVariantStyles()} ${className}`}>
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Vignette effect for content separation */}
      {variant === 'vignette' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Specialized background for different sections
export function SectionBackground({ 
  children, 
  className = '',
  hasVignette = true 
}: {
  children: React.ReactNode
  className?: string
  hasVignette?: boolean
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none" />
      
      {/* Vignette effect */}
      {hasVignette && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Floating particles background
export function ParticleBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-500/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
