'use client'

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useState, useEffect } from 'react'

interface MicroInteractionsProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'button' | 'card' | 'icon'
  sound?: boolean
}

export default function MicroInteractions({ 
  children, 
  className = '', 
  onClick,
  variant = 'button',
  sound = true 
}: MicroInteractionsProps) {
  const [isPressed, setIsPressed] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useTransform(y, [-100, 100], [30, -30])
  const rotateY = useTransform(x, [-100, 100], [-30, 30])
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  // Play sound effect
  const playSound = () => {
    if (sound && typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = event.clientX - centerX
    const distanceY = event.clientY - centerY
    
    x.set(distanceX)
    y.set(distanceY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleMouseDown = () => {
    setIsPressed(true)
    playSound()
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'button':
        return 'cursor-pointer select-none'
      case 'card':
        return 'cursor-pointer select-none'
      case 'icon':
        return 'cursor-pointer select-none'
      default:
        return 'cursor-pointer select-none'
    }
  }

  return (
    <motion.div
      className={`${getVariantStyles()} ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        rotateX: variant === 'card' ? rotateX : 0,
        rotateY: variant === 'card' ? rotateY : 0,
        x: springX,
        y: springY,
        scale: isPressed ? 0.95 : 1,
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      {children}
    </motion.div>
  )
}

// Specialized button component with enhanced micro-interactions
export function InteractiveButton({ 
  children, 
  className = '', 
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600'
      case 'secondary':
        return 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
      case 'ghost':
        return 'text-white/60 hover:text-white hover:bg-white/10'
      default:
        return 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm'
      case 'medium':
        return 'px-4 py-2 text-base'
      case 'large':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  return (
    <MicroInteractions
      className={`rounded-lg font-medium transition-all duration-300 ${getVariantStyles()} ${getSizeStyles()} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={disabled ? undefined : onClick}
      variant="button"
    >
      {children}
    </MicroInteractions>
  )
}

// Card component with 3D tilt effect
export function InteractiveCard({ 
  children, 
  className = '',
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <MicroInteractions
      className={`glass-bubble border border-white/20 rounded-xl overflow-hidden ${className}`}
      onClick={onClick}
      variant="card"
    >
      {children}
    </MicroInteractions>
  )
}
