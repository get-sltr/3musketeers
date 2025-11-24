'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TourStep {
  id: string
  target: string // CSS selector or data attribute
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  offset?: { x: number; y: number }
}

interface AppTourProps {
  isOpen: boolean
  onClose: () => void
  steps: TourStep[]
}

export default function AppTour({ isOpen, onClose, steps }: AppTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || steps.length === 0) return

    const step = steps[currentStep]
    if (!step) return

    // Find target element
    let element: HTMLElement | null = null
    
    // Try data attribute first
    element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement
    
    // Fallback to CSS selector
    if (!element) {
      element = document.querySelector(step.target) as HTMLElement
    }

    setTargetElement(element)

    if (element) {
      // Calculate tooltip position
      const rect = element.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      const position = step.position || 'bottom'
      const offset = step.offset || { x: 0, y: 0 }

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = rect.top + scrollY - 20
          left = rect.left + scrollX + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + scrollY + 20
          left = rect.left + scrollX + rect.width / 2
          break
        case 'left':
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX - 20
          break
        case 'right':
          top = rect.top + scrollY + rect.height / 2
          left = rect.right + scrollX + 20
          break
        case 'center':
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX + rect.width / 2
          break
      }

      setTooltipPosition({
        top: top + offset.y,
        left: left + offset.x
      })

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }, [currentStep, isOpen, steps])

  if (!isOpen || steps.length === 0) return null

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleFinish = () => {
    localStorage.setItem('app_tour_completed', 'true')
    onClose()
  }

  const handleSkip = () => {
    localStorage.setItem('app_tour_completed', 'true')
    onClose()
  }

  // Calculate spotlight cutout
  const getSpotlightStyle = () => {
    if (!targetElement) return {}

    const rect = targetElement.getBoundingClientRect()
    const padding = 8 // Padding around element

    return {
      clipPath: `polygon(
        0% 0%,
        0% 100%,
        ${rect.left - padding}px 100%,
        ${rect.left - padding}px ${rect.top - padding}px,
        ${rect.right + padding}px ${rect.top - padding}px,
        ${rect.right + padding}px ${rect.bottom + padding}px,
        ${rect.left - padding}px ${rect.bottom + padding}px,
        ${rect.left - padding}px 100%,
        100% 100%,
        100% 0%
      )`
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm"
            style={getSpotlightStyle()}
            onClick={handleSkip}
          />

          {/* Tooltip */}
          {targetElement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed z-[10001] w-full max-w-sm"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translate(-50%, 0)',
              }}
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-2xl">
                {/* Progress indicator */}
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60 font-medium">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                    <span className="text-xs text-lime-400 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-lime-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-lime-400">{step.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Navigation buttons */}
                <div className="mt-6 flex gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-semibold hover:bg-white/10 hover:text-white transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-2 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition"
                  >
                    {currentStep < steps.length - 1 ? 'Next' : 'Got it!'}
                  </button>
                </div>
              </div>

              {/* Arrow pointing to element */}
              <div
                className="absolute w-0 h-0 border-8 border-transparent"
                style={{
                  top: step.position === 'bottom' ? '-16px' : 'auto',
                  bottom: step.position === 'top' ? '-16px' : 'auto',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderBottomColor: step.position === 'bottom' ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                  borderTopColor: step.position === 'top' ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                }}
              />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

// Hook to check if tour should be shown
export function useAppTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('app_tour_completed')
    if (!completed) {
      setShouldShowTour(true)
    }
  }, [])

  return shouldShowTour
}

// Predefined tour steps for the app
export const APP_TOUR_STEPS: TourStep[] = [
  {
    id: 'grid-view',
    target: '[data-tour="grid-view"]',
    title: 'Browse Profiles',
    description: 'Swipe through profiles in grid view. Tap any profile to see more details.',
    position: 'bottom',
  },
  {
    id: 'map-view',
    target: '[data-tour="map-view"]',
    title: 'Explore the Map',
    description: 'Switch to map view to see nearby users and discover new connections.',
    position: 'bottom',
  },
  {
    id: 'eros-button',
    target: '[data-tour="eros-button"]',
    title: 'EROS AI Assistant',
    description: 'Tap the floating EROS button for AI-powered matchmaking, conversation starters, and profile tips.',
    position: 'left',
  },
  {
    id: 'bottom-nav',
    target: '[data-tour="bottom-nav"]',
    title: 'Navigation',
    description: 'Use the bottom navigation to access Messages, Profile, and Settings.',
    position: 'top',
  },
  {
    id: 'location-search',
    target: '[data-tour="location-search"]',
    title: 'Search Locations',
    description: 'Search for any location to explore users in different areas.',
    position: 'bottom',
  },
]

