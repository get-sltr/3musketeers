'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PulseSplashProps {
  isOpen: boolean
  onComplete: () => void
  duration?: number
}

export default function PulseSplash({ isOpen, onComplete, duration = 2500 }: PulseSplashProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Stagger content appearance
      const contentTimer = setTimeout(() => setShowContent(true), 200)
      // Auto-complete after duration
      const completeTimer = setTimeout(() => {
        onComplete()
      }, duration)

      return () => {
        clearTimeout(contentTimer)
        clearTimeout(completeTimer)
      }
    } else {
      setShowContent(false)
    }
  }, [isOpen, duration, onComplete])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between"
          style={{ backgroundColor: '#0a0a12', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Spacer for top */}
          <div className="flex-1" />

          {/* Main content container - vertically centered */}
          <div className="flex flex-col items-center justify-center px-6">
            {/* Animated ECG Line */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-6"
            >
              <svg
                width="200"
                height="60"
                viewBox="0 0 200 60"
                className="overflow-visible"
              >
                {/* ECG path with animated drawing */}
                <motion.path
                  d="M0 30 L30 30 L40 30 L50 10 L60 50 L70 20 L80 35 L90 30 L110 30 L120 15 L130 45 L140 25 L150 32 L160 30 L200 30"
                  fill="none"
                  stroke="#CCFF00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    pathLength: { duration: 1.5, ease: "easeInOut" },
                    opacity: { duration: 0.3 }
                  }}
                />
                {/* Glowing dot that follows the line */}
                <motion.circle
                  r="4"
                  fill="#CCFF00"
                  filter="url(#glow)"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    cx: [0, 70, 140, 200],
                    cy: [30, 20, 25, 30],
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    times: [0, 0.35, 0.7, 1]
                  }}
                />
                {/* Glow filter */}
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            </motion.div>

            {/* PULSE text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl sm:text-6xl font-bold tracking-wider text-white mb-2"
              style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.15em' }}
            >
              PULSE
            </motion.h1>

            {/* by SLTR */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-lg sm:text-xl text-white/80 mb-6"
            >
              by{' '}
              <span className="text-[#CCFF00] font-semibold tracking-widest">
                SLTR
              </span>
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="text-base sm:text-lg text-white/70 text-center max-w-xs"
            >
              Live video groups and channels
            </motion.p>
          </div>

          {/* Spacer for bottom - creates vertical centering */}
          <div className="flex-1" />

          {/* Bottom section - branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={showContent ? { opacity: 1 } : {}}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="pb-8 sm:pb-12 flex flex-col items-center gap-3"
          >
            {/* Innovation tagline */}
            <p className="text-xs sm:text-sm text-white tracking-[0.3em] uppercase">
              Innovative{' '}
              <span className="text-white/40">|</span>{' '}
              Intelligence{' '}
              <span className="text-white/40">|</span>{' '}
              Intuitive
            </p>

            {/* SLTR small */}
            <p className="text-[10px] sm:text-xs text-[#CCFF00]/70 tracking-[0.5em] uppercase">
              S L T R
            </p>

            {/* Copyright */}
            <p className="text-[10px] text-white/30 mt-2">
              All rights reserved. SLTR DIGITAL LLC
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
