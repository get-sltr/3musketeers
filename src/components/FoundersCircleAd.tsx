'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface FoundersCircleAdProps {
  onInterested?: () => void
}

export default function FoundersCircleAd({ onInterested }: FoundersCircleAdProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (onInterested) {
      onInterested()
    } else {
      // Default: scroll to pricing or open modal
      window.dispatchEvent(new CustomEvent('show_founders_circle'))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* White matte background */}
      <div className="absolute inset-0 bg-white" />

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/20 to-transparent"
        animate={{
          x: isHovered ? ['0%', '100%'] : '0%',
        }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
        {/* Crown icon */}
        <motion.div
          animate={{
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mb-4"
        >
          <svg
            className="w-16 h-16 text-yellow-600 drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </motion.div>

        {/* Title */}
        <h3 className="text-2xl font-black text-yellow-700 mb-2">
          FOUNDER'S CIRCLE
        </h3>

        {/* Price badge */}
        <div className="mb-3 px-4 py-2 rounded-full bg-yellow-600/10 backdrop-blur-sm border-2 border-yellow-600/30">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-yellow-700">$199</span>
            <span className="text-sm text-yellow-600">once</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-1 mb-4 text-yellow-700 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span className="text-yellow-600">✓</span>
            <span>Lifetime Access</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="text-yellow-600">✓</span>
            <span>All Premium Features</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="text-yellow-600">✓</span>
            <span>Exclusive Badge</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="text-yellow-600">✓</span>
            <span>Priority Support</span>
          </p>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold text-sm shadow-lg hover:shadow-yellow-600/50 transition-shadow"
        >
          JOIN NOW
        </motion.button>

        {/* Limited spots indicator */}
        <div className="mt-4 text-xs text-yellow-700 font-semibold animate-pulse">
          🔥 Limited Founding Members
        </div>
      </div>

      {/* Corner sparkle */}
      <div className="absolute top-2 right-2 text-yellow-600 animate-pulse">
        ✨
      </div>
    </motion.div>
  )
}
